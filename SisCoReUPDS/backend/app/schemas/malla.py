from pydantic import BaseModel


class MallaMateriaBase(BaseModel):
    codigo: str
    nombre: str
    semestre: int
    creditos: int
    HT: int = 0
    HP: int = 0


class MallaMateriaResponse(MallaMateriaBase):
    id: int

    model_config = {"from_attributes": True}


class MallaUploadResponse(BaseModel):
    total_materias: int
    semestres: int
    mensaje: str
