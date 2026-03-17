from pydantic import BaseModel
from datetime import datetime


class DetalleSemestreResponse(BaseModel):
    semestre: int
    unicos: int
    regulares: int
    repitentes: int
    porcentaje_repitentes: float

    model_config = {"from_attributes": True}


class DetalleGrupoResponse(BaseModel):
    semestre: int
    nombre_grupo: str
    turno: str
    matriculados: int
    repitentes_count: int
    regulares: int
    letras_desglose: dict

    model_config = {"from_attributes": True}


class RepitienteResponse(BaseModel):
    estudiante_id: str
    nombre: str
    semestre_principal: int
    semestres_donde_repite: list[int]
    todos_los_semestres: list[int]

    model_config = {"from_attributes": True}


class AnalisisResumenResponse(BaseModel):
    id: int
    periodo_id: int
    periodo_nombre: str | None = None
    fecha_analisis: datetime
    archivo_nombre: str
    total_unicos: int
    total_repitentes: int
    materias_no_encontradas: list[str]

    model_config = {"from_attributes": True}


class AnalisisCompletoResponse(BaseModel):
    resumen: AnalisisResumenResponse
    detalle_semestres: list[DetalleSemestreResponse]
    detalle_grupos: list[DetalleGrupoResponse]
    repitentes: list[RepitienteResponse]
