"""Memory Evolution Tracker - Track how knowledge evolves over time."""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID, uuid4
from enum import Enum
import difflib

from google import genai
from google.genai import types

from app.config import settings
from app.db.qdrant import qdrant_service
from app.core.embedding import embedding_service

logger = logging.getLogger(__name__)


class EvolutionType(Enum):
    """Types of memory evolution."""
    CREATION = "creation"  # Initial creation
    UPDATE = "update"  # Content updated
    REFINEMENT = "refinement"  # Improved/clarified
    EXPANSION = "expansion"  # Added more detail
    CONTRADICTION = "contradiction"  # Changed position/view
    SYNTHESIS = "synthesis"  # Merged multiple memories
    BRANCHING = "branching"  # Split into multiple ideas
    OBSOLETE = "obsolete"  # Marked as outdated


class MemoryVersion:
    """Represents a version of a memory."""
    
    def __init__(
        self,
        memory_id: UUID,
        version: int,
        content: str,
        title: Optional[str] = None,
        evolution_type: EvolutionType = EvolutionType.CREATION,
        change_summary: Optional[str] = None,
        parent_version: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.id = uuid4()
        self.memory_id = memory_id
        self.version = version
        self.content = content
        self.title = title
        self.evolution_type = evolution_type
        self.change_summary = change_summary
        self.parent_version = parent_version
        self.metadata = metadata or {}
        self.created_at = datetime.utcnow()
        self.embedding: Optional[List[float]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "memory_id": str(self.memory_id),
            "version": self.version,
            "title": self.title,
            "content_preview": self.content[:200],
            "evolution_type": self.evolution_type.value,
            "change_summary": self.change_summary,
            "parent_version": self.parent_version,
            "created_at": self.created_at.isoformat(),
        }


class EvolutionTimeline:
    """Timeline of a memory's evolution."""
    
    def __init__(self, memory_id: UUID):
        self.memory_id = memory_id
        self.versions: List[MemoryVersion] = []
        self.branches: List[UUID] = []  # Related memories that branched from this
        self.merges: List[UUID] = []  # Memories that merged into this

    def add_version(self, version: MemoryVersion):
        self.versions.append(version)
        self.versions.sort(key=lambda v: v.version)

    def get_latest(self) -> Optional[MemoryVersion]:
        return self.versions[-1] if self.versions else None

    def get_version(self, version_num: int) -> Optional[MemoryVersion]:
        for v in self.versions:
            if v.version == version_num:
                return v
        return None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "memory_id": str(self.memory_id),
            "total_versions": len(self.versions),
            "versions": [v.to_dict() for v in self.versions],
            "branches": [str(b) for b in self.branches],
            "merges": [str(m) for m in self.merges],
            "first_created": self.versions[0].created_at.isoformat() if self.versions else None,
            "last_updated": self.versions[-1].created_at.isoformat() if self.versions else None,
        }


