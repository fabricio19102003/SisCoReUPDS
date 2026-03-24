import os
import logging
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.config import settings
from app.db.database import get_db
from app.models.periodo import Periodo
from app.models.analisis import Analisis, AnalisisDetalleSemestre, AnalisisDetalleGrupo, Repitente
from app.services.malla_service import obtener_malla_dict
from app.services.parser_excel import procesar_excel
from app.services.analizador import generar_estadisticas, obtener_configs_grupos, sort_key_grupo

router = APIRouter(prefix="/api", tags=["Upload y Análisis"])


@router.post("/upload")
async def subir_y_analizar(
    archivo: UploadFile = File(...),
    periodo_id: int = Form(...),
    db: Session = Depends(get_db),
):
    # Validar período
    periodo = db.query(Periodo).filter(Periodo.id == periodo_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Período no encontrado")

    # Validar archivo
    if not archivo.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="El archivo debe ser .xlsx o .xls")

    contenido = await archivo.read()
    size_mb = len(contenido) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"El archivo excede el límite de {settings.MAX_UPLOAD_SIZE_MB} MB")

    # Guardar archivo temporalmente
    ruta_archivo = os.path.join(settings.UPLOAD_DIR, archivo.filename)
    with open(ruta_archivo, "wb") as f:
        f.write(contenido)

    try:
        # Cargar malla
        malla = obtener_malla_dict(db)
        if not malla:
            raise HTTPException(status_code=400, detail="No hay malla curricular cargada. Sube la malla primero.")

        # Procesar Excel
        registros, materias_no_encontradas = procesar_excel(ruta_archivo, malla)
        if not registros:
            raise HTTPException(status_code=400, detail="No se pudieron extraer registros del archivo Excel")

        # Obtener configuración de grupos
        configs_grupos = obtener_configs_grupos(db, periodo_id)

        # Generar estadísticas
        stats = generar_estadisticas(registros, configs_grupos)

        # Guardar análisis en BD
        analisis = Analisis(
            periodo_id=periodo_id,
            archivo_nombre=archivo.filename,
            total_unicos=stats["total_estudiantes_unicos"],
            total_repitentes=len(stats["repitentes"]),
            materias_no_encontradas=sorted(materias_no_encontradas),
        )
        db.add(analisis)
        db.flush()

        # Guardar detalle por semestre
        for sem in sorted(stats["estudiantes_por_semestre"].keys()):
            unicos = len(stats["estudiantes_por_semestre"][sem])
            rep = len(stats["repitentes_por_semestre"].get(sem, set()))
            detalle = AnalisisDetalleSemestre(
                analisis_id=analisis.id,
                semestre=sem,
                unicos=unicos,
                regulares=unicos - rep,
                repitentes=rep,
            )
            db.add(detalle)

        # Guardar detalle por grupo
        for sem in sorted(stats["estudiantes_por_semestre"].keys()):
            if sem in configs_grupos:
                _, grupo_a_letras, grupo_info = configs_grupos[sem]
            else:
                grupo_a_letras = {}
                grupo_info = {}

            grupos_del_sem = {}
            for (s, g), ids in stats["grupo_real_semestre"].items():
                if s == sem:
                    grupos_del_sem[g] = ids

            for grupo in sorted(grupos_del_sem.keys(), key=lambda g: sort_key_grupo(g, grupo_info)):
                ids = grupos_del_sem[grupo]
                count = len(ids)
                info = grupo_info.get(grupo)
                rep_g = sum(1 for eid in ids if eid in stats["repitentes_por_semestre"].get(sem, set()))

                # Desglose por letra
                letras_desglose = {}
                if grupo in grupo_a_letras:
                    for letra in grupo_a_letras[grupo]:
                        cl = len(stats["grupo_real_letra_semestre"].get((sem, grupo, letra), set()))
                        if cl > 0:
                            letras_desglose[letra] = cl

                turno_nombre = info["turno_nombre"] if info else "?"

                detalle_grupo = AnalisisDetalleGrupo(
                    analisis_id=analisis.id,
                    semestre=sem,
                    nombre_grupo=grupo,
                    turno=turno_nombre,
                    matriculados=count,
                    repitentes_count=rep_g,
                    letras_desglose=letras_desglose,
                )
                db.add(detalle_grupo)

        # Guardar repitentes
        for est in stats["repitentes"]:
            repitente = Repitente(
                analisis_id=analisis.id,
                estudiante_id=est["id"],
                nombre=est["nombre"],
                semestre_principal=est["semestre_principal"],
                semestres_donde_repite=est["semestres_donde_repite"],
                todos_los_semestres=est["todos_los_semestres"],
            )
            db.add(repitente)

        # Guardar listas de estudiantes por grupo para impresión de listas
        estudiantes_por_grupo = {}
        for r in registros:
            if r["semestre"] is None:
                continue
            sem = r["semestre"]
            letra = r["letra_grupo"]
            if sem in configs_grupos:
                letra_a_grupo_map, _, _ = configs_grupos[sem]
            else:
                letra_a_grupo_map = {}
            grupo_real = letra_a_grupo_map.get(letra, letra)
            key = f"{sem}_{grupo_real}"
            if key not in estudiantes_por_grupo:
                estudiantes_por_grupo[key] = {"semestre": sem, "grupo": grupo_real, "estudiantes": {}}
            for est in r["estudiantes"]:
                estudiantes_por_grupo[key]["estudiantes"][est["id"]] = est["nombre"]

        # Convertir a formato serializable (lista de estudiantes únicos por grupo)
        datos_completos_json = []
        for key, info in estudiantes_por_grupo.items():
            lista_est = [{"id": eid, "nombre": nombre} for eid, nombre in sorted(info["estudiantes"].items(), key=lambda x: x[1])]
            datos_completos_json.append({
                "semestre": info["semestre"],
                "grupo": info["grupo"],
                "estudiantes": lista_est,
            })
        datos_completos_json.sort(key=lambda x: (x["semestre"], x["grupo"]))
        analisis.datos_completos = datos_completos_json

        # Guardar datos por materia (cada registro = una materia + letra)
        datos_por_materia_json = []
        for r in registros:
            if r["semestre"] is None:
                continue
            sem = r["semestre"]
            letra = r["letra_grupo"]
            if sem in configs_grupos:
                letra_a_grupo_map, _, _ = configs_grupos[sem]
            else:
                letra_a_grupo_map = {}
            grupo_real = letra_a_grupo_map.get(letra, letra)

            datos_por_materia_json.append({
                "codigo": r["codigo_materia"],
                "nombre": r.get("nombre_malla") or r.get("nombre_materia") or r["codigo_materia"],
                "semestre": sem,
                "letra": letra,
                "grupo": grupo_real,
                "total_estudiantes": len(r["estudiantes"]),
                "estudiantes": sorted(r["estudiantes"], key=lambda e: e["nombre"]),
            })
        datos_por_materia_json.sort(key=lambda x: (x["semestre"], x["codigo"], x["letra"]))
        analisis.datos_por_materia = datos_por_materia_json

        db.commit()
        db.refresh(analisis)

        return {
            "analisis_id": analisis.id,
            "archivo": archivo.filename,
            "total_registros_procesados": len(registros),
            "total_estudiantes_unicos": stats["total_estudiantes_unicos"],
            "total_repitentes": len(stats["repitentes"]),
            "materias_no_encontradas": sorted(materias_no_encontradas),
            "semestres_detectados": sorted(stats["estudiantes_por_semestre"].keys()),
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Error procesando archivo Excel")
        raise HTTPException(status_code=500, detail=f"Error interno al procesar: {type(e).__name__}: {str(e)}")
    finally:
        # Limpiar archivo temporal
        if os.path.exists(ruta_archivo):
            os.remove(ruta_archivo)
