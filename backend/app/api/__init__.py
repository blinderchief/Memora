"""API routes package for Memora."""

from fastapi import APIRouter

from app.api.routes import health, ingest, memory, search, users

api_router = APIRouter()

# Include all route modules
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(ingest.router, prefix="/ingest", tags=["Ingestion"])
api_router.include_router(memory.router, prefix="/memories", tags=["Memory"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(users.router, tags=["Users"])

__all__ = ["api_router"]