class EvolutionService:
    """Service for tracking memory evolution over time."""

    def __init__(self):
        self._gemini_client: Optional[genai.Client] = None
        self._use_gemini = bool(settings.gemini_api_key)
        self._timelines: Dict[UUID, EvolutionTimeline] = {}
        self._evolution_insights: List[Dict[str, Any]] = []

    @property
    def gemini_client(self) -> genai.Client:
        """Get or create Gemini client."""
        if self._gemini_client is None:
            if not settings.gemini_api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            self._gemini_client = genai.Client(api_key=settings.gemini_api_key)
        return self._gemini_client

    async def track_creation(
        self,
        memory_id: UUID,
        content: str,
        title: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> MemoryVersion:
        """Track the creation of a new memory."""
        timeline = EvolutionTimeline(memory_id)
        
        version = MemoryVersion(
            memory_id=memory_id,
            version=1,
            content=content,
            title=title,
            evolution_type=EvolutionType.CREATION,
            change_summary="Initial creation",
            metadata=metadata,
        )
        
        # Generate embedding for evolution tracking
        version.embedding = await embedding_service.embed_text(content)
        
        timeline.add_version(version)
        self._timelines[memory_id] = timeline
        
        return version

    async def track_update(
        self,
        memory_id: UUID,
        new_content: str,
        new_title: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> MemoryVersion:
        """Track an update to an existing memory."""
        timeline = self._timelines.get(memory_id)
        
        if not timeline:
            # Create initial version from current memory
            memory = await qdrant_service.get_memory(memory_id)
            if memory:
                payload = memory.get("payload", {})
                await self.track_creation(
                    memory_id=memory_id,
                    content=payload.get("content", ""),
                    title=payload.get("title"),
                )
                timeline = self._timelines[memory_id]
            else:
                timeline = EvolutionTimeline(memory_id)
                self._timelines[memory_id] = timeline
        
        latest = timeline.get_latest()
        new_version_num = (latest.version + 1) if latest else 1
        
        # Determine evolution type and generate summary
        evolution_type, change_summary = await self._analyze_evolution(
            old_content=latest.content if latest else "",
            new_content=new_content,
            old_title=latest.title if latest else None,
            new_title=new_title,
        )
        
        version = MemoryVersion(
            memory_id=memory_id,
            version=new_version_num,
            content=new_content,
            title=new_title,
            evolution_type=evolution_type,
            change_summary=change_summary,
            parent_version=latest.version if latest else None,
            metadata=metadata,
        )
        
        # Generate embedding
        version.embedding = await embedding_service.embed_text(new_content)
        
        timeline.add_version(version)
        
        # Check for significant evolution and record insight
        if evolution_type in [EvolutionType.CONTRADICTION, EvolutionType.SYNTHESIS]:
            self._evolution_insights.append({
                "memory_id": str(memory_id),
                "evolution_type": evolution_type.value,
                "summary": change_summary,
                "timestamp": datetime.utcnow().isoformat(),
            })
        
        return version

    async def track_branch(
        self,
        original_memory_id: UUID,
        new_memory_id: UUID,
    ) -> Dict[str, Any]:
        """Track when a new memory branches from an existing one."""
        original_timeline = self._timelines.get(original_memory_id)
        
        if original_timeline:
            original_timeline.branches.append(new_memory_id)
        
        return {
            "original_memory_id": str(original_memory_id),
            "new_memory_id": str(new_memory_id),
            "relationship": "branch",
        }

    async def track_merge(
        self,
        source_memory_ids: List[UUID],
        result_memory_id: UUID,
    ) -> Dict[str, Any]:
        """Track when multiple memories are merged into one."""
        result_timeline = self._timelines.get(result_memory_id)
        
        if result_timeline:
            result_timeline.merges.extend(source_memory_ids)
        
        return {
            "source_memory_ids": [str(sid) for sid in source_memory_ids],
            "result_memory_id": str(result_memory_id),
            "relationship": "merge",
        }

    async def get_timeline(self, memory_id: UUID) -> Optional[Dict[str, Any]]:
        """Get the evolution timeline for a memory."""
        timeline = self._timelines.get(memory_id)
        if timeline:
            return timeline.to_dict()
        
        # Try to build from memory versions
        memory = await qdrant_service.get_memory(memory_id)
        if memory:
            payload = memory.get("payload", {})
            await self.track_creation(
                memory_id=memory_id,
                content=payload.get("content", ""),
                title=payload.get("title"),
            )
            return self._timelines[memory_id].to_dict()
        
        return None

    async def compare_versions(
        self,
        memory_id: UUID,
        version1: int,
        version2: int,
    ) -> Dict[str, Any]:
        """Compare two versions of a memory."""
        timeline = self._timelines.get(memory_id)
        if not timeline:
            return {"error": "Timeline not found"}
        
        v1 = timeline.get_version(version1)
        v2 = timeline.get_version(version2)
        
        if not v1 or not v2:
            return {"error": "Version not found"}
        
        # Calculate diff
        diff = list(difflib.unified_diff(
            v1.content.splitlines(),
            v2.content.splitlines(),
            lineterm="",
            fromfile=f"Version {version1}",
            tofile=f"Version {version2}",
        ))
        
        # Calculate semantic similarity
        similarity = 0.0
        if v1.embedding and v2.embedding:
            similarity = embedding_service.compute_similarity(v1.embedding, v2.embedding)
        
        return {
            "memory_id": str(memory_id),
            "version1": v1.to_dict(),
            "version2": v2.to_dict(),
            "diff": diff,
            "semantic_similarity": similarity,
            "days_between": (v2.created_at - v1.created_at).days,
        }

    async def get_evolution_summary(
        self,
        memory_id: UUID,
    ) -> Dict[str, Any]:
        """Get a summary of how a memory has evolved."""
        timeline = self._timelines.get(memory_id)
        if not timeline or not timeline.versions:
            return {"error": "No evolution history found"}
        
        first = timeline.versions[0]
        latest = timeline.versions[-1]
        
        evolution_types = [v.evolution_type.value for v in timeline.versions]
        
        # Calculate overall semantic drift
        drift = 0.0
        if first.embedding and latest.embedding:
            drift = 1 - embedding_service.compute_similarity(first.embedding, latest.embedding)
        
        return {
            "memory_id": str(memory_id),
            "total_versions": len(timeline.versions),
            "first_created": first.created_at.isoformat(),
            "last_updated": latest.created_at.isoformat(),
            "total_days": (latest.created_at - first.created_at).days,
            "evolution_types": list(set(evolution_types)),
            "semantic_drift": drift,
            "title_changes": sum(1 for v in timeline.versions if v.title != first.title),
            "branches": len(timeline.branches),
            "merges": len(timeline.merges),
        }

    async def find_evolved_memories(
        self,
        days: int = 30,
        min_versions: int = 2,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """Find memories that have evolved significantly."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        evolved = []
        
        for memory_id, timeline in self._timelines.items():
            if len(timeline.versions) < min_versions:
                continue
            
            latest = timeline.get_latest()
            if latest and latest.created_at >= cutoff:
                summary = await self.get_evolution_summary(memory_id)
                evolved.append(summary)
        
        # Sort by semantic drift
        evolved.sort(key=lambda x: x.get("semantic_drift", 0), reverse=True)
        
        return evolved[:limit]

    async def analyze_thinking_evolution(
        self,
        topic: str,
        days: int = 90,
    ) -> Dict[str, Any]:
        """Analyze how thinking about a topic has evolved over time."""
        # Search for memories about the topic
        from app.core.retrieval import search_service
        from app.models.search import SearchQuery
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        query = SearchQuery(
            query=topic,
            limit=50,
            date_from=cutoff,
        )
        results = await search_service.search(query)
        
        if not results.results:
            return {
                "topic": topic,
                "memories_found": 0,
                "evolution": "No memories found about this topic",
            }
        
        # Group by time periods
        early = []
        middle = []
        recent = []
        period_length = days // 3
        
        for result in results.results:
            age_days = (datetime.utcnow() - result.memory.created_at).days
            if age_days > period_length * 2:
                early.append(result)
            elif age_days > period_length:
                middle.append(result)
            else:
                recent.append(result)
        
        # Use AI to analyze evolution
        if self._use_gemini and len(results.results) >= 3:
            analysis = await self._ai_analyze_thinking_evolution(
                topic, early, middle, recent
            )
        else:
            analysis = self._simple_evolution_analysis(early, middle, recent)
        
        return {
            "topic": topic,
            "period_days": days,
            "memories_found": len(results.results),
            "distribution": {
                "early": len(early),
                "middle": len(middle),
                "recent": len(recent),
            },
            "analysis": analysis,
        }

    async def _analyze_evolution(
        self,
        old_content: str,
        new_content: str,
        old_title: Optional[str],
        new_title: Optional[str],
    ) -> Tuple[EvolutionType, str]:
        """Analyze the type of evolution between versions."""
        if not old_content:
            return EvolutionType.CREATION, "Initial creation"
        
        # Calculate basic metrics
        old_len = len(old_content)
        new_len = len(new_content)
        size_change = (new_len - old_len) / max(old_len, 1)
        
        # Use difflib for similarity
        similarity = difflib.SequenceMatcher(None, old_content, new_content).ratio()
        
        # Simple heuristics
        if size_change > 0.5:
            evolution_type = EvolutionType.EXPANSION
            summary = "Significantly expanded with new content"
        elif size_change < -0.3:
            evolution_type = EvolutionType.REFINEMENT
            summary = "Condensed and refined"
        elif similarity > 0.9:
            evolution_type = EvolutionType.REFINEMENT
            summary = "Minor refinements"
        elif similarity < 0.5:
            evolution_type = EvolutionType.UPDATE
            summary = "Major content changes"
        else:
            evolution_type = EvolutionType.UPDATE
            summary = "Updated content"
        
        # Use AI for more nuanced analysis if available
        if self._use_gemini and len(old_content) > 50 and len(new_content) > 50:
            try:
                ai_analysis = await self._ai_analyze_change(old_content, new_content)
                if ai_analysis:
                    evolution_type = ai_analysis.get("type", evolution_type)
                    summary = ai_analysis.get("summary", summary)
            except:
                pass
        
        return evolution_type, summary

    async def _ai_analyze_change(
        self,
        old_content: str,
        new_content: str,
    ) -> Optional[Dict[str, Any]]:
        """Use AI to analyze the nature of a change."""
        try:
            prompt = f"""Analyze the evolution between these two versions of a memory:

OLD VERSION:
{old_content[:500]}

NEW VERSION:
{new_content[:500]}

Classify the change type (one of: refinement, expansion, contradiction, synthesis, update) and provide a brief summary.

Return JSON:
{{"type": "evolution_type", "summary": "Brief description of the change"}}"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=100,
                ),
            )
            
            import json
            result = json.loads(
                response.text.strip().replace("```json", "").replace("```", "")
            )
            
            # Map to enum
            type_map = {
                "refinement": EvolutionType.REFINEMENT,
                "expansion": EvolutionType.EXPANSION,
                "contradiction": EvolutionType.CONTRADICTION,
                "synthesis": EvolutionType.SYNTHESIS,
                "update": EvolutionType.UPDATE,
            }
            
            return {
                "type": type_map.get(result.get("type", "update"), EvolutionType.UPDATE),
                "summary": result.get("summary", "Content updated"),
            }
            
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            return None

    async def _ai_analyze_thinking_evolution(
        self,
        topic: str,
        early: List,
        middle: List,
        recent: List,
    ) -> Dict[str, Any]:
        """Use AI to analyze thinking evolution about a topic."""
        try:
            early_content = [r.memory.content[:200] for r in early[:3]]
            middle_content = [r.memory.content[:200] for r in middle[:3]]
            recent_content = [r.memory.content[:200] for r in recent[:3]]
            
            prompt = f"""Analyze how thinking about "{topic}" has evolved over time:

EARLY THOUGHTS:
{early_content}

MIDDLE PERIOD:
{middle_content}

RECENT THOUGHTS:
{recent_content}

Describe:
1. How has the understanding evolved?
2. Any major shifts in perspective?
3. What patterns emerge?

Return JSON:
{{
    "evolution_summary": "Brief description",
    "key_shifts": ["shift1", "shift2"],
    "patterns": ["pattern1", "pattern2"],
    "current_stance": "Current understanding"
}}"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=300,
                ),
            )
            
            import json
            return json.loads(
                response.text.strip().replace("```json", "").replace("```", "")
            )
            
        except Exception as e:
            logger.error(f"Thinking evolution analysis failed: {e}")
            return self._simple_evolution_analysis(early, middle, recent)

    def _simple_evolution_analysis(
        self,
        early: List,
        middle: List,
        recent: List,
    ) -> Dict[str, Any]:
        """Simple evolution analysis fallback."""
        return {
            "evolution_summary": f"Thinking has evolved across {len(early) + len(middle) + len(recent)} memories",
            "key_shifts": ["Enable AI for detailed analysis"],
            "patterns": [],
            "current_stance": "See recent memories for current understanding",
        }

    def get_evolution_insights(
        self,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Get recent evolution insights."""
        return self._evolution_insights[-limit:][::-1]


# Global service instance
evolution_service = EvolutionService()
