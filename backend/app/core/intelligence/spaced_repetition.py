"""Spaced Repetition and Memory Health System - Adaptive forgetting curve and smart review."""

import logging
import math
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID, uuid4
from enum import Enum

from app.config import settings
from app.db.qdrant import qdrant_service

logger = logging.getLogger(__name__)


class MemoryStrength(Enum):
    """Memory retention strength levels."""
    FRESH = "fresh"  # Just learned, very high retention
    STRONG = "strong"  # Well remembered
    MODERATE = "moderate"  # Needs reinforcement soon
    WEAK = "weak"  # At risk of forgetting
    FADING = "fading"  # Likely forgotten, needs review


class ReviewDifficulty(Enum):
    """User feedback on memory review difficulty."""
    EASY = 4  # Remembered instantly
    GOOD = 3  # Remembered with some thought
    HARD = 2  # Struggled but remembered
    FORGOT = 1  # Couldn't remember


class MemoryHealth:
    """Represents the health state of a memory."""
    
    def __init__(
        self,
        memory_id: UUID,
        ease_factor: float = 2.5,  # Default SM-2 ease factor
        interval_days: int = 1,
        repetitions: int = 0,
        last_review: Optional[datetime] = None,
        next_review: Optional[datetime] = None,
        strength: MemoryStrength = MemoryStrength.FRESH,
        importance: float = 0.5,  # User-defined or AI-inferred importance
        access_count: int = 0,
        last_accessed: Optional[datetime] = None,
    ):
        self.memory_id = memory_id
        self.ease_factor = ease_factor
        self.interval_days = interval_days
        self.repetitions = repetitions
        self.last_review = last_review or datetime.utcnow()
        self.next_review = next_review or datetime.utcnow() + timedelta(days=1)
        self.strength = strength
        self.importance = importance
        self.access_count = access_count
        self.last_accessed = last_accessed
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "memory_id": str(self.memory_id),
            "ease_factor": self.ease_factor,
            "interval_days": self.interval_days,
            "repetitions": self.repetitions,
            "last_review": self.last_review.isoformat() if self.last_review else None,
            "next_review": self.next_review.isoformat() if self.next_review else None,
            "strength": self.strength.value,
            "importance": self.importance,
            "access_count": self.access_count,
            "retention_score": self.calculate_retention_score(),
        }
    
    def calculate_retention_score(self) -> float:
        """Calculate current retention score based on forgetting curve."""
        if not self.last_review:
            return 0.5
        
        days_since_review = (datetime.utcnow() - self.last_review).days
        
        # Ebbinghaus forgetting curve: R = e^(-t/S)
        # Where S is stability (proportional to interval and ease)
        stability = self.interval_days * (self.ease_factor / 2.5)
        
        if stability <= 0:
            return 0.5
        
        retention = math.exp(-days_since_review / stability)
        return max(0, min(1, retention))
    
    def update_strength(self):
        """Update memory strength based on retention score."""
        score = self.calculate_retention_score()
        
        if score > 0.9:
            self.strength = MemoryStrength.FRESH
        elif score > 0.7:
            self.strength = MemoryStrength.STRONG
        elif score > 0.5:
            self.strength = MemoryStrength.MODERATE
        elif score > 0.3:
            self.strength = MemoryStrength.WEAK
        else:
            self.strength = MemoryStrength.FADING


