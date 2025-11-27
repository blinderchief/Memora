"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.config import settings
from app.db.qdrant import qdrant_service
from app.db.database import init_db, close_db

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for startup/shutdown events."""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    
    # Initialize Qdrant collection
    await qdrant_service.initialize()
    logger.info("Qdrant collection initialized")
    
    # Initialize PostgreSQL database (Neon)
    if settings.database_url:
        db_initialized = await init_db()
        if db_initialized:
            logger.info("PostgreSQL database initialized (Neon)")
        else:
            logger.warning("PostgreSQL database initialization failed")
    else:
        logger.info("PostgreSQL not configured - chat history disabled")

    yield
    
    # Shutdown
    await close_db()
    logger.info("Shutting down application")


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        description="Collaborative Memory OS for Professional Teams",
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes (both /api/v1 and /api for compatibility)
    app.include_router(api_router, prefix="/api/v1")
    app.include_router(api_router, prefix="/api")

    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "app": settings.app_name,
            "version": settings.app_version,
        }

    return app


app = create_application()
