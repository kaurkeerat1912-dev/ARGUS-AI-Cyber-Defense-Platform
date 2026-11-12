"""
Main FastAPI Application Entrypoint
AI-Powered Malicious File Forensics and Threat Reconstruction System
Academic Live Project - SRM University Delhi-NCR, Sonipat (2026-2027)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.database.session import init_db
from backend.app.api.v1.api import api_router
from backend.app.services.ml_engine.model import ml_engine
import backend.app.models  # Ensure all SQLAlchemy models are registered


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for database initialization and pre-flight health checks."""
    print(f"[*] Initializing {settings.PROJECT_NAME}...")
    settings.ensure_directories()
    # Initialize SQLite / PostgreSQL tables
    await init_db()
    print("[*] Database tables initialized successfully.")
    # Verify or train initial ML models
    if ml_engine.rf_model is None:
        print("[*] Training initial benchmark models...")
        ml_engine.train_and_evaluate(is_synthetic=True)
    print("[*] Forensics and ML engines ready.")
    yield
    print("[*] Shutting down application gracefully.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="University-level AI-assisted digital forensics platform for suspicious files and behavioral threat reconstruction.",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "institution": settings.UNIVERSITY,
        "department": settings.DEPARTMENT,
        "session": settings.SESSION,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1_prefix": settings.API_V1_PREFIX,
        "status": "ONLINE"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "api_v1_health": f"{settings.API_V1_PREFIX}/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main.py:app", host="0.0.0.0", port=8000, reload=True)
