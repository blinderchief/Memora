"""Document ingestion endpoints."""

import logging
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.config import settings
from app.core.embedding import embedding_service
from app.core.ingestion import DocumentParser
from app.db.qdrant import qdrant_service
from app.models.ingest import (
    BatchIngestResponse,
    ChunkingStrategy,
    IngestRequest,
    IngestResponse,
)
from app.models.memory import MemoryModality, MemoryType

logger = logging.getLogger(__name__)

router = APIRouter()
parser = DocumentParser()


@router.post("/text", response_model=IngestResponse)
async def ingest_text(request: IngestRequest):
    """
    Ingest raw text content into the memory system.
    
    This endpoint accepts text content and processes it into memory chunks
    with embeddings for semantic search.
    """
    if not request.content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content is required for text ingestion",
        )
    
    try:
        # Parse and chunk the text
        doc = await parser.parse_text(
            content=request.content,
            title=request.title,
            chunking_strategy=request.chunking_strategy,
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap,
            metadata=request.custom_metadata,
        )
        
        # Generate embeddings for all chunks
        chunk_texts = [chunk.content for chunk in doc.chunks]
        embeddings = await embedding_service.embed_batch(chunk_texts)
        
        # Prepare batch of memories
        memories_batch = []
        for chunk, embedding in zip(doc.chunks, embeddings):
            memory_id = uuid4()
            
            # Build payload
            payload = {
                "content": chunk.content,
                "title": request.title,
                "memory_type": MemoryType.NOTE.value,
                "modality": _detect_modality(chunk).value,
                "author": request.author,
                "project": request.project,
                "tags": request.tags,
                "source_url": request.source_url,
                "chunk_index": chunk.chunk_index,
                "total_chunks": chunk.total_chunks,
                "is_table": chunk.is_table,
                "is_code": chunk.is_code,
                "is_header": chunk.is_header,
                "document_id": str(doc.document_id),
                "custom_metadata": request.custom_metadata,
            }
            
            # Generate sparse vector
            sparse_vector = embedding_service.generate_sparse_vector(chunk.content)
            
            memories_batch.append({
                "memory_id": memory_id,
                "dense_vector": embedding,
                "sparse_vector": sparse_vector,
                "payload": payload,
            })

        # Batch upsert all memories at once
        memories_created = await qdrant_service.upsert_memories_batch(memories_batch)
        
        return IngestResponse(
            success=True,
            document_id=doc.document_id,
            filename=None,
            chunks_created=len(doc.chunks),
            memories_created=memories_created,
            processing_time_ms=doc.processing_time_ms,
            message=f"Successfully ingested {memories_created} memories",
        )
        
    except Exception as e:
        logger.error(f"Text ingestion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {str(e)}",
        )


@router.post("/file", response_model=IngestResponse)
async def ingest_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    project: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # Comma-separated
    chunking_strategy: ChunkingStrategy = Form(ChunkingStrategy.SEMANTIC),
    chunk_size: int = Form(512),
    chunk_overlap: int = Form(50),
):
    """
    Ingest a document file into the memory system.
    
    Supports: PDF, DOCX, PPTX, XLSX, TXT, MD, HTML, JSON, CSV
    """
    # Validate file size
    if file.size and file.size > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.max_file_size_mb}MB",
        )
    
    # Validate file type
    doc_type = parser.get_document_type(file.filename or "")
    if doc_type is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Supported: {list(parser.SUPPORTED_EXTENSIONS.keys())}",
        )
    
    try:
        # Parse tags
        tag_list = [t.strip() for t in tags.split(",")] if tags else []
        
        # Parse the document
        doc = await parser.parse_file(
            file=file,
            chunking_strategy=chunking_strategy,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            metadata={
                "author": author,
                "project": project,
                "tags": tag_list,
            },
        )
        
        # Update title if provided
        if title:
            doc.title = title
        
        # Generate embeddings
        chunk_texts = [chunk.content for chunk in doc.chunks]
        embeddings = await embedding_service.embed_batch(chunk_texts)
        
        # Prepare batch of memories
        memories_batch = []
        for chunk, embedding in zip(doc.chunks, embeddings):
            memory_id = uuid4()
            
            payload = {
                "content": chunk.content,
                "title": doc.title,
                "memory_type": MemoryType.DOCUMENT.value,
                "modality": _detect_modality(chunk).value,
                "author": author,
                "project": project,
                "tags": tag_list,
                "source_file": file.filename,
                "page_number": chunk.page_number,
                "section": chunk.section,
                "chunk_index": chunk.chunk_index,
                "total_chunks": chunk.total_chunks,
                "is_table": chunk.is_table,
                "is_code": chunk.is_code,
                "document_id": str(doc.document_id),
                "extracted_metadata": doc.extracted_metadata,
            }
            
            sparse_vector = embedding_service.generate_sparse_vector(chunk.content)
            
            memories_batch.append({
                "memory_id": memory_id,
                "dense_vector": embedding,
                "sparse_vector": sparse_vector,
                "payload": payload,
            })

        # Batch upsert all memories at once
        memories_created = await qdrant_service.upsert_memories_batch(memories_batch)
        
        return IngestResponse(
            success=True,
            document_id=doc.document_id,
            filename=file.filename,
            chunks_created=len(doc.chunks),
            memories_created=memories_created,
            processing_time_ms=doc.processing_time_ms,
            message=f"Successfully ingested {file.filename}",
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"File ingestion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {str(e)}",
        )


@router.post("/files", response_model=BatchIngestResponse)
async def ingest_files(
    files: List[UploadFile] = File(...),
    author: Optional[str] = Form(None),
    project: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
):
    """
    Batch ingest multiple files.
    """
    import time
    start_time = time.time()
    
    results = []
    successful = 0
    failed = 0
    
    for file in files:
        try:
            result = await ingest_file(
                file=file,
                author=author,
                project=project,
                tags=tags,
            )
            results.append(result)
            successful += 1
        except HTTPException as e:
            results.append(IngestResponse(
                success=False,
                document_id=uuid4(),
                filename=file.filename,
                chunks_created=0,
                memories_created=0,
                processing_time_ms=0,
                message=e.detail,
            ))
            failed += 1
        except Exception as e:
            results.append(IngestResponse(
                success=False,
                document_id=uuid4(),
                filename=file.filename,
                chunks_created=0,
                memories_created=0,
                processing_time_ms=0,
                message=str(e),
            ))
            failed += 1
    
    total_time = (time.time() - start_time) * 1000
    
    return BatchIngestResponse(
        success=failed == 0,
        total_documents=len(files),
        successful=successful,
        failed=failed,
        results=results,
        total_processing_time_ms=total_time,
        message=f"Processed {len(files)} files: {successful} successful, {failed} failed",
    )


def _detect_modality(chunk) -> MemoryModality:
    """Detect the modality of a chunk."""
    if chunk.is_table:
        return MemoryModality.TABLE
    elif chunk.is_code:
        return MemoryModality.CODE
    else:
        return MemoryModality.TEXT
