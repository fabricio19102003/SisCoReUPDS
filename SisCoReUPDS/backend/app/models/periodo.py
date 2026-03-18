from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class Periodo(Base):
    __tablename__ = "periodos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True)
    fecha_inicio = Column(DateTime, nullable=True)
    fecha_fin = Column(DateTime, nullable=True)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    config_grupos = relationship("GrupoConfig", back_populates="periodo", cascade="all, delete-orphan")
    analisis = relationship("Analisis", back_populates="periodo", cascade="all, delete-orphan")
