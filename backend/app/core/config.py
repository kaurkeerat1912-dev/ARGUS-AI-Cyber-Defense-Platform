"""
Core Application Configuration
AI-Powered Malicious File Forensics & Threat Reconstruction System
Academic Project - SRM University Delhi-NCR, Sonipat (2026-2027)
"""

from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Project Identity
    PROJECT_NAME: str = "AI-Powered Malicious File Forensics and Threat Reconstruction System"
    UNIVERSITY: str = "SRM University Delhi-NCR, Sonipat"
    DEPARTMENT: str = "Department of Computer Science & Engineering (Data Science & AI)"
    SESSION: str = "2026-2027"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[List[str], str]) -> List[str]:
        if isinstance(v, str):
            import json
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed]
            except Exception:
                pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Base Paths (macOS & Linux safe Pathlib resolution)
    BASE_DIR: Path = Path(__file__).resolve().parents[3]
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    QUARANTINE_DIR: Path = BASE_DIR / "data" / "quarantine"
    REPORTS_DIR: Path = BASE_DIR / "reports" / "generated"
    YARA_RULES_PATH: Path = BASE_DIR / "yara_rules" / "malware_rules.yar"
    ML_ARTIFACTS_DIR: Path = BASE_DIR / "ml" / "artifacts"
    SAMPLE_DATA_DIR: Path = BASE_DIR / "sample_data"

    # Limits & Constraints
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = [
        ".pdf", ".docx", ".doc", ".zip", ".exe", ".dll", ".bin", ".vbs", ".ps1", ".js", ".sh", ".py"
    ]

    # Database (Supports SQLite local dev and Neon/Render PostgreSQL in production)
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR / 'forensics.sqlite3'}"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if not v:
            return v
        # Convert standard Postgres URIs (postgres:// or postgresql://) to asyncpg driver
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        # Strip sslmode query parameter if present because asyncpg uses ssl parameter
        if "postgresql+asyncpg://" in v and "sslmode=" in v:
            import urllib.parse
            url_parts = urllib.parse.urlsplit(v)
            query_params = urllib.parse.parse_qsl(url_parts.query)
            # Remove sslmode from query string to avoid asyncpg driver rejection
            clean_query = urllib.parse.urlencode([(k, val) for k, val in query_params if k != "sslmode"])
            v = urllib.parse.urlunsplit((url_parts.scheme, url_parts.netloc, url_parts.path, clean_query, url_parts.fragment))
        return v

    # Machine Learning Models
    RANDOM_FOREST_MODEL: Path = ML_ARTIFACTS_DIR / "random_forest_model.joblib"
    ISOLATION_FOREST_MODEL: Path = ML_ARTIFACTS_DIR / "isolation_forest_model.joblib"
    FEATURE_SCALER: Path = ML_ARTIFACTS_DIR / "feature_scaler.joblib"
    METRICS_FILE: Path = ML_ARTIFACTS_DIR / "evaluation_metrics.json"

    # Local AI / Ollama
    OLLAMA_ENABLED: bool = False
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "mistral:latest"
    OLLAMA_TIMEOUT_SECONDS: int = 45

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[3] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def ensure_directories(self) -> None:
        """Create necessary directories if they don't exist."""
        for path in [
            self.UPLOAD_DIR,
            self.QUARANTINE_DIR,
            self.REPORTS_DIR,
            self.ML_ARTIFACTS_DIR,
            self.SAMPLE_DATA_DIR / "benign",
            self.SAMPLE_DATA_DIR / "suspicious",
            self.SAMPLE_DATA_DIR / "telemetry",
        ]:
            path.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_directories()
