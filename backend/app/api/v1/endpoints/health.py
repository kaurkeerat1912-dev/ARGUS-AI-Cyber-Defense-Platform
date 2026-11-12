"""
System Health and Diagnostics API Endpoints
Monitors operational readiness, database connectivity, forensic modules, and local AI.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import httpx

from backend.app.database.session import get_db
from backend.app.schemas.forensics import SystemHealthSchema
from backend.app.core.config import settings

router = APIRouter()


@router.get("", response_model=SystemHealthSchema)
async def get_system_health(db: AsyncSession = Depends(get_db)):
    """Check backend, database, YARA engine, and local Ollama connectivity."""
    db_status = "HEALTHY"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"ERROR: {str(e)}"

    # Check Ollama
    ollama_connected = False
    if settings.OLLAMA_ENABLED:
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                res = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                if res.status_code == 200:
                    ollama_connected = True
        except Exception:
            ollama_connected = False

    # Check forensic modules
    available_modules = ["hashlib (Cryptographic)", "Shannon Entropy Calculator", "IOC Regex Parser"]

    try:
        import pymupdf
        available_modules.append("PyMuPDF (PDF Parser)")
    except ImportError:
        pass

    try:
        import pefile
        available_modules.append("pefile (Windows PE Parser)")
    except ImportError:
        pass

    try:
        import oletools
        available_modules.append("oletools (Office OLE/VBA Parser)")
    except ImportError:
        pass

    try:
        import yara
        available_modules.append("YARA 4.5+ (Binary Signature Matcher)")
        yara_installed = True
    except ImportError:
        yara_installed = False

    try:
        import reportlab
        available_modules.append("ReportLab (Forensic PDF Engine)")
    except ImportError:
        pass

    try:
        import sklearn
        available_modules.append("scikit-learn (ML & Anomaly Engine)")
    except ImportError:
        pass

    return SystemHealthSchema(
        status="OPERATIONAL",
        app_version=settings.VERSION,
        university=settings.UNIVERSITY,
        session=settings.SESSION,
        database_status=db_status,
        yara_installed=yara_installed,
        ollama_connected=ollama_connected,
        ollama_model=settings.OLLAMA_MODEL if settings.OLLAMA_ENABLED else None,
        available_forensic_modules=available_modules,
        storage_quarantine_path=str(settings.QUARANTINE_DIR)
    )
