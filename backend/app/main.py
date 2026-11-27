"""
Main FastAPI Application Entrypoint
AI-Powered Malicious File Forensics and Threat Reconstruction System
Academic Live Project - SRM University Delhi-NCR, Sonipat (2026-2027)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

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
    # In production, ML models are lazy-loaded on first inference request to save RAM on Render free tier (512MB limit)
    print("[*] Forensics engine ready (ML models configured for lazy-loading on demand).")
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
cors_origins = list(settings.CORS_ORIGINS) if isinstance(settings.CORS_ORIGINS, (list, set)) else ["*"]
allow_all = "*" in cors_origins

# In production, allow all origins or allow Vercel previews & production domain with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app" if not allow_all else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "api_v1_health": f"{settings.API_V1_PREFIX}/health"
    }


# ==============================================================================
# Production SPA Static File Serving
# Serves the compiled React frontend from frontend/dist if present
# ==============================================================================
frontend_dist = settings.BASE_DIR / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/", tags=["Root"])
    async def root_or_spa(request: Request):
        accept = request.headers.get("accept", "")
        if "text/html" in accept:
            return FileResponse(str(frontend_dist / "index.html"))
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

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Do not intercept API, docs, or OpenAPI schema endpoints
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        candidate = frontend_dist / full_path
        if full_path and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(frontend_dist / "index.html"))
else:
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main.py:app", host="0.0.0.0", port=8000, reload=True)
