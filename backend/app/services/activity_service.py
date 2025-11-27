"""
Service for logging and retrieving user activities.
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy import delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import ActivityLog, FocusSession

logger = logging.getLogger(__name__)


class ActivityService:
    """Service for managing user activities and analytics."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # ============== Activity Logging ==============
    
    async def log_activity(
        self,
        user_id: str,
        action: str,
        details: Optional[dict] = None
    ) -> ActivityLog:
        """Log a user activity."""
        activity = ActivityLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            details=details or {}
        )
        self.db.add(activity)
        await self.db.commit()
        await self.db.refresh(activity)
        return activity
    
    async def get_recent_activities(
        self,
        user_id: str,
        limit: int = 50,
        action_filter: Optional[str] = None
    ) -> List[ActivityLog]:
        """Get recent activities for a user."""
        query = select(ActivityLog).where(
            ActivityLog.user_id == user_id
        )
        
        if action_filter:
            query = query.where(ActivityLog.action == action_filter)
        
        query = query.order_by(desc(ActivityLog.created_at)).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_activity_stats(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, int]:
        """Get activity statistics for a user."""
        since = datetime.utcnow() - timedelta(days=days)
        
        query = select(
            ActivityLog.action,
            func.count(ActivityLog.id).label("count")
        ).where(
            ActivityLog.user_id == user_id,
            ActivityLog.created_at >= since
        ).group_by(ActivityLog.action)
        
        result = await self.db.execute(query)
        return {str(row.action): int(row.count) for row in result.all()}
    
    async def get_daily_activity(
        self,
        user_id: str,
        days: int = 7
    ) -> List[Dict]:
        """Get daily activity counts."""
        since = datetime.utcnow() - timedelta(days=days)
        
        query = select(
            func.date(ActivityLog.created_at).label("date"),
            func.count(ActivityLog.id).label("count")
        ).where(
            ActivityLog.user_id == user_id,
            ActivityLog.created_at >= since
        ).group_by(
            func.date(ActivityLog.created_at)
        ).order_by(func.date(ActivityLog.created_at))
        
        result = await self.db.execute(query)
        return [{"date": str(row.date), "count": row.count} for row in result.all()]
    
    async def cleanup_old_activities(
        self,
        user_id: str,
        days: int = 90
    ) -> int:
        """Delete activities older than specified days."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        query = delete(ActivityLog).where(
            ActivityLog.user_id == user_id,
            ActivityLog.created_at < cutoff
        )
        
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount
    
    # ============== Focus Sessions ==============
    
    async def create_focus_session(
        self,
        user_id: str,
        duration_minutes: int = 25,
        break_duration_minutes: int = 5,
        pomodoros_target: int = 4
    ) -> FocusSession:
        """Create a new focus session."""
        session = FocusSession(
            id=str(uuid.uuid4()),
            user_id=user_id,
            duration_minutes=duration_minutes,
            break_duration_minutes=break_duration_minutes,
            pomodoros_target=pomodoros_target
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        
        # Log activity
        await self.log_activity(user_id, "focus_session_started", {
            "session_id": session.id,
            "duration_minutes": duration_minutes
        })
        
        return session
    
    async def update_focus_session(
        self,
        session_id: str,
        user_id: str,
        state: Optional[str] = None,
        pomodoros_completed: Optional[int] = None,
        memories_reviewed: Optional[int] = None,
        memories_created: Optional[int] = None
    ) -> Optional[FocusSession]:
        """Update a focus session."""
        query = select(FocusSession).where(
            FocusSession.id == session_id,
            FocusSession.user_id == user_id
        )
        result = await self.db.execute(query)
        session = result.scalar_one_or_none()
        
        if not session:
            return None
        
        if state is not None:
            session.state = state
            if state == "completed":
                session.ended_at = datetime.utcnow()
        
        if pomodoros_completed is not None:
            session.pomodoros_completed = pomodoros_completed
        
        if memories_reviewed is not None:
            session.memories_reviewed = memories_reviewed
        
        if memories_created is not None:
            session.memories_created = memories_created
        
        await self.db.commit()
        await self.db.refresh(session)
        
        return session
    
    async def end_focus_session(
        self,
        session_id: str,
        user_id: str
    ) -> Optional[FocusSession]:
        """End a focus session."""
        session = await self.update_focus_session(
            session_id, user_id, state="completed"
        )
        
        if session:
            await self.log_activity(user_id, "focus_session_completed", {
                "session_id": session_id,
                "pomodoros_completed": session.pomodoros_completed,
                "memories_reviewed": session.memories_reviewed
            })
        
        return session
    
    async def get_focus_sessions(
        self,
        user_id: str,
        limit: int = 20,
        include_active: bool = True
    ) -> List[FocusSession]:
        """Get focus sessions for a user."""
        query = select(FocusSession).where(
            FocusSession.user_id == user_id
        )
        
        if not include_active:
            query = query.where(FocusSession.state == "completed")
        
        query = query.order_by(desc(FocusSession.started_at)).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_focus_stats(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict:
        """Get focus session statistics."""
        since = datetime.utcnow() - timedelta(days=days)
        
        query = select(
            func.count(FocusSession.id).label("total_sessions"),
            func.sum(FocusSession.pomodoros_completed).label("total_pomodoros"),
            func.sum(FocusSession.memories_reviewed).label("total_reviewed"),
            func.sum(FocusSession.memories_created).label("total_created")
        ).where(
            FocusSession.user_id == user_id,
            FocusSession.started_at >= since,
            FocusSession.state == "completed"
        )
        
        result = await self.db.execute(query)
        row = result.one()
        
        return {
            "total_sessions": row.total_sessions or 0,
            "total_pomodoros": row.total_pomodoros or 0,
            "total_memories_reviewed": row.total_reviewed or 0,
            "total_memories_created": row.total_created or 0,
            "period_days": days
        }
