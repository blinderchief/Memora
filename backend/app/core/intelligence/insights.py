"""AI Insights Engine - Auto-generates patterns, learning summaries, and actionable insights."""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
import json

from google import genai
from google.genai import types

from app.config import settings
from app.db.qdrant import qdrant_service

logger = logging.getLogger(__name__)


class InsightType:
    """Types of insights that can be generated."""
    PATTERN = "pattern"  # Recurring themes or behaviors
    GROWTH = "growth"  # Learning progress and skill development
    CONNECTION = "connection"  # Unexpected links between memories
    GAP = "gap"  # Knowledge gaps or missing areas
    TREND = "trend"  # Emerging topics or interests
    ACTION = "action"  # Suggested actions based on memory analysis
    SUMMARY = "summary"  # Periodic summaries (daily/weekly/monthly)


class Insight:
    """Represents an AI-generated insight."""
    
    def __init__(
        self,
        insight_type: str,
        title: str,
        description: str,
        confidence: float,
        memory_ids: List[UUID],
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.id = uuid4()
        self.insight_type = insight_type
        self.title = title
        self.description = description
        self.confidence = confidence
        self.memory_ids = memory_ids
        self.metadata = metadata or {}
        self.created_at = datetime.utcnow()
        self.is_read = False
        self.is_actionable = insight_type in [InsightType.ACTION, InsightType.GAP]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "insight_type": self.insight_type,
            "title": self.title,
            "description": self.description,
            "confidence": self.confidence,
            "memory_ids": [str(mid) for mid in self.memory_ids],
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "is_read": self.is_read,
            "is_actionable": self.is_actionable,
        }


