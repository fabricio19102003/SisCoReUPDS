from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.malla import MallaMateriaResponse, MallaUploadResponse
from app.services.malla_service import cargar_malla_desde_json, obtener_todas_materias

router = APIRouter(prefix="/api/malla", tags=["Malla Curricular"])


@router.get("/", response_model=list[MallaMateriaResponse])
def listar_malla(db: Session = Depends(get_db)):
    return obtener_todas_materias(db)


@router.post("/upload", response_model=MallaUploadResponse)
async def subir_malla(archivo: UploadFile = File(...), db: Session = Depends(get_db)):
    if not archivo.filename.endswith((".json", ".txt")):
        raise HTTPException(status_code=400, detail="El archivo debe ser .json o .txt")

    contenido = await archivo.read()
    try:
        texto = contenido.decode("utf-8")
    except UnicodeDecodeError:
        texto = contenido.decode("latin-1")

    try:
        resultado = cargar_malla_desde_json(texto, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar la malla: {str(e)}")

    return resultado
