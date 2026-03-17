from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class Analisis(Base):
    __tablename__ = "analisis"

    id = Column(Integer, primary_key=True, index=True)
    periodo_id = Column(Integer, ForeignKey("periodos.id"), nullable=False)
    fecha_analisis = Column(DateTime, default=datetime.utcnow)
    archivo_nombre = Column(String(255), nullable=False)
    total_unicos = Column(Integer, default=0)
    total_repitentes = Column(Integer, default=0)
    materias_no_encontradas = Column(JSON, default=[])
    datos_completos = Column(JSON, default={})

    periodo = relationship("Periodo", back_populates="analisis")
    detalle_semestres = relationship("AnalisisDetalleSemestre", back_populates="analisis", cascade="all, delete-orphan")
    detalle_grupos = relationship("AnalisisDetalleGrupo", back_populates="analisis", cascade="all, delete-orphan")
    repitentes = relationship("Repitente", back_populates="analisis", cascade="all, delete-orphan")


class AnalisisDetalleSemestre(Base):
    __tablename__ = "analisis_detalle_semestre"

    id = Column(Integer, primary_key=True, index=True)
    analisis_id = Column(Integer, ForeignKey("analisis.id"), nullable=False)
    semestre = Column(Integer, nullable=False)
    unicos = Column(Integer, default=0)
    regulares = Column(Integer, default=0)
    repitentes = Column(Integer, default=0)

    analisis = relationship("Analisis", back_populates="detalle_semestres")


class AnalisisDetalleGrupo(Base):
    __tablename__ = "analisis_detalle_grupo"

    id = Column(Integer, primary_key=True, index=True)
    analisis_id = Column(Integer, ForeignKey("analisis.id"), nullable=False)
    semestre = Column(Integer, nullable=False)
    nombre_grupo = Column(String(10), nullable=False)
    turno = Column(String(20), nullable=False)
    matriculados = Column(Integer, default=0)
    repitentes_count = Column(Integer, default=0)
    letras_desglose = Column(JSON, default={})

    analisis = relationship("Analisis", back_populates="detalle_grupos")


class Repitente(Base):
    __tablename__ = "repitentes"

    id = Column(Integer, primary_key=True, index=True)
    analisis_id = Column(Integer, ForeignKey("analisis.id"), nullable=False)
    estudiante_id = Column(String(50), nullable=False)
    nombre = Column(String(200), nullable=False)
    semestre_principal = Column(Integer, nullable=False)
    semestres_donde_repite = Column(JSON, default=[])
    todos_los_semestres = Column(JSON, default=[])

    analisis = relationship("Analisis", back_populates="repitentes")
