from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "MediAssist AI"
    DEBUG: bool = True
    SECRET_KEY: str = "change-this-in-production"

    # AI - Gemini (FREE!)
    GEMINI_API_KEY: str = ""

    # Database
    DATABASE_URL: str = "sqlite:///./mediassist.db"  # SQLite for local dev (no setup needed!)

    # File Upload
    UPLOAD_DIR: str = "data/uploads"
    MAX_FILE_SIZE_MB: int = 50

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"

# This creates ONE settings object used everywhere
settings = Settings()