"""Digest Service - Daily/Weekly memory digests and insights summaries."""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
import json

from google import genai
from google.genai import types

from app.config import settings
from app.db.qdrant import qdrant_service
from app.core.intelligence.insights import insights_service

logger = logging.getLogger(__name__)


class DigestType:
    """Types of digests that can be generated."""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class Digest:
    """Represents a generated digest."""
    
    def __init__(
        self,
        digest_type: str,
        title: str,
        summary: str,
        sections: List[Dict[str, Any]],
        memory_count: int,
        period_start: datetime,
        period_end: datetime,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.id = uuid4()
        self.digest_type = digest_type
        self.title = title
        self.summary = summary
        self.sections = sections
        self.memory_count = memory_count
        self.period_start = period_start
        self.period_end = period_end
        self.metadata = metadata or {}
        self.created_at = datetime.utcnow()
        self.is_read = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "digest_type": self.digest_type,
            "title": self.title,
            "summary": self.summary,
            "sections": self.sections,
            "memory_count": self.memory_count,
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "is_read": self.is_read,
        }


class DigestService:
    """Service for generating periodic digests."""

    def __init__(self):
        self._gemini_client: Optional[genai.Client] = None
        self._use_gemini = bool(settings.gemini_api_key)
        self._cached_digests: Dict[str, Digest] = {}

    @property
    def gemini_client(self) -> genai.Client:
        """Get or create Gemini client."""
        if self._gemini_client is None:
            if not settings.gemini_api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            self._gemini_client = genai.Client(api_key=settings.gemini_api_key)
        return self._gemini_client

    async def generate_daily_digest(
        self,
        user_id: Optional[str] = None,
        date: Optional[datetime] = None,
    ) -> Digest:
        """
        Generate a daily digest of memories and insights.
        
        Includes:
        - Activity summary
        - Key memories added
        - Insights discovered
        - Connections made
        - Tomorrow's suggestions
        """
        target_date = date or datetime.utcnow()
        period_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        period_end = period_start + timedelta(days=1)
        
        # Get memories from the day
        filters = qdrant_service.build_filter(
            date_from=period_start,
            date_to=period_end,
        )
        memories = await qdrant_service.list_memories(limit=100, filters=filters)
        
        # Get insights
        insights = await insights_service.generate_daily_insights()
        
        sections = []
        
        # Activity Overview
        memory_types = {}
        for m in memories:
            mtype = m.get("payload", {}).get("memory_type", "note")
            memory_types[mtype] = memory_types.get(mtype, 0) + 1
        
        sections.append({
            "title": "📊 Today's Activity",
            "type": "stats",
            "content": {
                "total_memories": len(memories),
                "breakdown": memory_types,
                "most_active_type": max(memory_types, key=memory_types.get) if memory_types else None,
            },
        })
        
        # Key Memories
        if memories:
            key_memories = await self._select_key_memories(memories[:20])
            sections.append({
                "title": "⭐ Key Memories",
                "type": "memories",
                "content": key_memories,
            })
        
        # Insights
        if insights:
            sections.append({
                "title": "💡 Insights",
                "type": "insights",
                "content": [i.to_dict() for i in insights[:3]],
            })
        
        # Generate tomorrow's suggestions
        suggestions = await self._generate_daily_suggestions(memories, insights)
        if suggestions:
            sections.append({
                "title": "🎯 For Tomorrow",
                "type": "suggestions",
                "content": suggestions,
            })
        
        # Generate summary
        summary = await self._generate_digest_summary(
            memories, insights, DigestType.DAILY
        )
        
        digest = Digest(
            digest_type=DigestType.DAILY,
            title=f"Daily Digest - {target_date.strftime('%B %d, %Y')}",
            summary=summary,
            sections=sections,
            memory_count=len(memories),
            period_start=period_start,
            period_end=period_end,
            metadata={"user_id": user_id} if user_id else {},
        )
        
        # Cache the digest
        cache_key = f"daily_{target_date.strftime('%Y-%m-%d')}"
        self._cached_digests[cache_key] = digest
        
        return digest

    async def generate_weekly_digest(
        self,
        user_id: Optional[str] = None,
        week_start: Optional[datetime] = None,
    ) -> Digest:
        """
        Generate a comprehensive weekly digest.
        
        Includes:
        - Week overview with trends
        - Top memories by type
        - Learning progress
        - Knowledge growth map
        - Patterns and insights
        - Goals for next week
        """
        now = datetime.utcnow()
        if week_start:
            period_start = week_start
        else:
            # Start from Monday of current week
            period_start = now - timedelta(days=now.weekday())
            period_start = period_start.replace(hour=0, minute=0, second=0, microsecond=0)
        
        period_end = period_start + timedelta(days=7)
        
        # Get all memories from the week
        filters = qdrant_service.build_filter(
            date_from=period_start,
            date_to=min(period_end, now),
        )
        memories = await qdrant_service.list_memories(limit=500, filters=filters)
        
        # Get weekly insights
        insights = await insights_service.generate_weekly_insights()
        
        sections = []
        
        # Week Overview
        daily_counts = {}
        for m in memories:
            created = m.get("payload", {}).get("created_at")
            if created:
                if isinstance(created, str):
                    try:
                        created = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    except:
                        continue
                day = created.strftime("%A")
                daily_counts[day] = daily_counts.get(day, 0) + 1
        
        sections.append({
            "title": "📅 Week Overview",
            "type": "overview",
            "content": {
                "total_memories": len(memories),
                "daily_activity": daily_counts,
                "most_productive_day": max(daily_counts, key=daily_counts.get) if daily_counts else None,
                "average_per_day": round(len(memories) / 7, 1),
            },
        })
        
        # Top Memories by Category
        categorized = {}
        for m in memories:
            mtype = m.get("payload", {}).get("memory_type", "note")
            if mtype not in categorized:
                categorized[mtype] = []
            categorized[mtype].append(m)
        
        top_by_category = {}
        for mtype, mems in categorized.items():
            top_by_category[mtype] = await self._select_key_memories(mems[:5])
        
        sections.append({
            "title": "🏆 Top Memories by Category",
            "type": "categorized_memories",
            "content": top_by_category,
        })
        
        # Knowledge Growth
        topics = await self._analyze_topic_growth(memories)
        sections.append({
            "title": "📈 Knowledge Growth",
            "type": "growth",
            "content": topics,
        })
        
        # Patterns & Insights
        if insights:
            sections.append({
                "title": "🔮 Patterns & Insights",
                "type": "insights",
                "content": [i.to_dict() for i in insights[:5]],
            })
        
        # Connections Made
        connections = await self._find_week_connections(memories)
        if connections:
            sections.append({
                "title": "🔗 New Connections",
                "type": "connections",
                "content": connections,
            })
        
        # Next Week Goals
        goals = await self._generate_weekly_goals(memories, insights)
        sections.append({
            "title": "🎯 Focus Areas for Next Week",
            "type": "goals",
            "content": goals,
        })
        
        # Generate summary
        summary = await self._generate_digest_summary(
            memories, insights, DigestType.WEEKLY
        )
        
        week_number = period_start.isocalendar()[1]
        digest = Digest(
            digest_type=DigestType.WEEKLY,
            title=f"Weekly Digest - Week {week_number}, {period_start.year}",
            summary=summary,
            sections=sections,
            memory_count=len(memories),
            period_start=period_start,
            period_end=period_end,
            metadata={"user_id": user_id, "week_number": week_number} if user_id else {"week_number": week_number},
        )
        
        # Cache the digest
        cache_key = f"weekly_{period_start.strftime('%Y-%W')}"
        self._cached_digests[cache_key] = digest
        
        return digest

    async def _select_key_memories(
        self,
        memories: List[Dict[str, Any]],
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """Select the most important memories from a list."""
        if not memories:
            return []
        
        # Simple scoring based on content length and type
        scored = []
        important_types = {"decision", "insight", "action_item", "idea"}
        
        for m in memories:
            payload = m.get("payload", {})
            score = 0
            
            # Boost for important types
            if payload.get("memory_type") in important_types:
                score += 2
            
            # Boost for longer content (more detailed)
            content_len = len(payload.get("content", ""))
            score += min(content_len / 200, 3)  # Max 3 points
            
            # Boost for having tags
            if payload.get("tags"):
                score += 1
            
            scored.append((m, score))
        
        # Sort by score and return top memories
        scored.sort(key=lambda x: x[1], reverse=True)
        
        return [
            {
                "id": m.get("id"),
                "title": m.get("payload", {}).get("title"),
                "type": m.get("payload", {}).get("memory_type"),
                "preview": m.get("payload", {}).get("content", "")[:150],
            }
            for m, _ in scored[:limit]
        ]

    async def _analyze_topic_growth(
        self,
        memories: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Analyze which topics grew during the period."""
        # Extract all tags
        tag_counts = {}
        for m in memories:
            tags = m.get("payload", {}).get("tags", [])
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        # Sort by count
        sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "top_topics": sorted_tags[:10],
            "total_unique_topics": len(tag_counts),
            "emerging": [t for t, c in sorted_tags if c >= 2][:5],  # Topics with multiple mentions
        }

    async def _find_week_connections(
        self,
        memories: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Find interesting connections made during the week."""
        from app.core.intelligence.connections import connections_service
        
        connections = []
        
        # Sample some memories to find connections
        for m in memories[:10]:
            mem_id = m.get("id")
            if mem_id:
                try:
                    connected = await connections_service.get_connected_memories(
                        UUID(mem_id) if isinstance(mem_id, str) else mem_id,
                        limit=2,
                    )
                    for conn in connected:
                        connections.append({
                            "from_memory": m.get("payload", {}).get("title"),
                            "to_memory": conn.get("memory", {}).get("payload", {}).get("title"),
                            "strength": conn.get("connection_strength", 1),
                        })
                except:
                    continue
        
        return connections[:5]

    async def _generate_daily_suggestions(
        self,
        memories: List[Dict[str, Any]],
        insights: List,
    ) -> List[str]:
        """Generate suggestions for tomorrow."""
        if not self._use_gemini:
            return [
                "Review and expand on today's key ideas",
                "Connect new memories to existing knowledge",
                "Add more context to recent action items",
            ]
        
        try:
            # Extract recent activity
            recent_types = [m.get("payload", {}).get("memory_type") for m in memories[:10]]
            
            prompt = f"""Based on today's activity ({len(memories)} memories, types: {recent_types}), 
suggest 3 brief, actionable items for tomorrow.

Return a JSON array: ["suggestion1", "suggestion2", "suggestion3"]"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=150,
                ),
            )
            
            return json.loads(
                response.text.strip().replace("```json", "").replace("```", "")
            )
            
        except Exception as e:
            logger.error(f"Failed to generate suggestions: {e}")
            return ["Continue building your knowledge base"]

    async def _generate_weekly_goals(
        self,
        memories: List[Dict[str, Any]],
        insights: List,
    ) -> List[Dict[str, Any]]:
        """Generate focus goals for next week."""
        if not self._use_gemini:
            return [
                {"goal": "Deepen one key topic", "priority": "high"},
                {"goal": "Review and organize memories", "priority": "medium"},
            ]
        
        try:
            # Get gaps and trends from insights
            gaps = [i for i in insights if hasattr(i, 'insight_type') and i.insight_type == "gap"]
            
            prompt = f"""Based on {len(memories)} memories this week and these knowledge gaps: {[g.title for g in gaps[:3]]},
suggest 3 focus areas for next week.

Return a JSON array:
[
    {{"goal": "Goal description", "priority": "high|medium|low", "rationale": "Why this matters"}}
]"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=250,
                ),
            )
            
            return json.loads(
                response.text.strip().replace("```json", "").replace("```", "")
            )
            
        except Exception as e:
            logger.error(f"Failed to generate goals: {e}")
            return [{"goal": "Continue learning and growing", "priority": "high"}]

    async def _generate_digest_summary(
        self,
        memories: List[Dict[str, Any]],
        insights: List,
        digest_type: str,
    ) -> str:
        """Generate an engaging summary for the digest."""
        period = "today" if digest_type == DigestType.DAILY else "this week"
        
        if not self._use_gemini or not memories:
            return f"You added {len(memories)} memories {period}. Keep building your second brain!"
        
        try:
            # Get types and titles
            types_count = {}
            titles = []
            for m in memories[:20]:
                payload = m.get("payload", {})
                mtype = payload.get("memory_type", "note")
                types_count[mtype] = types_count.get(mtype, 0) + 1
                if payload.get("title"):
                    titles.append(payload["title"])
            
            prompt = f"""Write a brief, engaging 2-3 sentence summary for a {digest_type} memory digest.

Stats:
- Total memories: {len(memories)}
- Types: {json.dumps(types_count)}
- Sample titles: {titles[:5]}
- Insights found: {len(insights)}

Make it personal, encouraging, and highlight any interesting patterns or achievements."""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.8,
                    max_output_tokens=150,
                ),
            )
            
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Failed to generate summary: {e}")
            return f"You added {len(memories)} memories {period}. Great progress on building your knowledge base!"

    def get_cached_digest(self, cache_key: str) -> Optional[Digest]:
        """Get a cached digest."""
        return self._cached_digests.get(cache_key)

    def list_digests(
        self,
        digest_type: Optional[str] = None,
        limit: int = 10,
    ) -> List[Digest]:
        """List cached digests."""
        digests = list(self._cached_digests.values())
        
        if digest_type:
            digests = [d for d in digests if d.digest_type == digest_type]
        
        digests.sort(key=lambda x: x.created_at, reverse=True)
        return digests[:limit]


# Global service instance
digest_service = DigestService()
