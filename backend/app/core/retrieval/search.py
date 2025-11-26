"""Search and retrieval service for Memora."""

import logging
import math
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.config import settings
from app.core.embedding import embedding_service
from app.db.qdrant import qdrant_service
from app.models.memory import Memory, MemoryMetadata, MemoryModality, MemoryType
from app.models.search import (
    SearchMode,
    SearchQuery,
    SearchResponse,
    SearchResult,
    TemporalFilter,
)

logger = logging.getLogger(__name__)


class SearchService:
    """Service for hybrid search and retrieval."""

    def __init__(self):
        """Initialize search service."""
        self._reranker = None
        self._use_reranker = True

    async def initialize(self) -> None:
        """Initialize search components."""
        try:
            await self._init_reranker()
        except Exception as e:
            logger.warning(f"Reranker not available: {e}")
            self._use_reranker = False

    async def _init_reranker(self) -> None:
        """Initialize cross-encoder reranker."""
        try:
            from sentence_transformers import CrossEncoder
            
            self._reranker = CrossEncoder(
                "cross-encoder/ms-marco-MiniLM-L-6-v2",
                max_length=512,
            )
            logger.info("Reranker model loaded")
        except Exception as e:
            logger.warning(f"Could not load reranker: {e}")
            self._reranker = None

    def _get_temporal_dates(
        self, 
        temporal_filter: TemporalFilter,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> tuple[Optional[datetime], Optional[datetime]]:
        """Convert temporal filter to date range."""
        now = datetime.utcnow()
        
        if temporal_filter == TemporalFilter.TODAY:
            return now.replace(hour=0, minute=0, second=0, microsecond=0), now
        elif temporal_filter == TemporalFilter.WEEK:
            return now - timedelta(days=7), now
        elif temporal_filter == TemporalFilter.MONTH:
            return now - timedelta(days=30), now
        elif temporal_filter == TemporalFilter.QUARTER:
            return now - timedelta(days=90), now
        elif temporal_filter == TemporalFilter.YEAR:
            return now - timedelta(days=365), now
        elif temporal_filter == TemporalFilter.CUSTOM:
            return date_from, date_to
        else:
            return None, None

    async def search(self, query: SearchQuery) -> SearchResponse:
        """
        Perform hybrid search with optional reranking.
        
        Args:
            query: Search query with filters and options
            
        Returns:
            SearchResponse with ranked results
        """
        start_time = datetime.now()
        
        # Generate query embeddings
        dense_vector = await embedding_service.embed_query(query.query)
        sparse_vector = None
        
        if query.mode in [SearchMode.HYBRID, SearchMode.SPARSE]:
            sparse_vector = embedding_service.generate_sparse_vector(query.query)
        
        # Get temporal date range
        date_from, date_to = self._get_temporal_dates(
            query.temporal_filter,
            query.date_from,
            query.date_to,
        )
        
        # Build filters - convert enums to strings
        memory_types_str = [m.value for m in query.memory_types] if query.memory_types else None
        modalities_str = [m.value for m in query.modalities] if query.modalities else None
        
        filters = qdrant_service.build_filter(
            memory_types=memory_types_str,
            modalities=modalities_str,
            authors=query.authors,
            projects=query.projects,
            tags=query.tags,
            date_from=date_from,
            date_to=date_to,
        )
        
        # Retrieve candidates (get more for reranking)
        candidates_limit = query.rerank_top_k if self._use_reranker and query.rerank else query.limit
        
        # Select search mode
        if query.mode == SearchMode.SPARSE:
            dense_vector_for_search = None
        else:
            dense_vector_for_search = dense_vector
            
        if query.mode == SearchMode.DENSE:
            sparse_vector = None
        
        raw_results = await qdrant_service.hybrid_search(
            dense_vector=dense_vector_for_search or dense_vector,
            sparse_vector=sparse_vector,
            limit=candidates_limit,
            offset=query.offset,
            filters=filters,
        )
        
        if not raw_results:
            elapsed = self._elapsed_ms(start_time)
            return SearchResponse(
                success=True,
                query=query.query,
                mode=query.mode,
                results=[],
                total=0,
                took_ms=elapsed,
            )
        
        # Apply temporal decay boost if configured
        if query.temporal_boost:
            raw_results = self._apply_temporal_decay(raw_results, query.temporal_decay)
        
        # Rerank if enabled
        if self._use_reranker and query.rerank and self._reranker:
            raw_results = await self._rerank(query.query, raw_results, query.limit)
        else:
            raw_results = raw_results[:query.limit]
        
        # Convert to response format
        results = []
        for r in raw_results:
            payload = r["payload"]
            
            # Build Memory object from payload
            memory = Memory(
                id=UUID(r["id"]) if isinstance(r["id"], str) else r["id"],
                content=payload.get("content", ""),
                title=payload.get("title"),
                memory_type=MemoryType(payload.get("memory_type", "note")),
                modality=MemoryModality(payload.get("modality", "text")),
                metadata=MemoryMetadata(
                    author=payload.get("author"),
                    project=payload.get("project"),
                    tags=payload.get("tags", []),
                    source_file=payload.get("source_file"),
                    source_url=payload.get("source_url"),
                    page_number=payload.get("page_number"),
                    section=payload.get("section"),
                    custom=payload.get("custom_metadata", {}),
                ),
                created_at=self._parse_datetime(payload.get("created_at")),
                updated_at=self._parse_datetime(payload.get("updated_at")),
                version=payload.get("version", 1),
            )
            
            # Generate highlights
            highlights = self._generate_highlights(query.query, payload.get("content", ""))
            
            results.append(SearchResult(
                memory=memory,
                score=r["score"],
                dense_score=r.get("dense_score"),
                sparse_score=r.get("sparse_score"),
                highlights=highlights,
            ))
        
        elapsed = self._elapsed_ms(start_time)
        
        return SearchResponse(
            success=True,
            query=query.query,
            mode=query.mode,
            results=results,
            total=len(results),
            took_ms=elapsed,
        )

    def _parse_datetime(self, value: Any) -> datetime:
        """Parse datetime from various formats."""
        if value is None:
            return datetime.utcnow()
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                return datetime.utcnow()
        return datetime.utcnow()

    def _apply_temporal_decay(
        self, 
        results: List[Dict[str, Any]], 
        decay_factor: float = 0.1,
    ) -> List[Dict[str, Any]]:
        """Apply temporal decay boosting to search results."""
        now = datetime.utcnow()
        
        for result in results:
            created_at = result["payload"].get("created_at")
            if created_at:
                if isinstance(created_at, str):
                    try:
                        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    except ValueError:
                        continue
                
                # Calculate age in days
                age_days = (now - created_at.replace(tzinfo=None)).days
                
                # Apply exponential decay
                decay = math.exp(-age_days * decay_factor / 30)  # Normalize by month
                result["score"] = result["score"] * (0.5 + 0.5 * decay)
        
        # Re-sort by adjusted score
        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    async def _rerank(
        self, 
        query: str, 
        results: List[Dict[str, Any]], 
        top_k: int
    ) -> List[Dict[str, Any]]:
        """Rerank results using cross-encoder."""
        if not self._reranker or not results:
            return results[:top_k]
        
        try:
            # Prepare pairs for reranking
            pairs = [
                (query, r["payload"].get("content", "")[:512])
                for r in results
            ]
            
            # Get reranker scores
            scores = self._reranker.predict(pairs)
            
            # Combine with original scores (weighted average)
            for i, result in enumerate(results):
                original_score = result["score"]
                rerank_score = float(scores[i])
                # Normalize rerank score to 0-1 range
                normalized_rerank = (rerank_score + 10) / 20
                result["score"] = 0.3 * original_score + 0.7 * max(0, min(1, normalized_rerank))
            
            # Sort by new scores
            results.sort(key=lambda x: x["score"], reverse=True)
            
            return results[:top_k]
            
        except Exception as e:
            logger.error(f"Reranking failed: {e}")
            return results[:top_k]

    def _generate_highlights(self, query: str, content: str, max_length: int = 200) -> List[str]:
        """Generate highlighted snippets from content."""
        if not content:
            return []
        
        query_terms = set(query.lower().split())
        sentences = content.replace('\n', ' ').split('. ')
        
        # Score sentences by query term overlap
        scored = []
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            words = set(sentence.lower().split())
            overlap = len(query_terms & words)
            if overlap > 0:
                scored.append((overlap, sentence[:max_length]))
        
        # Return top highlights
        scored.sort(reverse=True)
        return [s[1] for s in scored[:3]]

    def _elapsed_ms(self, start: datetime) -> float:
        """Calculate elapsed time in milliseconds."""
        return (datetime.now() - start).total_seconds() * 1000

    async def find_similar(
        self,
        memory_id: UUID,
        limit: int = 10,
    ) -> SearchResponse:
        """Find memories similar to a given memory."""
        start_time = datetime.now()
        
        # Get the memory
        memory = await qdrant_service.get_memory(memory_id)
        if not memory:
            return SearchResponse(
                success=False,
                query="",
                mode=SearchMode.DENSE,
                results=[],
                total=0,
                took_ms=self._elapsed_ms(start_time),
                message="Memory not found",
            )
        
        # Use its content to search
        content = memory["payload"].get("content", "")
        if not content:
            return SearchResponse(
                success=False,
                query="",
                mode=SearchMode.DENSE,
                results=[],
                total=0,
                took_ms=self._elapsed_ms(start_time),
                message="Memory has no content",
            )
        
        query = SearchQuery(query=content, limit=limit + 1, rerank=False)
        response = await self.search(query)
        
        # Filter out the original memory
        response.results = [
            r for r in response.results
            if str(r.memory.id) != str(memory_id)
        ][:limit]
        response.total = len(response.results)
        
        return response


# Global service instance
search_service = SearchService()
