import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import engine, Base, SessionLocal
from app.api import periodos, malla, config_grupos, upload, reportes
from app.models.malla import MallaMateria
from app.services.malla_service import cargar_malla_desde_json

logger = logging.getLogger(__name__)

# Crear tablas
Base.metadata.create_all(bind=engine)

# Cargar malla curricular automáticamente si la BD está vacía
def _cargar_malla_inicial():
    db = SessionLocal()
    try:
        count = db.query(MallaMateria).count()
        if count == 0 and os.path.exists(settings.MALLA_FILE):
            with open(settings.MALLA_FILE, "r", encoding="utf-8") as f:
                contenido = f.read()
            resultado = cargar_malla_desde_json(contenido, db)
            logger.info("Malla curricular cargada automáticamente: %s", resultado["mensaje"])
        elif count > 0:
            logger.info("Malla curricular ya cargada (%d materias)", count)
    except Exception as e:
        logger.error("Error al cargar malla inicial: %s", e)
    finally:
        db.close()

_cargar_malla_inicial()

app = FastAPI(
    title=settings.APP_NAME,
    description="API para el análisis automatizado de matriculados de Medicina - UPDS",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(periodos.router)
app.include_router(malla.router)
app.include_router(config_grupos.router)
app.include_router(upload.router)
app.include_router(reportes.router)


@app.get("/")
def root():
    return {
        "nombre": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
