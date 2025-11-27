"""
API routes for user activities and analytics.
"""

from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.activity_service import ActivityService

router = APIRouter(prefix="/activity", tags=["Activity"])


# ============== Schemas ==============

class LogActivityRequest(BaseModel):
    action: str
    details: Optional[dict] = None


class ActivityResponse(BaseModel):
    id: str
    action: str
    details: Optional[dict] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class FocusSessionRequest(BaseModel):
    duration_minutes: int = 25
    break_duration_minutes: int = 5
    pomodoros_target: int = 4


class UpdateFocusSessionRequest(BaseModel):
    state: Optional[str] = None
    pomodoros_completed: Optional[int] = None
    memories_reviewed: Optional[int] = None
    memories_created: Optional[int] = None


class FocusSessionResponse(BaseModel):
    id: str
    duration_minutes: int
    break_duration_minutes: int
    pomodoros_target: int
    pomodoros_completed: int
    state: str
    memories_reviewed: int
    memories_created: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ============== Helper ==============

def get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """Get user ID from header or use demo user."""
    return x_user_id or "demo-user"


# ============== Activity Routes ==============

@router.post("/log", response_model=ActivityResponse)
async def log_activity(
    request: LogActivityRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Log a user activity."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ActivityService(db)
    activity = await service.log_activity(user_id, request.action, request.details)
    return activity


@router.get("/recent", response_model=List[ActivityResponse])
async def get_recent_activities(
    limit: int = Query(default=50, le=200),
    action: Optional[str] = Query(default=None),
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get recent activities for the current user."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ActivityService(db)
    activities = await service.get_recent_activities(user_id, limit, action)
    return activities


@router.get("/stats")
async def get_activity_stats(
    days: int = Query(default=30, le=365),
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, int]:
    """Get activity statistics for the current user."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ActivityService(db)
    return await service.get_activity_stats(user_id, days)


@router.get("/daily")
async def get_daily_activity(
    days: int = Query(default=7, le=90),
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
) -> List[Dict]:
    """Get daily activity counts."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ActivityService(db)
    return await service.get_daily_activity(user_id, days)


# ============== Focus Session Routes ==============

@router.post("/focus/sessions", response_model=FocusSessionResponse)
async def create_focus_session(
    request: FocusSessionRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new focus session."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ActivityService(db)
    session = await service.create_focus_session(
        user_id,
        request.duration_minutes,
        request.break_duration_minutes,
        request.pomodoros_target
    )
    return session


@router.get("/focus/sessions", response_model=List[FocusSessionResponse])
async def get_focus_sessions(
    limit: int = Query(default=20, le=100),
    include_active: bool = Query(default=True),
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get focus sessions for the current user."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ActivityService(db)
    sessions = await service.get_focus_sessions(user_id, limit, include_active)
    return sessions


@router.patch("/focus/sessions/{session_id}", response_model=FocusSessionResponse)
async def update_focus_session(
    session_id: str,
    request: UpdateFocusSessionRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update a focus session."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ActivityService(db)
    session = await service.update_focus_session(
        session_id, user_id,
        request.state,
        request.pomodoros_completed,
        request.memories_reviewed,
        request.memories_created
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session


@router.post("/focus/sessions/{session_id}/end", response_model=FocusSessionResponse)
async def end_focus_session(
    session_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """End a focus session."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ActivityService(db)
    session = await service.end_focus_session(session_id, user_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session


@router.get("/focus/stats")
async def get_focus_stats(
    days: int = Query(default=30, le=365),
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """Get focus session statistics."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ActivityService(db)
    return await service.get_focus_stats(user_id, days)