class SpacedRepetitionService:
    """Service implementing SM-2 spaced repetition algorithm."""

    def __init__(self):
        self._memory_health: Dict[UUID, MemoryHealth] = {}
        self._review_history: List[Dict[str, Any]] = []

    async def initialize_memory(
        self,
        memory_id: UUID,
        importance: float = 0.5,
    ) -> MemoryHealth:
        """Initialize health tracking for a new memory."""
        health = MemoryHealth(
            memory_id=memory_id,
            importance=importance,
        )
        self._memory_health[memory_id] = health
        return health

    async def record_review(
        self,
        memory_id: UUID,
        difficulty: ReviewDifficulty,
    ) -> MemoryHealth:
        """
        Record a review and update the memory's spaced repetition schedule.
        
        Uses SM-2 algorithm:
        - Quality >= 3: Increase interval
        - Quality < 3: Reset to beginning
        - Adjust ease factor based on performance
        """
        health = self._memory_health.get(memory_id)
        if not health:
            health = await self.initialize_memory(memory_id)
        
        quality = difficulty.value
        now = datetime.utcnow()
        
        # Record in history
        self._review_history.append({
            "memory_id": str(memory_id),
            "difficulty": difficulty.value,
            "timestamp": now.isoformat(),
            "previous_interval": health.interval_days,
        })
        
        # SM-2 Algorithm
        if quality >= 3:
            # Successful recall
            if health.repetitions == 0:
                health.interval_days = 1
            elif health.repetitions == 1:
                health.interval_days = 6
            else:
                health.interval_days = round(health.interval_days * health.ease_factor)
            
            health.repetitions += 1
        else:
            # Failed recall - reset
            health.repetitions = 0
            health.interval_days = 1
        
        # Update ease factor
        # EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
        health.ease_factor = max(
            1.3,
            health.ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
        )
        
        # Update review times
        health.last_review = now
        health.next_review = now + timedelta(days=health.interval_days)
        
        # Update strength
        health.update_strength()
        
        # Persist to memory metadata
        await self._update_memory_health_metadata(memory_id, health)
        
        return health

    async def record_access(self, memory_id: UUID) -> MemoryHealth:
        """Record when a memory is accessed (viewed, searched, etc.)."""
        health = self._memory_health.get(memory_id)
        if not health:
            health = await self.initialize_memory(memory_id)
        
        health.access_count += 1
        health.last_accessed = datetime.utcnow()
        
        # Passive access provides small retention boost
        # But less than active review
        if health.strength in [MemoryStrength.WEAK, MemoryStrength.FADING]:
            health.interval_days = max(1, health.interval_days - 1)
            health.next_review = datetime.utcnow() + timedelta(days=health.interval_days)
        
        return health

    async def get_due_reviews(
        self,
        limit: int = 10,
        include_overdue: bool = True,
    ) -> List[Dict[str, Any]]:
        """Get memories that are due for review."""
        now = datetime.utcnow()
        due_memories = []
        
        for memory_id, health in self._memory_health.items():
            is_due = health.next_review <= now
            is_overdue = health.next_review < now - timedelta(days=1)
            
            if is_due or (include_overdue and is_overdue):
                # Get memory details
                memory = await qdrant_service.get_memory(memory_id)
                if memory:
                    payload = memory.get("payload", {})
                    
                    # Calculate priority score
                    overdue_days = (now - health.next_review).days
                    priority = (
                        health.importance * 0.4 +
                        min(overdue_days / 7, 1) * 0.4 +
                        (1 - health.calculate_retention_score()) * 0.2
                    )
                    
                    due_memories.append({
                        "memory_id": str(memory_id),
                        "title": payload.get("title"),
                        "content_preview": payload.get("content", "")[:150],
                        "memory_type": payload.get("memory_type"),
                        "health": health.to_dict(),
                        "days_overdue": max(0, overdue_days),
                        "priority_score": priority,
                    })
        
        # Sort by priority
        due_memories.sort(key=lambda x: x["priority_score"], reverse=True)
        
        return due_memories[:limit]

    async def get_memories_by_strength(
        self,
        strength: MemoryStrength,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """Get memories filtered by strength level."""
        matching = []
        
        for memory_id, health in self._memory_health.items():
            health.update_strength()  # Refresh strength calculation
            
            if health.strength == strength:
                memory = await qdrant_service.get_memory(memory_id)
                if memory:
                    matching.append({
                        "memory_id": str(memory_id),
                        "title": memory.get("payload", {}).get("title"),
                        "health": health.to_dict(),
                    })
        
        return matching[:limit]

    async def get_memory_health_dashboard(self) -> Dict[str, Any]:
        """Get overall memory health statistics."""
        now = datetime.utcnow()
        
        # Update all strengths
        strength_counts = {s.value: 0 for s in MemoryStrength}
        total_retention = 0
        overdue_count = 0
        due_today = 0
        
        for health in self._memory_health.values():
            health.update_strength()
            strength_counts[health.strength.value] += 1
            total_retention += health.calculate_retention_score()
            
            if health.next_review <= now:
                if health.next_review.date() == now.date():
                    due_today += 1
                else:
                    overdue_count += 1
        
        total_memories = len(self._memory_health)
        avg_retention = total_retention / total_memories if total_memories > 0 else 0
        
        # Calculate health score (0-100)
        health_score = round(
            (strength_counts.get(MemoryStrength.FRESH.value, 0) * 100 +
             strength_counts.get(MemoryStrength.STRONG.value, 0) * 80 +
             strength_counts.get(MemoryStrength.MODERATE.value, 0) * 60 +
             strength_counts.get(MemoryStrength.WEAK.value, 0) * 40 +
             strength_counts.get(MemoryStrength.FADING.value, 0) * 20) /
            max(total_memories, 1)
        )
        
        return {
            "total_memories": total_memories,
            "health_score": health_score,
            "average_retention": round(avg_retention * 100, 1),
            "strength_distribution": strength_counts,
            "reviews_due_today": due_today,
            "overdue_reviews": overdue_count,
            "review_streak": await self._calculate_review_streak(),
            "weekly_review_stats": await self._get_weekly_review_stats(),
        }

    async def suggest_study_session(
        self,
        duration_minutes: int = 15,
        focus_weak: bool = True,
    ) -> Dict[str, Any]:
        """Suggest an optimal study session."""
        # Estimate reviews per minute (1-2 minutes per memory)
        estimated_reviews = duration_minutes // 2
        
        # Get due reviews
        due = await self.get_due_reviews(limit=estimated_reviews * 2)
        
        if focus_weak:
            # Prioritize weak memories
            weak = [d for d in due if d.get("health", {}).get("strength") in 
                   [MemoryStrength.WEAK.value, MemoryStrength.FADING.value]]
            others = [d for d in due if d not in weak]
            ordered = weak + others
        else:
            ordered = due
        
        selected = ordered[:estimated_reviews]
        
        return {
            "duration_minutes": duration_minutes,
            "estimated_reviews": len(selected),
            "memories": selected,
            "focus": "weak_memories" if focus_weak else "due_reviews",
            "tips": [
                "Take your time with each memory",
                "Try to recall before revealing the full content",
                "Rate honestly - it helps the algorithm",
            ],
        }

    async def _calculate_review_streak(self) -> int:
        """Calculate consecutive days with reviews."""
        if not self._review_history:
            return 0
        
        # Sort by date
        dates = set()
        for review in self._review_history:
            try:
                dt = datetime.fromisoformat(review["timestamp"])
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

    async def _get_weekly_review_stats(self) -> Dict[str, int]:
        """Get review counts for the past week."""
        now = datetime.utcnow()
        week_start = now - timedelta(days=7)
        
        daily_counts = {i: 0 for i in range(7)}
        
        for review in self._review_history:
            try:
                dt = datetime.fromisoformat(review["timestamp"])
                if dt >= week_start:
                    days_ago = (now - dt).days
                    if 0 <= days_ago < 7:
                        daily_counts[days_ago] += 1
            except:
                continue
        
        return {
            (now - timedelta(days=i)).strftime("%a"): count
            for i, count in daily_counts.items()
        }

    async def _update_memory_health_metadata(
        self,
        memory_id: UUID,
        health: MemoryHealth,
    ):
        """Update memory metadata with health information."""
        try:
            memory = await qdrant_service.get_memory(memory_id)
            if memory:
                payload = memory.get("payload", {})
                payload["memory_health"] = health.to_dict()
                
                # We would update the memory here
                # For now, just keep in memory
                logger.debug(f"Updated health for memory {memory_id}")
        except Exception as e:
            logger.error(f"Failed to update memory health: {e}")

    def get_health(self, memory_id: UUID) -> Optional[MemoryHealth]:
        """Get health status for a specific memory."""
        return self._memory_health.get(memory_id)


# Global service instance
spaced_repetition_service = SpacedRepetitionService()
