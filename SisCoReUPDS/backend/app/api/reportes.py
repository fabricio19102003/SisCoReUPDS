from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.analisis import Analisis, AnalisisDetalleSemestre, AnalisisDetalleGrupo, Repitente
from app.schemas.reporte import (
    AnalisisResumenResponse,
    AnalisisCompletoResponse,
    DetalleSemestreResponse,
    DetalleGrupoResponse,
    RepitienteResponse,
)
from app.services.analizador import obtener_configs_grupos
from app.services.malla_service import obtener_malla_dict
from app.services.parser_excel import procesar_excel
from app.services.analizador import generar_estadisticas
from app.services.exportador import exportar_excel, exportar_pdf, exportar_listas_pdf, exportar_repitentes_excel, exportar_repitentes_pdf

router = APIRouter(prefix="/api/analisis", tags=["Reportes y Análisis"])


def _obtener_analisis(analisis_id: int, db: Session) -> Analisis:
    analisis = db.query(Analisis).filter(Analisis.id == analisis_id).first()
    if not analisis:
        raise HTTPException(status_code=404, detail="Análisis no encontrado")
    return analisis


@router.get("/", response_model=list[AnalisisResumenResponse])
def listar_analisis(db: Session = Depends(get_db)):
    analisis_list = db.query(Analisis).order_by(Analisis.fecha_analisis.desc()).all()
    resultados = []
    for a in analisis_list:
        resultados.append(AnalisisResumenResponse(
            id=a.id,
            periodo_id=a.periodo_id,
            periodo_nombre=a.periodo.nombre if a.periodo else None,
            fecha_analisis=a.fecha_analisis,
            archivo_nombre=a.archivo_nombre,
            total_unicos=a.total_unicos,
            total_repitentes=a.total_repitentes,
            materias_no_encontradas=a.materias_no_encontradas or [],
        ))
    return resultados


@router.get("/{analisis_id}", response_model=AnalisisCompletoResponse)
def obtener_analisis_completo(analisis_id: int, db: Session = Depends(get_db)):
    analisis = _obtener_analisis(analisis_id, db)

    resumen = AnalisisResumenResponse(
        id=analisis.id,
        periodo_id=analisis.periodo_id,
        periodo_nombre=analisis.periodo.nombre if analisis.periodo else None,
        fecha_analisis=analisis.fecha_analisis,
        archivo_nombre=analisis.archivo_nombre,
        total_unicos=analisis.total_unicos,
        total_repitentes=analisis.total_repitentes,
        materias_no_encontradas=analisis.materias_no_encontradas or [],
    )

    detalle_semestres = []
    for ds in analisis.detalle_semestres:
        pct = round(ds.repitentes / ds.unicos * 100, 1) if ds.unicos > 0 else 0
        detalle_semestres.append(DetalleSemestreResponse(
            semestre=ds.semestre,
            unicos=ds.unicos,
            regulares=ds.regulares,
            repitentes=ds.repitentes,
            porcentaje_repitentes=pct,
        ))
    detalle_semestres.sort(key=lambda x: x.semestre)

    detalle_grupos = []
    for dg in analisis.detalle_grupos:
        detalle_grupos.append(DetalleGrupoResponse(
            semestre=dg.semestre,
            nombre_grupo=dg.nombre_grupo,
            turno=dg.turno,
            matriculados=dg.matriculados,
            repitentes_count=dg.repitentes_count,
            regulares=dg.matriculados - dg.repitentes_count,
            letras_desglose=dg.letras_desglose or {},
        ))
    detalle_grupos.sort(key=lambda x: (x.semestre, x.nombre_grupo))

    repitentes = []
    for r in analisis.repitentes:
        repitentes.append(RepitienteResponse(
            estudiante_id=r.estudiante_id,
            nombre=r.nombre,
            semestre_principal=r.semestre_principal,
            semestres_donde_repite=r.semestres_donde_repite or [],
            todos_los_semestres=r.todos_los_semestres or [],
        ))
    repitentes.sort(key=lambda x: (-x.semestre_principal, x.nombre))

    return AnalisisCompletoResponse(
        resumen=resumen,
        detalle_semestres=detalle_semestres,
        detalle_grupos=detalle_grupos,
        repitentes=repitentes,
    )


