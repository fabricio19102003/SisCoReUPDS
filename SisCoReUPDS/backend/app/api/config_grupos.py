from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.periodo import Periodo
from app.models.grupo_config import GrupoConfig
from app.schemas.grupo_config import GrupoConfigResponse, GrupoConfigTextoCreate, GrupoConfigBulkCreate
from app.services.analizador import parsear_config_texto

router = APIRouter(prefix="/api/periodos/{periodo_id}/config-grupos", tags=["Configuración de Grupos"])


def _verificar_periodo(periodo_id: int, db: Session) -> Periodo:
    periodo = db.query(Periodo).filter(Periodo.id == periodo_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Período no encontrado")
    return periodo


@router.get("/", response_model=list[GrupoConfigResponse])
def listar_config_grupos(periodo_id: int, db: Session = Depends(get_db)):
    _verificar_periodo(periodo_id, db)
    configs = (
        db.query(GrupoConfig)
        .filter(GrupoConfig.periodo_id == periodo_id)
        .order_by(GrupoConfig.semestre, GrupoConfig.nombre_grupo)
        .all()
    )
    return configs


@router.post("/", response_model=list[GrupoConfigResponse], status_code=201)
def crear_config_desde_texto(
    periodo_id: int,
    data: GrupoConfigTextoCreate,
    db: Session = Depends(get_db),
):
    """
    Crea configuración de grupos para un semestre usando el formato texto
    del script original (ej: "M1(A)=(Q)\nT1(B)=(O)").
    """
    _verificar_periodo(periodo_id, db)

    # Eliminar config existente para este semestre
    db.query(GrupoConfig).filter(
        GrupoConfig.periodo_id == periodo_id,
        GrupoConfig.semestre == data.semestre,
    ).delete()

    grupos = parsear_config_texto(data.config_texto)
    if not grupos:
        raise HTTPException(status_code=400, detail="No se pudo parsear la configuración de grupos")

    creados = []
    for g in grupos:
        config = GrupoConfig(
            periodo_id=periodo_id,
            semestre=data.semestre,
            nombre_grupo=g["nombre_grupo"],
            turno=g["turno"],
            letra_principal=g["letra_principal"],
            letras_overflow=g["letras_overflow"],
            letras=g["letras"],
        )
        db.add(config)
        creados.append(config)

    db.commit()
    for c in creados:
        db.refresh(c)

    return creados


@router.post("/bulk", response_model=dict, status_code=201)
def crear_config_masiva(
    periodo_id: int,
    data: GrupoConfigBulkCreate,
    db: Session = Depends(get_db),
):
    """
    Carga configuración de múltiples semestres a la vez.
    """
    _verificar_periodo(periodo_id, db)

    total_grupos = 0
    for item in data.configs:
        # Eliminar config existente para este semestre
        db.query(GrupoConfig).filter(
            GrupoConfig.periodo_id == periodo_id,
            GrupoConfig.semestre == item.semestre,
        ).delete()

        grupos = parsear_config_texto(item.config_texto)
        for g in grupos:
            config = GrupoConfig(
                periodo_id=periodo_id,
                semestre=item.semestre,
                nombre_grupo=g["nombre_grupo"],
                turno=g["turno"],
                letra_principal=g["letra_principal"],
                letras_overflow=g["letras_overflow"],
                letras=g["letras"],
            )
            db.add(config)
            total_grupos += 1

    db.commit()

    return {
        "semestres_configurados": len(data.configs),
        "total_grupos": total_grupos,
        "mensaje": f"Configuración cargada: {total_grupos} grupos en {len(data.configs)} semestres",
    }


@router.delete("/{semestre}", status_code=204)
def eliminar_config_semestre(periodo_id: int, semestre: int, db: Session = Depends(get_db)):
    _verificar_periodo(periodo_id, db)
    eliminados = db.query(GrupoConfig).filter(
        GrupoConfig.periodo_id == periodo_id,
        GrupoConfig.semestre == semestre,
    ).delete()
    db.commit()
    if eliminados == 0:
        raise HTTPException(status_code=404, detail=f"No hay configuración para el semestre {semestre}")
