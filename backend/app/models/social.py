"""Social prompting and network sparks models."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, field_validator


class SocialPlatform(str, Enum):
    """Supported social platforms."""
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    MASTODON = "mastodon"
    GITHUB = "github"
    REDDIT = "reddit"


class PrivacyLevel(str, Enum):
    """Privacy level for anonymization."""
    FULL_ANONYMIZE = "full_anonymize"  # No identifiable info
    BLUR_AUTHOR = "blur_author"  # Anonymized author handles
    MINIMAL = "minimal"  # Keep source with consent


class SocialSignal(BaseModel):
    """Raw social signal before processing."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    platform: SocialPlatform
    content: str
    author_handle: str  # Will be anonymized
    author_display_name: Optional[str] = None
    url: str
    posted_at: datetime
    engagement_score: float = 0.0  # Likes, shares, etc.
    raw_metadata: Dict[str, Any] = Field(default_factory=dict)
    
    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()


class AnonymizedAuthor(BaseModel):
    """Privacy-preserved author information."""
    anonymized_id: str  # Hash of original handle
    display_label: str  # e.g., "Connection #47", "Network Node A"
    platform: SocialPlatform
    trust_score: float = 0.5  # 0-1, based on connection strength


class NetworkSpark(BaseModel):
    """Processed social signal ready for memory insertion."""
    id: UUID = Field(default_factory=uuid4)
    content: str  # Distilled/summarized content
    original_excerpt: str  # First 280 chars, no PII
    source: AnonymizedAuthor
    platform: SocialPlatform
    relevance_score: float  # 0-1, match to user's interests
    topic_tags: List[str] = Field(default_factory=list)
    generated_prompt: Optional[str] = None  # AI-generated PKM prompt
    created_at: datetime = Field(default_factory=datetime.utcnow)
    privacy_level: PrivacyLevel = PrivacyLevel.BLUR_AUTHOR
    
    # Embedding metadata (no raw social data)
    embedding_metadata: Dict[str, Any] = Field(default_factory=dict)


class LamaticFlowRequest(BaseModel):
    """Request to trigger Lamatic orchestration flow."""
    user_id: str
    platforms: List[SocialPlatform] = Field(default=[SocialPlatform.TWITTER, SocialPlatform.LINKEDIN])
    max_signals: int = Field(default=20, ge=1, le=100)
    time_window_hours: int = Field(default=72, ge=1, le=168)  # Last 3 days
    relevance_threshold: float = Field(default=0.6, ge=0.0, le=1.0)
    privacy_level: PrivacyLevel = PrivacyLevel.BLUR_AUTHOR
    include_topics: List[str] = Field(default_factory=list)
    exclude_topics: List[str] = Field(default_factory=list)


class LamaticFlowResponse(BaseModel):
    """Response from Lamatic orchestration."""
    flow_id: str
    execution_id: str
    status: str  # "success", "partial", "failed"
    sparks_generated: int
    sparks: List[NetworkSpark]
    processing_time_ms: int
    errors: List[str] = Field(default_factory=list)


class InspireMeRequest(BaseModel):
    """Request to get network inspiration."""
    user_id: str
    focus_areas: List[str] = Field(default_factory=list)  # e.g., ["AI", "productivity"]
    max_results: int = Field(default=10, ge=1, le=50)
    include_prompts: bool = True  # Generate PKM prompts
    privacy_level: PrivacyLevel = PrivacyLevel.BLUR_AUTHOR


class InspireMeResponse(BaseModel):
    """Response with network sparks."""
    sparks: List[NetworkSpark]
    total_found: int
    generated_prompts: List[str] = Field(default_factory=list)
    network_heuristics: List[str] = Field(default_factory=list)  # Distilled patterns
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class NetworkSparkCard(BaseModel):
    """Frontend-ready network spark card."""
    id: str
    title: str
    content: str
    source_label: str  # Anonymized
    platform: SocialPlatform
    relevance_score: float
    glow_intensity: float  # 0-1 for UI animation
    tags: List[str]
    prompt: Optional[str] = None
    created_at: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)
