"""
Database configuration for user activities and chat history.
Uses SQLAlchemy with async support for Neon PostgreSQL.
"""

import logging
import os
from datetime import datetime
from typing import AsyncGenerator, Optional
import uuid

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)


# Database URL from settings
DATABASE_URL = settings.database_url

# Create async engine
engine = None
async_session_factory = None


def get_engine():
    """Get or create the database engine."""
    global engine
    if engine is None:
        if not DATABASE_URL:
            logger.warning("DATABASE_URL not configured - database features disabled")
            return None
        
        import ssl
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
        
        # Parse the URL properly
        parsed = urlparse(DATABASE_URL)
        
        # Extract query parameters
        query_params = parse_qs(parsed.query)
        
        # Check for SSL mode
        connect_args = {}
        ssl_required = False
        
        if 'sslmode' in query_params:
            ssl_mode = query_params.pop('sslmode')[0]
            if ssl_mode in ('require', 'prefer', 'verify-ca', 'verify-full'):
                ssl_required = True
        
        # Remove other asyncpg-incompatible params
        incompatible_params = ['sslmode', 'channel_binding', 'options']
        for param in incompatible_params:
            query_params.pop(param, None)
        
        # If SSL is required or it's a Neon URL, enable SSL
        if ssl_required or 'neon.tech' in parsed.netloc:
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            connect_args["ssl"] = ssl_context
        
        # Rebuild the URL with asyncpg driver
        scheme = "postgresql+asyncpg"
        
        # Flatten query params (parse_qs returns lists)
        flat_params = {k: v[0] for k, v in query_params.items()}
        new_query = urlencode(flat_params) if flat_params else ""
        
        # Reconstruct URL
        db_url = urlunparse((
            scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))
        
        engine = create_async_engine(
            db_url,
            echo=settings.debug,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            connect_args=connect_args,
        )
        logger.info(f"Database engine created (SSL: {'enabled' if connect_args else 'disabled'})")
    return engine


def get_session_factory():
    """Get or create the session factory."""
    global async_session_factory
    if async_session_factory is None:
        eng = get_engine()
        if eng is None:
            return None
        async_session_factory = async_sessionmaker(
            eng,
            class_=AsyncSession,
            expire_on_commit=False
        )
    return async_session_factory


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


# ============== Models ==============

class DBUser(Base):
    """User model - synced with Clerk."""
    __tablename__ = "users"
    
    id = Column(String(255), primary_key=True)  # Clerk user ID
    email = Column(String(255), unique=True, nullable=False)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Preferences stored as JSON
    preferences = Column(JSONB, default=dict)
    
    # Subscription
    plan = Column(String(50), default="free")  # free, pro, enterprise


class ChatSession(Base):
    """Chat session with the AI agent."""
    __tablename__ = "chat_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), default="New Chat")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_archived = Column(Boolean, default=False)


class ChatMessage(Base):
    """Individual chat message."""
    __tablename__ = "chat_messages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    sources = Column(JSONB, nullable=True)  # Memory sources used
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class FocusSession(Base):
    """Pomodoro focus session."""
    __tablename__ = "focus_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False)
    break_duration_minutes = Column(Integer, default=5)
    pomodoros_target = Column(Integer, default=4)
    pomodoros_completed = Column(Integer, default=0)
    state = Column(String(20), default="active")  # active, paused, break, completed
    memories_reviewed = Column(Integer, default=0)
    memories_created = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)


class ActivityLog(Base):
    """User activity log for analytics."""
    __tablename__ = "activity_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)  # search, upload, chat, review, etc.
    details = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class UserInsight(Base):
    """AI-generated insights for users."""
    __tablename__ = "user_insights"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # pattern, suggestion, milestone
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="medium")  # low, medium, high
    is_read = Column(Boolean, default=False)
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============== Database Functions ==============

async def init_db():
    """Initialize the database and create tables."""
    eng = get_engine()
    if eng is None:
        logger.warning("Database not configured - skipping initialization")
        return False
    
    try:
        async with eng.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return False


async def get_db() -> AsyncGenerator[Optional[AsyncSession], None]:
    """Dependency to get database session."""
    factory = get_session_factory()
    if factory is None:
        yield None
        return
    
    async with factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def close_db():
    """Close database connections."""
    global engine, async_session_factory
    if engine:
        await engine.dispose()
        engine = None
        async_session_factory = None
        logger.info("Database connections closed")
