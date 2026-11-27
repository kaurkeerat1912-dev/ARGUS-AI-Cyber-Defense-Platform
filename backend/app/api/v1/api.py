"""
API V1 Main Router Aggregation
"""

from fastapi import APIRouter
from backend.app.api.v1.endpoints import files, investigations, metrics, telemetry, health, defense, email, autonomous

api_router = APIRouter()

api_router.include_router(autonomous.router, prefix="/autonomous", tags=["Autonomous Defense Engine"])

api_router.include_router(files.router, prefix="/files", tags=["File Ingestion & Analysis"])
api_router.include_router(email.router, prefix="/email", tags=["Email Attachment Extraction"])
api_router.include_router(investigations.router, prefix="/investigations", tags=["Investigations & Forensics"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["Behavioral Telemetry"])
api_router.include_router(defense.router, prefix="/defense", tags=["Defensive Simulation"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["SOC Metrics & Model Evaluation"])
api_router.include_router(metrics.router, prefix="/models", tags=["Model Evaluation"])
api_router.include_router(health.router, prefix="/health", tags=["System Health"])

