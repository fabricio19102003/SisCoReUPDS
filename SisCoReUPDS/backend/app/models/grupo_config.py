from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from app.db.database import Base


class GrupoConfig(Base):
    __tablename__ = "config_grupos"

    id = Column(Integer, primary_key=True, index=True)
    periodo_id = Column(Integer, ForeignKey("periodos.id"), nullable=False)
    semestre = Column(Integer, nullable=False)
    nombre_grupo = Column(String(10), nullable=False)
    turno = Column(String(5), nullable=False)
    letra_principal = Column(String(5), nullable=False)
    letras_overflow = Column(JSON, nullable=True)
    letras = Column(JSON, nullable=True)

    periodo = relationship("Periodo", back_populates="config_grupos")
