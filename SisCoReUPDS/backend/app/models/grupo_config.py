from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base


class GrupoConfig(Base):
    __tablename__ = "config_grupos"

    id = Column(Integer, primary_key=True, index=True)
    periodo_id = Column(Integer, ForeignKey("periodos.id"), nullable=False)
    semestre = Column(Integer, nullable=False)
    nombre_grupo = Column(String(10), nullable=False)  # M1, T1, N1...
    turno = Column(String(1), nullable=False)           # M, T, N
    letra_principal = Column(String(1), nullable=False)
    letras_overflow = Column(JSON, default=[])           # ["Q", "R", ...]
    letras = Column(JSON, default=[])                    # Todas las letras [principal + overflow]

    periodo = relationship("Periodo", back_populates="config_grupos")