class InsightsService:
    """Service for generating AI-powered insights from memories."""

    def __init__(self):
        self._gemini_client: Optional[genai.Client] = None
        self._use_gemini = bool(settings.gemini_api_key)
        self._insights_cache: Dict[str, List[Insight]] = {}

    @property
    def gemini_client(self) -> genai.Client:
        """Get or create Gemini client."""
        if self._gemini_client is None:
            if not settings.gemini_api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            self._gemini_client = genai.Client(api_key=settings.gemini_api_key)
        return self._gemini_client

    async def generate_daily_insights(
        self, 
        user_id: Optional[str] = None,
        limit: int = 5,
    ) -> List[Insight]:
        """
        Generate daily insights based on recent memories.
        
        Analyzes memories from the last 24 hours and generates:
        - Activity summary
        - Key themes
        - Suggested connections
        - Action items
        """
        # Get recent memories
        date_from = datetime.utcnow() - timedelta(days=1)
        recent_memories = await self._get_memories_in_range(date_from)
        
        if len(recent_memories) < 2:
            return []

        insights = []
        
        # Generate activity summary
        summary_insight = await self._generate_summary_insight(recent_memories, "daily")
        if summary_insight:
            insights.append(summary_insight)
        
        # Find patterns
        pattern_insights = await self._find_patterns(recent_memories)
        insights.extend(pattern_insights[:2])
        
        # Suggest connections
        connection_insights = await self._suggest_connections(recent_memories)
        insights.extend(connection_insights[:2])
        
        return insights[:limit]

    async def generate_weekly_insights(
        self,
        user_id: Optional[str] = None,
        limit: int = 10,
    ) -> List[Insight]:
        """
        Generate comprehensive weekly insights.
        
        Includes:
        - Week summary with key achievements
        - Growth tracking (skills developed)
        - Knowledge gap identification
        - Trend analysis
        - Personalized recommendations
        """
        date_from = datetime.utcnow() - timedelta(days=7)
        week_memories = await self._get_memories_in_range(date_from)
        
        if len(week_memories) < 5:
            return []

        insights = []
        
        # Weekly summary
        summary = await self._generate_summary_insight(week_memories, "weekly")
        if summary:
            insights.append(summary)
        
        # Growth insights
        growth = await self._analyze_growth(week_memories)
        if growth:
            insights.append(growth)
        
        # Knowledge gaps
        gaps = await self._identify_knowledge_gaps(week_memories)
        insights.extend(gaps[:2])
        
        # Trends
        trends = await self._analyze_trends(week_memories)
        insights.extend(trends[:2])
        
        # Action recommendations
        actions = await self._generate_action_insights(week_memories)
        insights.extend(actions[:3])
        
        return insights[:limit]

    async def get_memory_insights(
        self,
        memory_id: UUID,
    ) -> List[Insight]:
        """
        Get insights specific to a single memory.
        
        - Related memories
        - Context and connections
        - Suggested follow-ups
        """
        memory = await qdrant_service.get_memory(memory_id)
        if not memory:
            return []
        
        content = memory["payload"].get("content", "")
        
        insights = []
        
        # Find related memories
        from app.core.retrieval import search_service
        from app.models.search import SearchQuery
        
        query = SearchQuery(query=content[:500], limit=10, rerank=True)
        similar = await search_service.search(query)
        
        if similar.results and len(similar.results) > 1:
            # Generate connection insight
            related_ids = [r.memory.id for r in similar.results[1:6]]
            connection = Insight(
                insight_type=InsightType.CONNECTION,
                title="Related Knowledge",
                description=f"This memory connects to {len(related_ids)} related pieces of knowledge in your memory bank.",
                confidence=0.8,
                memory_ids=related_ids,
                metadata={
                    "source_memory": str(memory_id),
                    "similarity_scores": [r.score for r in similar.results[1:6]],
                },
            )
            insights.append(connection)
        
        # Generate follow-up suggestions using AI
        followup = await self._generate_followup_suggestions(memory["payload"])
        if followup:
            insights.append(followup)
        
        return insights

    async def analyze_learning_progress(
        self,
        topic: str,
        days: int = 30,
    ) -> Dict[str, Any]:
        """
        Analyze learning progress on a specific topic.
        
        Returns:
        - Number of memories related to topic
        - Knowledge depth score
        - Progress over time
        - Suggested next steps
        """
        date_from = datetime.utcnow() - timedelta(days=days)
        
        # Search for topic-related memories
        from app.core.retrieval import search_service
        from app.models.search import SearchQuery
        
        query = SearchQuery(
            query=topic,
            limit=100,
            date_from=date_from,
        )
        results = await search_service.search(query)
        
        if not results.results:
            return {
                "topic": topic,
                "memory_count": 0,
                "depth_score": 0,
                "progress": [],
                "suggestions": ["Start learning about this topic by adding your first memory!"],
            }
        
        # Calculate depth score based on variety and recency
        depth_score = min(100, len(results.results) * 10)
        
        # Group by week for progress tracking
        progress = {}
        for result in results.results:
            week = result.memory.created_at.strftime("%Y-W%W")
            progress[week] = progress.get(week, 0) + 1
        
        # Generate suggestions using AI
        suggestions = await self._generate_learning_suggestions(topic, results.results)
        
        return {
            "topic": topic,
            "memory_count": len(results.results),
            "depth_score": depth_score,
            "progress": [{"week": k, "count": v} for k, v in sorted(progress.items())],
            "suggestions": suggestions,
        }

    async def _get_memories_in_range(
        self,
        date_from: datetime,
        date_to: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        """Get memories within a date range."""
        filters = qdrant_service.build_filter(
            date_from=date_from,
            date_to=date_to or datetime.utcnow(),
        )
        
        return await qdrant_service.list_memories(
            limit=100,
            offset=0,
            filters=filters,
        )

    async def _generate_summary_insight(
        self,
        memories: List[Dict[str, Any]],
        period: str,
    ) -> Optional[Insight]:
        """Generate a summary insight for a time period."""
        if not self._use_gemini or not memories:
            return None
        
        try:
            # Prepare memory summaries
            memory_summaries = []
            for m in memories[:20]:  # Limit to avoid token limits
                payload = m.get("payload", {})
                memory_summaries.append({
                    "title": payload.get("title", "Untitled"),
                    "type": payload.get("memory_type", "note"),
                    "content_preview": payload.get("content", "")[:200],
                })
            
            prompt = f"""Analyze these memories from the past {period} and create a concise, insightful summary.

Memories:
{json.dumps(memory_summaries, indent=2)}

Generate a summary that:
1. Highlights the main themes and focus areas
2. Notes any significant achievements or learnings
3. Identifies patterns in the user's thinking or work

Return a JSON object with:
{{
    "title": "Brief, engaging title for the summary",
    "description": "2-3 sentence summary of key insights",
    "themes": ["theme1", "theme2", "theme3"],
    "highlight": "Most notable insight or achievement"
}}"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=500,
                ),
            )
            
            result = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            
            return Insight(
                insight_type=InsightType.SUMMARY,
                title=result.get("title", f"Your {period.capitalize()} Summary"),
                description=result.get("description", ""),
                confidence=0.9,
                memory_ids=[UUID(m["id"]) for m in memories[:5] if "id" in m],
                metadata={
                    "period": period,
                    "themes": result.get("themes", []),
                    "highlight": result.get("highlight", ""),
                    "memory_count": len(memories),
                },
            )
            
        except Exception as e:
            logger.error(f"Failed to generate summary insight: {e}")
            return None

    async def _find_patterns(
        self,
        memories: List[Dict[str, Any]],
    ) -> List[Insight]:
        """Find recurring patterns in memories."""
        if not self._use_gemini or len(memories) < 3:
            return []
        
        try:
            # Extract key info
            memory_data = []
            for m in memories[:30]:
                payload = m.get("payload", {})
                memory_data.append({
                    "type": payload.get("memory_type"),
                    "tags": payload.get("tags", []),
                    "content": payload.get("content", "")[:300],
                })
            
            prompt = f"""Analyze these memories and identify 2-3 recurring patterns or themes.

Memories:
{json.dumps(memory_data, indent=2)}

Return a JSON array of patterns:
[
    {{
        "title": "Pattern name",
        "description": "Brief description of the pattern",
        "evidence": "What suggests this pattern exists",
        "confidence": 0.8
    }}
]"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=600,
                ),
            )
            
            patterns = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            
            insights = []
            for p in patterns[:3]:
                insights.append(Insight(
                    insight_type=InsightType.PATTERN,
                    title=p.get("title", "Pattern Detected"),
                    description=p.get("description", ""),
                    confidence=p.get("confidence", 0.7),
                    memory_ids=[UUID(m["id"]) for m in memories[:3] if "id" in m],
                    metadata={"evidence": p.get("evidence", "")},
                ))
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to find patterns: {e}")
            return []

    async def _suggest_connections(
        self,
        memories: List[Dict[str, Any]],
    ) -> List[Insight]:
        """Suggest unexpected connections between memories."""
        # Use vector similarity to find potential connections
        if len(memories) < 4:
            return []
        
        insights = []
        
        # Find memories that are semantically similar but from different contexts
        from app.core.embedding import embedding_service
        
        try:
            # Sample a few memories to check for connections
            sample = memories[:10]
            
            for i, m1 in enumerate(sample[:-1]):
                content1 = m1.get("payload", {}).get("content", "")
                if not content1:
                    continue
                    
                vec1 = await embedding_service.embed_text(content1[:500])
                
                for m2 in sample[i+1:]:
                    content2 = m2.get("payload", {}).get("content", "")
                    if not content2:
                        continue
                    
                    # Check if from different types/projects
                    type1 = m1.get("payload", {}).get("memory_type")
                    type2 = m2.get("payload", {}).get("memory_type")
                    
                    if type1 == type2:
                        continue
                    
                    vec2 = await embedding_service.embed_text(content2[:500])
                    similarity = embedding_service.compute_similarity(vec1, vec2)
                    
                    if 0.6 < similarity < 0.85:  # Similar but not identical
                        insights.append(Insight(
                            insight_type=InsightType.CONNECTION,
                            title="Hidden Connection Found",
                            description=f"Your '{m1.get('payload', {}).get('title', 'memory')}' might connect with '{m2.get('payload', {}).get('title', 'another memory')}' - they share underlying themes.",
                            confidence=similarity,
                            memory_ids=[
                                UUID(m1["id"]) if "id" in m1 else uuid4(),
                                UUID(m2["id"]) if "id" in m2 else uuid4(),
                            ],
                            metadata={"similarity": similarity},
                        ))
                        
                        if len(insights) >= 3:
                            return insights
                            
        except Exception as e:
            logger.error(f"Failed to suggest connections: {e}")
        
        return insights

    async def _analyze_growth(
        self,
        memories: List[Dict[str, Any]],
    ) -> Optional[Insight]:
        """Analyze skill/knowledge growth over time."""
        if not self._use_gemini or len(memories) < 5:
            return None
        
        try:
            # Group by type
            type_counts = {}
            for m in memories:
                mtype = m.get("payload", {}).get("memory_type", "note")
                type_counts[mtype] = type_counts.get(mtype, 0) + 1
            
            prompt = f"""Based on this memory activity breakdown, generate a brief growth insight:

Memory types and counts: {json.dumps(type_counts)}
Total memories: {len(memories)}
Time period: Last 7 days

Generate a JSON response:
{{
    "title": "Growth insight title",
    "description": "2 sentences about what this activity suggests about learning/growth",
    "growth_areas": ["area1", "area2"],
    "suggestion": "One actionable suggestion"
}}"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=300,
                ),
            )
            
            result = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            
            return Insight(
                insight_type=InsightType.GROWTH,
                title=result.get("title", "Growth Analysis"),
                description=result.get("description", ""),
                confidence=0.85,
                memory_ids=[UUID(m["id"]) for m in memories[:3] if "id" in m],
                metadata={
                    "type_distribution": type_counts,
                    "growth_areas": result.get("growth_areas", []),
                    "suggestion": result.get("suggestion", ""),
                },
            )
            
        except Exception as e:
            logger.error(f"Failed to analyze growth: {e}")
            return None

    async def _identify_knowledge_gaps(
        self,
        memories: List[Dict[str, Any]],
    ) -> List[Insight]:
        """Identify potential knowledge gaps based on memory patterns."""
        if not self._use_gemini or len(memories) < 5:
            return []
        
        try:
            # Extract topics and questions
            content_samples = [
                m.get("payload", {}).get("content", "")[:200]
                for m in memories[:20]
            ]
            
            prompt = f"""Analyze these memory excerpts and identify 1-2 potential knowledge gaps - areas where the user might benefit from deeper learning or exploration.

