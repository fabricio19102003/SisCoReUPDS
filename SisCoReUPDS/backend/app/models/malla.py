from sqlalchemy import Column, Integer, String
from app.db.database import Base


class MallaMateria(Base):
    __tablename__ = "malla_materias"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(30), nullable=False, unique=True, index=True)
    nombre = Column(String(200), nullable=False)
    semestre = Column(Integer, nullable=False)
    creditos = Column(Integer, nullable=False)
    HT = Column(Integer, default=0)
    HP = Column(Integer, default=0)
