"""
Core Application Configuration
AI-Powered Malicious File Forensics & Threat Reconstruction System
Academic Project - SRM University Delhi-NCR, Sonipat (2026-2027)
"""

from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Project Identity
    PROJECT_NAME: str = "AI-Powered Malicious File Forensics and Threat Reconstruction System"
    UNIVERSITY: str = "SRM University Delhi-NCR, Sonipat"
    DEPARTMENT: str = "Department of Computer Science & Engineering (Data Science & AI)"
    SESSION: str = "2026-2027"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

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

    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR / 'forensics.sqlite3'}"

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

    # Google Gmail OAuth 2.0 Credentials
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/email/gmail/oauth/callback"

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