Memory samples:
{json.dumps(content_samples, indent=2)}

Return a JSON array:
[
    {{
        "gap_title": "Brief name for the gap",
        "description": "Why this is a gap and how it could be addressed",
        "suggested_resources": ["resource1", "resource2"]
    }}
]"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=400,
                ),
            )
            
            gaps = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            
            insights = []
            for gap in gaps[:2]:
                insights.append(Insight(
                    insight_type=InsightType.GAP,
                    title=f"Knowledge Gap: {gap.get('gap_title', 'Opportunity')}",
                    description=gap.get("description", ""),
                    confidence=0.75,
                    memory_ids=[],
                    metadata={"suggested_resources": gap.get("suggested_resources", [])},
                ))
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to identify gaps: {e}")
            return []

    async def _analyze_trends(
        self,
        memories: List[Dict[str, Any]],
    ) -> List[Insight]:
        """Analyze emerging trends in the user's memories."""
        if not self._use_gemini or len(memories) < 5:
            return []
        
        try:
            # Extract tags and topics
            all_tags = []
            for m in memories:
                tags = m.get("payload", {}).get("tags", [])
                all_tags.extend(tags)
            
            tag_counts = {}
            for tag in all_tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
            
            prompt = f"""Based on these tag frequencies and memory count, identify emerging trends:

Tags: {json.dumps(tag_counts)}
Total memories this week: {len(memories)}

Return a JSON array of 1-2 trends:
[
    {{
        "trend_name": "Name of the trend",
        "description": "What this trend suggests",
        "momentum": "rising" or "steady",
        "significance": 0.8
    }}
]"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=300,
                ),
            )
            
            trends = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            
            insights = []
            for trend in trends[:2]:
                insights.append(Insight(
                    insight_type=InsightType.TREND,
                    title=f"📈 {trend.get('trend_name', 'Emerging Trend')}",
                    description=trend.get("description", ""),
                    confidence=trend.get("significance", 0.7),
                    memory_ids=[],
                    metadata={"momentum": trend.get("momentum", "steady")},
                ))
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to analyze trends: {e}")
            return []

    async def _generate_action_insights(
        self,
        memories: List[Dict[str, Any]],
    ) -> List[Insight]:
        """Generate actionable insights based on memories."""
        if not self._use_gemini:
            return []
        
        try:
            # Look for action items, questions, and incomplete thoughts
            content_samples = []
            for m in memories[:15]:
                payload = m.get("payload", {})
                if payload.get("memory_type") in ["action_item", "question", "idea"]:
                    content_samples.append({
                        "type": payload.get("memory_type"),
                        "content": payload.get("content", "")[:200],
                        "title": payload.get("title"),
                    })
            
            if not content_samples:
                return []
            
            prompt = f"""Based on these action items, questions, and ideas, suggest 2-3 concrete next steps:

