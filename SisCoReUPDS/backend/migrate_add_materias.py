"""Migración: agregar columna datos_por_materia a la tabla analisis."""
from app.db.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE analisis ADD COLUMN datos_por_materia JSON"))
    conn.commit()
    print("Columna datos_por_materia agregada exitosamente.")
