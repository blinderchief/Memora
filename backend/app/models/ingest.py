"""Ingestion models for Memora."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    """Supported document types for ingestion."""
    
    PDF = "pdf"
    DOCX = "docx"
    PPTX = "pptx"
    XLSX = "xlsx"
    TXT = "txt"
    MD = "md"
    HTML = "html"
    JSON = "json"
    CSV = "csv"


class ChunkingStrategy(str, Enum):
    """Document chunking strategies."""
    
    FIXED = "fixed"        # Fixed size chunks
    SEMANTIC = "semantic"  # Sentence/paragraph boundaries
    SECTION = "section"    # Document sections
    PAGE = "page"          # Page-based (for PDFs)


class DocumentChunk(BaseModel):
    """A chunk of content extracted from a document."""
    
    id: UUID = Field(default_factory=uuid4)
    content: str
    chunk_index: int
    total_chunks: int
    
    # Position info
    page_number: Optional[int] = None
    section: Optional[str] = None
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    
    # Content type
    is_table: bool = False
    is_code: bool = False
    is_header: bool = False
    
    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IngestRequest(BaseModel):
    """Request schema for document ingestion."""
    
    # For text content
    content: Optional[str] = Field(None, description="Raw text content to ingest")
    title: Optional[str] = Field(None, description="Document title")
    
    # Processing options
    chunking_strategy: ChunkingStrategy = Field(default=ChunkingStrategy.SEMANTIC)
    chunk_size: int = Field(default=512, ge=100, le=2000, description="Target chunk size")
    chunk_overlap: int = Field(default=50, ge=0, le=500, description="Overlap between chunks")
    
    # Metadata
    author: Optional[str] = None
    project: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    source_url: Optional[str] = None
    custom_metadata: Dict[str, Any] = Field(default_factory=dict)


class ProcessedDocument(BaseModel):
    """Result of document processing."""
    
    document_id: UUID = Field(default_factory=uuid4)
    filename: Optional[str] = None
    document_type: DocumentType
    title: Optional[str] = None
    chunks: List[DocumentChunk]
    total_chunks: int
    total_pages: Optional[int] = None
    total_characters: int
    
    # Extracted metadata
    extracted_metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # Processing info
    processed_at: datetime = Field(default_factory=datetime.utcnow)
    processing_time_ms: float


class IngestResponse(BaseModel):
    """Response schema for document ingestion."""
    
    success: bool = True
    document_id: UUID
    filename: Optional[str] = None
    chunks_created: int
    memories_created: int
    processing_time_ms: float
    message: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)


class BatchIngestResponse(BaseModel):
    """Response for batch document ingestion."""
    
    success: bool = True
    total_documents: int
    successful: int
    failed: int
    results: List[IngestResponse]
    total_processing_time_ms: float
    message: Optional[str] = None
