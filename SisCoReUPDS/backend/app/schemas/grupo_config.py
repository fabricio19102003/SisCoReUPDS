from pydantic import BaseModel


class GrupoConfigCreate(BaseModel):
    semestre: int
    nombre_grupo: str
    turno: str
    letra_principal: str
    letras_overflow: list[str] = []


class GrupoConfigResponse(BaseModel):
    id: int
    periodo_id: int
    semestre: int
    nombre_grupo: str
    turno: str
    letra_principal: str
    letras_overflow: list[str]
    letras: list[str]

    model_config = {"from_attributes": True}


class GrupoConfigTextoCreate(BaseModel):
    """Permite enviar la configuración en formato texto como en el script original."""
    semestre: int
    config_texto: str


class GrupoConfigBulkCreate(BaseModel):
    """Configuración masiva: múltiples semestres a la vez."""
    configs: list[GrupoConfigTextoCreate]
