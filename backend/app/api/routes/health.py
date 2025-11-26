"""Health check endpoints."""

from fastapi import APIRouter

from app.config import settings
from app.db.qdrant import qdrant_service

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check including dependencies."""
    checks = {
        "app": "ready",
        "qdrant": "unknown",
    }
    
    try:
        info = await qdrant_service.get_collection_info()
        checks["qdrant"] = "ready"
        checks["qdrant_vectors"] = info.get("vectors_count", 0)
    except Exception as e:
        checks["qdrant"] = f"error: {str(e)}"
    
    all_ready = all(v == "ready" or isinstance(v, int) for v in checks.values())
    
    return {
        "status": "ready" if all_ready else "degraded",
        "checks": checks,
    }
