"""Application configuration loaded from environment variables."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ─── MongoDB ───
    # Option 1: Use full MongoDB Atlas URI
    MONGO_URI_FULL: str = os.getenv("MONGO_URI", "")
    
    # Option 2: Build URI from components (for local dev)
    MONGO_USER: str = os.getenv("MONGO_USER", "admin")
    MONGO_PASSWORD: str = os.getenv("MONGO_PASSWORD", "")
    MONGO_HOST: str = os.getenv("MONGO_HOST", "localhost")
    MONGO_PORT: int = int(os.getenv("MONGO_PORT", "27017"))
    MONGO_DB: str = os.getenv("MONGO_DB", "hackathon_portal")

    @property
    def MONGO_URI(self) -> str:
        # Prefer MONGO_URI if set (for Atlas), otherwise build from components
        if self.MONGO_URI_FULL:
            return self.MONGO_URI_FULL
        return (
            f"mongodb://{self.MONGO_USER}:{self.MONGO_PASSWORD}"
            f"@{self.MONGO_HOST}:{self.MONGO_PORT}/{self.MONGO_DB}"
            f"?authSource=admin"
        )



    # ─── Redis (optional — leave blank to disable caching/sessions/rate-limits) ───
    REDIS_URL: str = os.getenv("REDIS_URL", "")

    # ─── JWT ───
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # ─── GenAI ───
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    MISTRAL_API_KEY: str = os.getenv("MISTRAL_API_KEY", "")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mistral")  # gemini, openai, or mistral
    FAISS_INDEX_PATH: str = os.getenv("FAISS_INDEX_PATH", "./faiss_index/hackathon.index")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.35"))
    ENABLE_FAISS_WARMUP: bool = os.getenv("ENABLE_FAISS_WARMUP", "false").lower() == "true"

    # ─── App ───
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"


settings = Settings()
