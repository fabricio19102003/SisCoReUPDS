from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import engine, Base
from app.api import periodos, malla, config_grupos, upload, reportes

# Crear tablas
Base.metadata.create_all(bind=engine)

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