@router.get("/{analisis_id}/semestre/{semestre}")
def obtener_detalle_semestre(analisis_id: int, semestre: int, db: Session = Depends(get_db)):
    _obtener_analisis(analisis_id, db)

    detalle_sem = (
        db.query(AnalisisDetalleSemestre)
        .filter(AnalisisDetalleSemestre.analisis_id == analisis_id, AnalisisDetalleSemestre.semestre == semestre)
        .first()
    )

    grupos = (
        db.query(AnalisisDetalleGrupo)
        .filter(AnalisisDetalleGrupo.analisis_id == analisis_id, AnalisisDetalleGrupo.semestre == semestre)
        .order_by(AnalisisDetalleGrupo.nombre_grupo)
        .all()
    )

    repitentes_sem = (
        db.query(Repitente)
        .filter(Repitente.analisis_id == analisis_id)
        .all()
    )
    # Filtrar repitentes que repiten en este semestre
    repitentes_en_sem = [
        r for r in repitentes_sem
        if semestre in (r.semestres_donde_repite or [])
    ]

    return {
        "semestre": semestre,
        "resumen": {
            "unicos": detalle_sem.unicos if detalle_sem else 0,
            "regulares": detalle_sem.regulares if detalle_sem else 0,
            "repitentes": detalle_sem.repitentes if detalle_sem else 0,
        },
        "grupos": [
            {
                "nombre_grupo": g.nombre_grupo,
                "turno": g.turno,
                "matriculados": g.matriculados,
                "repitentes": g.repitentes_count,
                "letras_desglose": g.letras_desglose,
            }
            for g in grupos
        ],
        "repitentes_en_semestre": [
            {
                "estudiante_id": r.estudiante_id,
                "nombre": r.nombre,
                "semestre_principal": r.semestre_principal,
            }
            for r in repitentes_en_sem
        ],
    }


@router.get("/{analisis_id}/repitentes", response_model=list[RepitienteResponse])
def obtener_repitentes(
    analisis_id: int,
    semestre_principal: int | None = Query(None),
    semestre_repite: int | None = Query(None),
    buscar: str | None = Query(None),
    db: Session = Depends(get_db),
):
    _obtener_analisis(analisis_id, db)

    query = db.query(Repitente).filter(Repitente.analisis_id == analisis_id)

    if semestre_principal is not None:
        query = query.filter(Repitente.semestre_principal == semestre_principal)

    repitentes = query.order_by(Repitente.semestre_principal.desc(), Repitente.nombre).all()

    # Filtros en memoria (JSON fields)
    resultado = []
    for r in repitentes:
        if semestre_repite is not None and semestre_repite not in (r.semestres_donde_repite or []):
            continue
        if buscar and buscar.lower() not in r.nombre.lower() and buscar not in r.estudiante_id:
            continue
        resultado.append(RepitienteResponse(
            estudiante_id=r.estudiante_id,
            nombre=r.nombre,
            semestre_principal=r.semestre_principal,
            semestres_donde_repite=r.semestres_donde_repite or [],
            todos_los_semestres=r.todos_los_semestres or [],
        ))

    return resultado


