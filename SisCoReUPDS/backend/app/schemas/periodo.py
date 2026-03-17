from pydantic import BaseModel
from datetime import datetime


class PeriodoCreate(BaseModel):
    nombre: str
    fecha_inicio: datetime | None = None
    fecha_fin: datetime | None = None
    activo: bool = True


class PeriodoResponse(BaseModel):
    id: int
    nombre: str
    fecha_inicio: datetime | None
    fecha_fin: datetime | None
    activo: bool
    created_at: datetime

    model_config = {"from_attributes": True}
