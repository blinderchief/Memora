"""Search models for Memora."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.memory import Memory, MemoryModality, MemoryType


class SearchMode(str, Enum):
    """Search mode selection."""
    
    HYBRID = "hybrid"  # Dense + Sparse
    DENSE = "dense"    # Semantic only
    SPARSE = "sparse"  # Keyword only (BM25)


class TemporalFilter(str, Enum):
    """Temporal filtering options."""
    
    ALL = "all"
    TODAY = "today"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    CUSTOM = "custom"


class SearchQuery(BaseModel):
    """Search query parameters."""
    
    query: str = Field(..., min_length=1, description="Search query text")
    mode: SearchMode = Field(default=SearchMode.HYBRID, description="Search mode")
    limit: int = Field(default=10, ge=1, le=100, description="Number of results")
    offset: int = Field(default=0, ge=0, description="Offset for pagination")
    
    # Filters
    memory_types: Optional[List[MemoryType]] = None
    modalities: Optional[List[MemoryModality]] = None
    authors: Optional[List[str]] = None
    projects: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    
    # Temporal filtering
    temporal_filter: TemporalFilter = Field(default=TemporalFilter.ALL)
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    
    # Boosting
    temporal_boost: bool = Field(default=True, description="Boost recent results")
    temporal_decay: float = Field(default=0.1, ge=0.0, le=1.0, description="Decay factor")
    
    # Reranking
    rerank: bool = Field(default=True, description="Apply reranking to results")
    rerank_top_k: int = Field(default=50, ge=10, le=200, description="Candidates for reranking")


class SearchResult(BaseModel):
    """Individual search result."""
    
    memory: Memory
    score: float = Field(..., description="Relevance score")
    dense_score: Optional[float] = None
    sparse_score: Optional[float] = None
    temporal_score: Optional[float] = None
    highlights: List[str] = Field(default_factory=list, description="Highlighted snippets")
    explanation: Optional[str] = None


class SearchResponse(BaseModel):
    """Search API response."""
    
    success: bool = True
    query: str
    mode: SearchMode
    results: List[SearchResult]
    total: int
    took_ms: float = Field(..., description="Query execution time in milliseconds")
    message: Optional[str] = None


class SimilarQuery(BaseModel):
    """Query for finding similar memories."""
    
    memory_id: UUID = Field(..., description="ID of the memory to find similar items for")
    limit: int = Field(default=5, ge=1, le=50)
    exclude_self: bool = Field(default=True)
