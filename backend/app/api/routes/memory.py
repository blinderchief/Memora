"""Memory CRUD endpoints."""

import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.core.embedding import embedding_service
from app.db.qdrant import qdrant_service
from app.models.memory import (
    Memory,
    MemoryCreate,
    MemoryListResponse,
    MemoryModality,
    MemoryResponse,
    MemoryType,
    MemoryUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
async def create_memory(memory: MemoryCreate):
    """Create a new memory."""
    try:
        # Create memory object
        now = datetime.utcnow()
        memory_obj = Memory(
            content=memory.content,
            title=memory.title,
            memory_type=memory.memory_type,
            modality=memory.modality,
            metadata=memory.metadata,
            created_at=now,
            updated_at=now,
        )
        
        # Generate embeddings
        dense_vector = await embedding_service.embed_text(memory.content)
        sparse_vector = embedding_service.generate_sparse_vector(memory.content)
        
        # Build payload
        payload = {
            "content": memory.content,
            "title": memory.title,
            "memory_type": memory.memory_type.value,
            "modality": memory.modality.value,
            "author": memory.metadata.author,
            "role": memory.metadata.role,
            "project": memory.metadata.project,
            "tags": memory.metadata.tags,
            "source_file": memory.metadata.source_file,
            "source_url": memory.metadata.source_url,
            "page_number": memory.metadata.page_number,
            "section": memory.metadata.section,
            "confidence": memory.metadata.confidence,
            "custom_metadata": memory.metadata.custom,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "version": 1,
        }
        
        # Store in Qdrant
        await qdrant_service.upsert_memory(
            memory_id=memory_obj.id,
            dense_vector=dense_vector,
            sparse_vector=sparse_vector,
            payload=payload,
        )
        
        return MemoryResponse(
            success=True,
            data=memory_obj,
            message="Memory created successfully",
        )
        
    except Exception as e:
        logger.error(f"Failed to create memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create memory: {str(e)}",
        )


@router.get("/{memory_id}", response_model=MemoryResponse)
async def get_memory(memory_id: UUID):
    """Get a memory by ID."""
    try:
        result = await qdrant_service.get_memory(memory_id)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found",
            )
        
        payload = result["payload"]
        memory = Memory(
            id=memory_id,
            content=payload.get("content", ""),
            title=payload.get("title"),
            memory_type=MemoryType(payload.get("memory_type", "note")),
            modality=MemoryModality(payload.get("modality", "text")),
            created_at=_parse_datetime(payload.get("created_at")),
            updated_at=_parse_datetime(payload.get("updated_at")),
            version=payload.get("version", 1),
        )
        
        return MemoryResponse(success=True, data=memory)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get memory: {str(e)}",
        )


@router.get("", response_model=MemoryListResponse)
async def list_memories(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    memory_types: Optional[List[MemoryType]] = Query(None),
    modalities: Optional[List[MemoryModality]] = Query(None),
    authors: Optional[List[str]] = Query(None),
    projects: Optional[List[str]] = Query(None),
    tags: Optional[List[str]] = Query(None),
):
    """List memories with optional filtering and pagination."""
    try:
        offset = (page - 1) * page_size
        
        # Build filters
        memory_types_str = [m.value for m in memory_types] if memory_types else None
        modalities_str = [m.value for m in modalities] if modalities else None
        
        filters = qdrant_service.build_filter(
            memory_types=memory_types_str,
            modalities=modalities_str,
            authors=authors,
            projects=projects,
            tags=tags,
        )
        
        # Fetch memories
        results = await qdrant_service.list_memories(
            limit=page_size,
            offset=offset,
            filters=filters,
        )
        
        # Convert to Memory objects
        memories = []
        for result in results:
            payload = result["payload"]
            memory = Memory(
                id=UUID(result["id"]) if isinstance(result["id"], str) else result["id"],
                content=payload.get("content", ""),
                title=payload.get("title"),
                memory_type=MemoryType(payload.get("memory_type", "note")),
                modality=MemoryModality(payload.get("modality", "text")),
                created_at=_parse_datetime(payload.get("created_at")),
                updated_at=_parse_datetime(payload.get("updated_at")),
                version=payload.get("version", 1),
            )
            memories.append(memory)
        
        return MemoryListResponse(
            success=True,
            data=memories,
            total=len(memories),  # Note: Would need count query for actual total
            page=page,
            page_size=page_size,
        )
        
    except Exception as e:
        logger.error(f"Failed to list memories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list memories: {str(e)}",
        )


@router.patch("/{memory_id}", response_model=MemoryResponse)
async def update_memory(memory_id: UUID, update: MemoryUpdate):
    """Update an existing memory."""
    try:
        # Get existing memory
        existing = await qdrant_service.get_memory(memory_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found",
            )
        
        payload = existing["payload"]
        now = datetime.utcnow()
        
        # Update fields
        if update.content is not None:
            payload["content"] = update.content
        if update.title is not None:
            payload["title"] = update.title
        if update.memory_type is not None:
            payload["memory_type"] = update.memory_type.value
        if update.modality is not None:
            payload["modality"] = update.modality.value
        if update.metadata is not None:
            payload["author"] = update.metadata.author
            payload["project"] = update.metadata.project
            payload["tags"] = update.metadata.tags
            
        payload["updated_at"] = now.isoformat()
        payload["version"] = payload.get("version", 1) + 1
        
        # Regenerate embeddings if content changed
        content = payload.get("content", "")
        dense_vector = await embedding_service.embed_text(content)
        sparse_vector = embedding_service.generate_sparse_vector(content)
        
        # Update in Qdrant
        await qdrant_service.upsert_memory(
            memory_id=memory_id,
            dense_vector=dense_vector,
            sparse_vector=sparse_vector,
            payload=payload,
        )
        
        memory = Memory(
            id=memory_id,
            content=payload.get("content", ""),
            title=payload.get("title"),
            memory_type=MemoryType(payload.get("memory_type", "note")),
            modality=MemoryModality(payload.get("modality", "text")),
            created_at=_parse_datetime(payload.get("created_at")),
            updated_at=now,
            version=payload.get("version", 1),
        )
        
        return MemoryResponse(
            success=True,
            data=memory,
            message="Memory updated successfully",
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update memory: {str(e)}",
        )


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(memory_id: UUID):
    """Delete a memory."""
    try:
        # Check if exists
        existing = await qdrant_service.get_memory(memory_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found",
            )
        
        await qdrant_service.delete_memory(memory_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete memory: {str(e)}",
        )


def _parse_datetime(value) -> datetime:
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
