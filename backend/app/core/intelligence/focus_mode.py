"""Focus Mode - Pomodoro-style study sessions with memory reinforcement."""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from enum import Enum

from app.config import settings
from app.core.intelligence.spaced_repetition import spaced_repetition_service, ReviewDifficulty

logger = logging.getLogger(__name__)


class SessionType(Enum):
    """Types of focus sessions."""
    REVIEW = "review"  # Review existing memories
    LEARN = "learn"  # Learn from selected memories
    CREATE = "create"  # Create new memories
    EXPLORE = "explore"  # Explore connections


class SessionState(Enum):
    """State of a focus session."""
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class FocusSession:
    """Represents a focus/study session."""
    
    def __init__(
        self,
        session_type: SessionType,
        duration_minutes: int = 25,
        break_minutes: int = 5,
        memory_ids: Optional[List[UUID]] = None,
        topic: Optional[str] = None,
        user_id: Optional[str] = None,
    ):
        self.id = uuid4()
        self.session_type = session_type
        self.duration_minutes = duration_minutes
        self.break_minutes = break_minutes
        self.memory_ids = memory_ids or []
        self.topic = topic
        self.user_id = user_id
        
        self.state = SessionState.PENDING
        self.started_at: Optional[datetime] = None
        self.paused_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self.total_pause_duration: int = 0  # seconds
        
        self.memories_reviewed: List[UUID] = []
        self.memories_created: List[UUID] = []
        self.connections_discovered: List[Dict[str, Any]] = []
        self.notes: List[str] = []
        
        self.pomodoros_completed = 0
        self.current_pomodoro = 1
        self.is_break = False

    def start(self):
        """Start the session."""
        self.state = SessionState.ACTIVE
        self.started_at = datetime.utcnow()

    def pause(self):
        """Pause the session."""
        if self.state == SessionState.ACTIVE:
            self.state = SessionState.PAUSED
            self.paused_at = datetime.utcnow()

    def resume(self):
        """Resume the session."""
        if self.state == SessionState.PAUSED and self.paused_at:
            pause_duration = (datetime.utcnow() - self.paused_at).seconds
            self.total_pause_duration += pause_duration
            self.state = SessionState.ACTIVE
            self.paused_at = None

    def complete(self):
        """Mark session as completed."""
        self.state = SessionState.COMPLETED
        self.completed_at = datetime.utcnow()
        self.pomodoros_completed = self.current_pomodoro

    def cancel(self):
        """Cancel the session."""
        self.state = SessionState.CANCELLED
        self.completed_at = datetime.utcnow()

    def get_elapsed_seconds(self) -> int:
        """Get elapsed active time in seconds."""
        if not self.started_at:
            return 0
        
        if self.completed_at:
            total = (self.completed_at - self.started_at).seconds
        else:
            total = (datetime.utcnow() - self.started_at).seconds
        
        return total - self.total_pause_duration

    def get_remaining_seconds(self) -> int:
        """Get remaining time in current phase."""
        target_seconds = (
            self.break_minutes * 60 if self.is_break 
            else self.duration_minutes * 60
        )
        elapsed = self.get_elapsed_seconds() % target_seconds
        return max(0, target_seconds - elapsed)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "session_type": self.session_type.value,
            "state": self.state.value,
            "duration_minutes": self.duration_minutes,
            "break_minutes": self.break_minutes,
            "topic": self.topic,
            "memory_count": len(self.memory_ids),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "elapsed_seconds": self.get_elapsed_seconds(),
            "remaining_seconds": self.get_remaining_seconds(),
            "current_pomodoro": self.current_pomodoro,
            "is_break": self.is_break,
            "pomodoros_completed": self.pomodoros_completed,
            "stats": {
                "memories_reviewed": len(self.memories_reviewed),
                "memories_created": len(self.memories_created),
                "connections_found": len(self.connections_discovered),
            },
        }


