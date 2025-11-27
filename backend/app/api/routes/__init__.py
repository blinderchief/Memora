"""API route modules."""

from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.ingest import router as ingest_router
from app.api.routes.memory import router as memory_router
from app.api.routes.search import router as search_router
from app.api.routes.users import router as users_router
from app.api.routes.intelligence import router as intelligence_router
from app.api.routes.chat import router as chat_router
from app.api.routes.activity import router as activity_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(ingest_router, prefix="/ingest", tags=["Ingestion"])
api_router.include_router(memory_router, prefix="/memories", tags=["Memories"])
api_router.include_router(search_router, prefix="/search", tags=["Search"])
api_router.include_router(users_router, tags=["Users"])
api_router.include_router(
    intelligence_router,
    prefix="/intelligence",
    tags=["Intelligence", "AI Insights", "Agent", "Memory Health"]
)
api_router.include_router(chat_router, tags=["Chat History"])
api_router.include_router(activity_router, tags=["Activity & Focus"])

__all__ = ["api_router"]
