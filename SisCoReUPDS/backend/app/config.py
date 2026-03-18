import os
from pydantic_settings import BaseSettings


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))


class Settings(BaseSettings):
    APP_NAME: str = "SisCoRe UPDS - Sistema de Conteo de Registros"
    DATABASE_URL: str = "sqlite:///./siscore.db"
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    MAX_UPLOAD_SIZE_MB: int = 50
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    MALLA_FILE: str = os.path.join(BASE_DIR, "Malla-curricular-medicina-UPDS.txt")

    class Config:
        env_file = ".env"


settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