class FocusModeService:
    """Service for managing focus/study sessions."""

    def __init__(self):
        self._sessions: Dict[UUID, FocusSession] = {}
        self._user_sessions: Dict[str, List[UUID]] = {}  # user_id -> session_ids
        self._session_history: List[Dict[str, Any]] = []

    async def create_session(
        self,
        session_type: SessionType,
        duration_minutes: int = 25,
        break_minutes: int = 5,
        topic: Optional[str] = None,
        memory_ids: Optional[List[UUID]] = None,
        user_id: Optional[str] = None,
        auto_select_memories: bool = True,
    ) -> FocusSession:
        """Create a new focus session."""
        # Auto-select memories if needed
        if auto_select_memories and not memory_ids and session_type == SessionType.REVIEW:
            due_reviews = await spaced_repetition_service.get_due_reviews(
                limit=duration_minutes // 2
            )
            memory_ids = [UUID(r["memory_id"]) for r in due_reviews]
        
        session = FocusSession(
            session_type=session_type,
            duration_minutes=duration_minutes,
            break_minutes=break_minutes,
            memory_ids=memory_ids,
            topic=topic,
            user_id=user_id,
        )
        
        self._sessions[session.id] = session
        
        if user_id:
            if user_id not in self._user_sessions:
                self._user_sessions[user_id] = []
            self._user_sessions[user_id].append(session.id)
        
        return session

    async def start_session(self, session_id: UUID) -> FocusSession:
        """Start a focus session."""
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        
        session.start()
        return session

    async def pause_session(self, session_id: UUID) -> FocusSession:
        """Pause a focus session."""
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        
        session.pause()
        return session

    async def resume_session(self, session_id: UUID) -> FocusSession:
        """Resume a paused session."""
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        
        session.resume()
        return session

    async def complete_session(self, session_id: UUID) -> Dict[str, Any]:
        """Complete a focus session and generate summary."""
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        
        session.complete()
        
        # Generate session summary
        summary = await self._generate_session_summary(session)
        
        # Save to history
        self._session_history.append({
            "session_id": str(session.id),
            "session_type": session.session_type.value,
            "duration_minutes": session.duration_minutes,
            "completed_at": session.completed_at.isoformat(),
            "memories_reviewed": len(session.memories_reviewed),
            "memories_created": len(session.memories_created),
            "pomodoros": session.pomodoros_completed,
        })
        
        return summary

    async def record_memory_review(
        self,
        session_id: UUID,
        memory_id: UUID,
        difficulty: ReviewDifficulty,
    ) -> Dict[str, Any]:
        """Record a memory review during a session."""
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        
        if session.state != SessionState.ACTIVE:
            raise ValueError("Session is not active")
        
        # Record in session
        if memory_id not in session.memories_reviewed:
            session.memories_reviewed.append(memory_id)
        
        # Update spaced repetition
        health = await spaced_repetition_service.record_review(memory_id, difficulty)
        
        return {
            "memory_id": str(memory_id),
            "session_id": str(session_id),
            "difficulty": difficulty.value,
            "health": health.to_dict(),
            "session_progress": {
                "reviewed": len(session.memories_reviewed),
                "total": len(session.memory_ids),
                "elapsed": session.get_elapsed_seconds(),
            },
        }

    async def add_session_note(
        self,
        session_id: UUID,
        note: str,
    ) -> FocusSession:
        """Add a note during a focus session."""
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        
        session.notes.append(note)
        return session

    async def get_session(self, session_id: UUID) -> Optional[FocusSession]:
        """Get a session by ID."""
        return self._sessions.get(session_id)

    async def get_active_session(
        self,
        user_id: Optional[str] = None,
    ) -> Optional[FocusSession]:
        """Get the currently active session for a user."""
        if user_id and user_id in self._user_sessions:
            for sid in reversed(self._user_sessions[user_id]):
                session = self._sessions.get(sid)
                if session and session.state in [SessionState.ACTIVE, SessionState.PAUSED]:
                    return session
        
        # Check all sessions if no user_id
        for session in self._sessions.values():
            if session.state in [SessionState.ACTIVE, SessionState.PAUSED]:
                return session
        
        return None

    async def get_session_history(
        self,
        user_id: Optional[str] = None,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """Get session history."""
        history = self._session_history[-limit:]
        history.reverse()
        return history

    async def get_focus_stats(
        self,
        user_id: Optional[str] = None,
        days: int = 7,
    ) -> Dict[str, Any]:
        """Get focus statistics for a user."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        total_focus_time = 0
        total_pomodoros = 0
        total_reviews = 0
        total_memories_created = 0
        sessions_by_type: Dict[str, int] = {}
        daily_focus: Dict[str, int] = {}
        
        for record in self._session_history:
            try:
                completed_at = datetime.fromisoformat(record["completed_at"])
                if completed_at < cutoff:
                    continue
                
                total_focus_time += record.get("duration_minutes", 0)
                total_pomodoros += record.get("pomodoros", 0)
                total_reviews += record.get("memories_reviewed", 0)
                total_memories_created += record.get("memories_created", 0)
                
                stype = record.get("session_type", "other")
                sessions_by_type[stype] = sessions_by_type.get(stype, 0) + 1
                
                day = completed_at.strftime("%Y-%m-%d")
                daily_focus[day] = daily_focus.get(day, 0) + record.get("duration_minutes", 0)
                
            except:
                continue
        
        return {
            "period_days": days,
            "total_focus_minutes": total_focus_time,
            "total_pomodoros": total_pomodoros,
            "total_reviews": total_reviews,
            "total_memories_created": total_memories_created,
            "sessions_by_type": sessions_by_type,
            "daily_focus_minutes": daily_focus,
            "average_daily_minutes": round(total_focus_time / max(days, 1), 1),
            "streak": await self._calculate_focus_streak(),
        }

    async def suggest_session(
        self,
        available_minutes: int = 30,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Suggest an optimal focus session based on current state."""
        # Check due reviews
        due_reviews = await spaced_repetition_service.get_due_reviews(limit=50)
        
        # Get memory health
        health = await spaced_repetition_service.get_memory_health_dashboard()
        
        # Determine best session type
        if health.get("overdue_reviews", 0) > 5:
            session_type = SessionType.REVIEW
            suggestion = "You have overdue reviews - let's strengthen those memories!"
        elif health.get("reviews_due_today", 0) > 0:
            session_type = SessionType.REVIEW
            suggestion = f"You have {health['reviews_due_today']} reviews due today."
        elif available_minutes >= 30:
            session_type = SessionType.EXPLORE
            suggestion = "Perfect time to explore connections in your knowledge!"
        else:
            session_type = SessionType.REVIEW
            suggestion = "Quick review session to maintain your memory health."
        
        # Calculate optimal duration
        if available_minutes >= 50:
            duration = 25
            break_time = 5
            pomodoros = 2
        elif available_minutes >= 25:
            duration = 25
            break_time = 5
            pomodoros = 1
        else:
            duration = available_minutes
            break_time = 0
            pomodoros = 1
        
        return {
            "session_type": session_type.value,
            "duration_minutes": duration,
            "break_minutes": break_time,
            "estimated_pomodoros": pomodoros,
            "suggestion": suggestion,
            "memory_ids": [r["memory_id"] for r in due_reviews[:duration // 2]],
            "health_score": health.get("health_score", 0),
        }

    async def _generate_session_summary(
        self,
        session: FocusSession,
    ) -> Dict[str, Any]:
        """Generate a summary for a completed session."""
        elapsed_minutes = session.get_elapsed_seconds() / 60
        
        achievements = []
        
        if session.memories_reviewed:
            achievements.append(f"Reviewed {len(session.memories_reviewed)} memories")
        
        if session.memories_created:
            achievements.append(f"Created {len(session.memories_created)} new memories")
        
        if session.connections_discovered:
            achievements.append(f"Discovered {len(session.connections_discovered)} connections")
        
        if session.pomodoros_completed >= 2:
            achievements.append(f"Completed {session.pomodoros_completed} pomodoros!")
        
        return {
            "session": session.to_dict(),
            "duration_minutes": round(elapsed_minutes, 1),
            "achievements": achievements,
            "notes": session.notes,
            "encouragement": self._get_encouragement(session),
        }

    def _get_encouragement(self, session: FocusSession) -> str:
        """Get an encouraging message based on session performance."""
        reviewed = len(session.memories_reviewed)
        
        if reviewed >= 10:
            return "🌟 Outstanding focus session! Your memory is getting stronger!"
        elif reviewed >= 5:
            return "💪 Great job! Consistency is key to lasting knowledge."
        elif reviewed >= 1:
            return "👍 Good start! Every review strengthens your memory."
        else:
            return "🎯 Session complete! Ready for the next one?"

    async def _calculate_focus_streak(self) -> int:
        """Calculate consecutive days with focus sessions."""
        dates = set()
        for record in self._session_history:
            try:
                dt = datetime.fromisoformat(record["completed_at"])
                dates.add(dt.date())
            except:
                continue
        
        if not dates:
            return 0
        
        sorted_dates = sorted(dates, reverse=True)
        today = datetime.utcnow().date()
        
        streak = 0
        expected = today
        
        for date in sorted_dates:
            if date == expected:
                streak += 1
                expected = expected - timedelta(days=1)
            elif date < expected:
                break
        
        return streak


# Global service instance
focus_mode_service = FocusModeService()