Items:
{json.dumps(content_samples, indent=2)}

Return a JSON array:
[
    {{
        "action": "Specific action to take",
        "rationale": "Why this is important",
        "priority": "high" or "medium" or "low"
    }}
]"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=400,
                ),
            )
            
            actions = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            
            insights = []
            for action in actions[:3]:
                priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(
                    action.get("priority", "medium"), "🟡"
                )
                insights.append(Insight(
                    insight_type=InsightType.ACTION,
                    title=f"{priority_emoji} {action.get('action', 'Suggested Action')}",
                    description=action.get("rationale", ""),
                    confidence=0.85,
                    memory_ids=[],
                    metadata={"priority": action.get("priority", "medium")},
                ))
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to generate actions: {e}")
            return []

    async def _generate_followup_suggestions(
        self,
        memory_payload: Dict[str, Any],
    ) -> Optional[Insight]:
        """Generate follow-up suggestions for a specific memory."""
        if not self._use_gemini:
            return None
        
        try:
            prompt = f"""Based on this memory, suggest one meaningful follow-up action or exploration:

Title: {memory_payload.get('title', 'Untitled')}
Type: {memory_payload.get('memory_type', 'note')}
Content: {memory_payload.get('content', '')[:500]}

Return a JSON object:
{{
    "suggestion": "Specific follow-up action",
    "reason": "Why this would be valuable"
}}"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=200,
                ),
            )
            
            result = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            
            return Insight(
                insight_type=InsightType.ACTION,
                title="Suggested Next Step",
                description=f"{result.get('suggestion', '')}\n\n*{result.get('reason', '')}*",
                confidence=0.8,
                memory_ids=[],
                metadata={"source": "followup_suggestion"},
            )
            
        except Exception as e:
            logger.error(f"Failed to generate followup: {e}")
            return None

    async def _generate_learning_suggestions(
        self,
        topic: str,
        memories: List,
    ) -> List[str]:
        """Generate learning suggestions for a topic."""
        if not self._use_gemini:
            return ["Continue adding memories about this topic to track your progress."]
        
        try:
            prompt = f"""Based on {len(memories)} memories about "{topic}", suggest 3 ways to deepen understanding:

Return a JSON array of 3 suggestions:
["suggestion1", "suggestion2", "suggestion3"]"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=200,
                ),
            )
            
            return json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            
        except Exception as e:
            logger.error(f"Failed to generate learning suggestions: {e}")
            return ["Continue exploring this topic through deliberate practice."]


# Global service instance
insights_service = InsightsService()