@router.get("/{analisis_id}/repitentes/exportar")
def exportar_repitentes(
    analisis_id: int,
    formato: str = Query(..., regex="^(pdf|excel)$"),
    semestre_principal: int | None = Query(None),
    semestre_repite: int | None = Query(None),
    buscar: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Exporta la lista de repitentes filtrada a PDF o Excel."""
    analisis = _obtener_analisis(analisis_id, db)

    query = db.query(Repitente).filter(Repitente.analisis_id == analisis_id)
    if semestre_principal is not None:
        query = query.filter(Repitente.semestre_principal == semestre_principal)

    repitentes = query.order_by(Repitente.semestre_principal.desc(), Repitente.nombre).all()

    resultado = []
    for r in repitentes:
        if semestre_repite is not None and semestre_repite not in (r.semestres_donde_repite or []):
            continue
        if buscar and buscar.lower() not in r.nombre.lower() and buscar not in r.estudiante_id:
            continue
        resultado.append({
            "estudiante_id": r.estudiante_id,
            "nombre": r.nombre,
            "semestre_principal": r.semestre_principal,
            "semestres_donde_repite": r.semestres_donde_repite or [],
            "todos_los_semestres": r.todos_los_semestres or [],
        })

    periodo_nombre = analisis.periodo.nombre if analisis.periodo else "Sin período"

    if formato == "excel":
        output = exportar_repitentes_excel(resultado, periodo_nombre)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=Repitentes_{analisis.archivo_nombre}.xlsx"},
        )
    else:
        output = exportar_repitentes_pdf(resultado, periodo_nombre)
        return StreamingResponse(
            output,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Repitentes_{analisis.archivo_nombre}.pdf"},
        )


@router.get("/{analisis_id}/exportar")
def exportar_analisis(
    analisis_id: int,
    formato: str = Query(..., regex="^(pdf|excel)$"),
    db: Session = Depends(get_db),
):
    """
    Exporta el análisis a PDF o Excel.
    Requiere re-procesar las estadísticas desde la BD para generar el formato completo.
    """
    analisis = _obtener_analisis(analisis_id, db)

    # Reconstruir stats desde la BD
    stats = _reconstruir_stats(analisis, db)
    configs_grupos = obtener_configs_grupos(db, analisis.periodo_id)

    if formato == "excel":
        output = exportar_excel(stats, configs_grupos)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=Reporte_{analisis.archivo_nombre}.xlsx"},
        )
    else:
        output = exportar_pdf(stats, configs_grupos)
        return StreamingResponse(
            output,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Reporte_{analisis.archivo_nombre}.pdf"},
        )


def _reconstruir_stats(analisis: Analisis, db: Session) -> dict:
    """
    Reconstruye el diccionario de estadísticas desde los datos guardados en BD
    para poder usar las funciones de exportación.
    """
    from collections import defaultdict

    estudiantes_por_semestre = defaultdict(set)
    repitentes_por_semestre = defaultdict(set)
    grupo_real_semestre = defaultdict(set)
    grupo_real_letra_semestre = defaultdict(set)
    est_sem_principal = {}
    est_nombre = {}

    # Desde detalle_semestres no tenemos los IDs individuales,
    # pero desde repitentes sí tenemos la info necesaria.
    # Para la exportación, necesitamos counts, no IDs.
    # Usamos placeholders para que las funciones de exportación funcionen.

    # Semestres
    for ds in analisis.detalle_semestres:
        # Crear IDs ficticios para mantener la estructura de sets
        for i in range(ds.unicos):
            fake_id = f"sem{ds.semestre}_est{i}"
            estudiantes_por_semestre[ds.semestre].add(fake_id)

    # Repitentes reales
    repitentes_lista = []
    for r in analisis.repitentes:
        est_sem_principal[r.estudiante_id] = r.semestre_principal
        est_nombre[r.estudiante_id] = r.nombre
        repitentes_lista.append({
            "id": r.estudiante_id,
            "nombre": r.nombre,
            "semestre_principal": r.semestre_principal,
            "semestres_donde_repite": r.semestres_donde_repite or [],
            "todos_los_semestres": r.todos_los_semestres or [],
        })
        for s in (r.semestres_donde_repite or []):
            repitentes_por_semestre[s].add(r.estudiante_id)

    # Grupos
    grupo_repitentes_count = {}
    for dg in analisis.detalle_grupos:
        for i in range(dg.matriculados):
            fake_id = f"grp{dg.semestre}_{dg.nombre_grupo}_est{i}"
            grupo_real_semestre[(dg.semestre, dg.nombre_grupo)].add(fake_id)

        # Guardar el conteo real de repitentes por grupo desde la BD
        grupo_repitentes_count[(dg.semestre, dg.nombre_grupo)] = dg.repitentes_count

        for letra, count in (dg.letras_desglose or {}).items():
            for i in range(count):
                fake_id = f"grpl{dg.semestre}_{dg.nombre_grupo}_{letra}_est{i}"
                grupo_real_letra_semestre[(dg.semestre, dg.nombre_grupo, letra)].add(fake_id)

    return {
        "estudiantes_por_semestre": estudiantes_por_semestre,
        "grupo_real_semestre": grupo_real_semestre,
        "grupo_real_letra_semestre": grupo_real_letra_semestre,
        "grupo_repitentes_count": grupo_repitentes_count,
        "total_estudiantes_unicos": analisis.total_unicos,
        "repitentes": repitentes_lista,
        "repitentes_por_semestre": repitentes_por_semestre,
        "est_sem_principal": est_sem_principal,
        "est_nombre": est_nombre,
    }


# ═══════════════════════════════════════════════════════════
#  Listas de estudiantes para impresión
# ═══════════════════════════════════════════════════════════

@router.get("/{analisis_id}/listas")
def obtener_listas(
    analisis_id: int,
    semestre: int | None = Query(None),
    turno: str | None = Query(None, regex="^(Mañana|Tarde|Noche)$"),
    grupo: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """
    Retorna las listas de estudiantes por grupo, con filtros opcionales.
    """
    analisis = _obtener_analisis(analisis_id, db)

    if not analisis.datos_completos:
        raise HTTPException(
            status_code=404,
            detail="Este análisis no tiene datos de listas. Re-suba el archivo para generar las listas.",
        )

    # Cargar info de grupos para obtener turnos
    grupos_db = (
        db.query(AnalisisDetalleGrupo)
        .filter(AnalisisDetalleGrupo.analisis_id == analisis_id)
        .all()
    )
    turno_por_grupo = {}
    for g in grupos_db:
        turno_por_grupo[(g.semestre, g.nombre_grupo)] = g.turno

    resultado = []
    for entry in analisis.datos_completos:
        sem = entry["semestre"]
        grp = entry["grupo"]
        turno_grp = turno_por_grupo.get((sem, grp), "?")

        # Aplicar filtros
        if semestre is not None and sem != semestre:
            continue
        if turno is not None and turno_grp != turno:
            continue
        if grupo is not None and grp != grupo:
            continue

        resultado.append({
            "semestre": sem,
            "grupo": grp,
            "turno": turno_grp,
            "total_estudiantes": len(entry["estudiantes"]),
            "estudiantes": entry["estudiantes"],
        })

    # Info de semestres y grupos disponibles (para los filtros del frontend)
    semestres_disponibles = sorted(set(e["semestre"] for e in analisis.datos_completos))
    grupos_disponibles = []
    for e in analisis.datos_completos:
        t = turno_por_grupo.get((e["semestre"], e["grupo"]), "?")
        grupos_disponibles.append({
            "semestre": e["semestre"],
            "grupo": e["grupo"],
            "turno": t,
            "total": len(e["estudiantes"]),
        })
    grupos_disponibles.sort(key=lambda x: (x["semestre"], x["grupo"]))
    turnos_disponibles = sorted(set(
        turno_por_grupo.get((e["semestre"], e["grupo"]), "?")
        for e in analisis.datos_completos
    ))

    return {
        "analisis_id": analisis_id,
        "periodo_nombre": analisis.periodo.nombre if analisis.periodo else None,
        "archivo_nombre": analisis.archivo_nombre,
        "filtros_disponibles": {
            "semestres": semestres_disponibles,
            "turnos": turnos_disponibles,
            "grupos": grupos_disponibles,
        },
        "listas": resultado,
        "total_grupos": len(resultado),
        "total_estudiantes": sum(len(e["estudiantes"]) for e in resultado),
    }


@router.get("/{analisis_id}/listas/imprimir")
def imprimir_listas(
    analisis_id: int,
    semestre: int | None = Query(None),
    turno: str | None = Query(None),
    grupos: str | None = Query(None, description="Grupos separados por coma, ej: M1,T1,N1"),
    db: Session = Depends(get_db),
):
    """
    Genera un PDF para impresión de listas de estudiantes con filtros.
    """
    analisis = _obtener_analisis(analisis_id, db)

    if not analisis.datos_completos:
        raise HTTPException(
            status_code=404,
            detail="Este análisis no tiene datos de listas.",
        )

    # Cargar info de grupos
    grupos_db = (
        db.query(AnalisisDetalleGrupo)
        .filter(AnalisisDetalleGrupo.analisis_id == analisis_id)
        .all()
    )
    turno_por_grupo = {}
    rep_count_por_grupo = {}
    for g in grupos_db:
        turno_por_grupo[(g.semestre, g.nombre_grupo)] = g.turno
        rep_count_por_grupo[(g.semestre, g.nombre_grupo)] = g.repitentes_count

    # Parsear lista de grupos seleccionados
    grupos_seleccionados = None
    if grupos:
        grupos_seleccionados = set(g.strip() for g in grupos.split(","))

    # Filtrar listas
    listas_filtradas = []
    for entry in analisis.datos_completos:
        sem = entry["semestre"]
        grp = entry["grupo"]
        turno_grp = turno_por_grupo.get((sem, grp), "?")

        if semestre is not None and sem != semestre:
            continue
        if turno is not None and turno_grp != turno:
            continue
        if grupos_seleccionados is not None and grp not in grupos_seleccionados:
            continue

        listas_filtradas.append({
            "semestre": sem,
            "grupo": grp,
            "turno": turno_grp,
            "repitentes_count": rep_count_por_grupo.get((sem, grp), 0),
            "estudiantes": entry["estudiantes"],
        })

    if not listas_filtradas:
        raise HTTPException(status_code=404, detail="No se encontraron listas con los filtros aplicados.")

    periodo_nombre = analisis.periodo.nombre if analisis.periodo else "Sin período"
    output = exportar_listas_pdf(listas_filtradas, periodo_nombre)

    filtro_desc = []
    if semestre is not None:
        filtro_desc.append(f"S{semestre}")
    if turno:
        filtro_desc.append(turno)
    if grupos:
        filtro_desc.append(grupos)
    filtro_str = "_".join(filtro_desc) if filtro_desc else "todas"

    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Listas_{filtro_str}_{analisis.archivo_nombre}.pdf",
        },
    )
