from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.periodo import Periodo
from app.schemas.periodo import PeriodoCreate, PeriodoResponse

router = APIRouter(prefix="/api/periodos", tags=["Períodos"])


@router.get("/", response_model=list[PeriodoResponse])
def listar_periodos(db: Session = Depends(get_db)):
    return db.query(Periodo).order_by(Periodo.created_at.desc()).all()


@router.post("/", response_model=PeriodoResponse, status_code=201)
def crear_periodo(data: PeriodoCreate, db: Session = Depends(get_db)):
    existente = db.query(Periodo).filter(Periodo.nombre == data.nombre).first()
    if existente:
        raise HTTPException(status_code=400, detail=f"Ya existe un período con nombre '{data.nombre}'")

    periodo = Periodo(**data.model_dump())
    db.add(periodo)
    db.commit()
    db.refresh(periodo)
    return periodo


@router.get("/{periodo_id}", response_model=PeriodoResponse)
def obtener_periodo(periodo_id: int, db: Session = Depends(get_db)):
    periodo = db.query(Periodo).filter(Periodo.id == periodo_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Período no encontrado")
    return periodo


@router.delete("/{periodo_id}", status_code=204)
def eliminar_periodo(periodo_id: int, db: Session = Depends(get_db)):
    periodo = db.query(Periodo).filter(Periodo.id == periodo_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Período no encontrado")
    db.delete(periodo)
    db.commit()
