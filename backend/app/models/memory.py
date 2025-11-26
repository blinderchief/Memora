"""Memory models for Memora."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class MemoryType(str, Enum):
    """Types of memory content."""
    
    DOCUMENT = "document"
    NOTE = "note"
    CONVERSATION = "conversation"
    IMAGE = "image"
    AUDIO = "audio"
    WEB = "web"


class MemoryModality(str, Enum):
    """Content modality."""
    
    TEXT = "text"
    TABLE = "table"
    IMAGE = "image"
    CODE = "code"
    MIXED = "mixed"


class MemoryMetadata(BaseModel):
    """Metadata associated with a memory."""
    
    author: Optional[str] = None
    role: Optional[str] = None
    project: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    source_file: Optional[str] = None
    source_url: Optional[str] = None
    page_number: Optional[int] = None
    section: Optional[str] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    custom: Dict[str, Any] = Field(default_factory=dict)


class MemoryCreate(BaseModel):
    """Schema for creating a new memory."""
    
    content: str = Field(..., min_length=1, description="The text content of the memory")
    title: Optional[str] = Field(None, description="Optional title for the memory")
    memory_type: MemoryType = Field(default=MemoryType.NOTE)
    modality: MemoryModality = Field(default=MemoryModality.TEXT)
    metadata: MemoryMetadata = Field(default_factory=MemoryMetadata)


class MemoryUpdate(BaseModel):
    """Schema for updating an existing memory."""
    
    content: Optional[str] = None
    title: Optional[str] = None
    memory_type: Optional[MemoryType] = None
    modality: Optional[MemoryModality] = None
    metadata: Optional[MemoryMetadata] = None


class Memory(BaseModel):
    """Full memory model with all fields."""
    
    id: UUID = Field(default_factory=uuid4)
    content: str
    title: Optional[str] = None
    memory_type: MemoryType = MemoryType.NOTE
    modality: MemoryModality = MemoryModality.TEXT
    metadata: MemoryMetadata = Field(default_factory=MemoryMetadata)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = 1

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        }


class MemoryResponse(BaseModel):
    """API response for a single memory."""
    
    success: bool = True
    data: Memory
    message: Optional[str] = None


class MemoryListResponse(BaseModel):
    """API response for multiple memories."""
    
    success: bool = True
    data: List[Memory]
    total: int
    page: int = 1
    page_size: int = 20
    message: Optional[str] = None
