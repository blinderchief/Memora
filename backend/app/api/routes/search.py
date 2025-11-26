"""Search endpoints."""

import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.core.retrieval import search_service
from app.models.search import SearchQuery, SearchResponse, SimilarQuery

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=SearchResponse)
async def search_memories(query: SearchQuery):
    """
    Search memories using hybrid vector search.
    
    Combines dense semantic search with sparse keyword matching (BM25).
    Supports temporal filtering, reranking, and various filter options.
    """
    try:
        response = await search_service.search(query)
        return response
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )


@router.post("/similar", response_model=SearchResponse)
async def find_similar_memories(query: SimilarQuery):
    """
    Find memories similar to a given memory.
    
    Uses the content of the specified memory to find semantically similar items.
    """
    try:
        response = await search_service.find_similar(
            memory_id=query.memory_id,
            limit=query.limit,
        )
        return response
        
    except Exception as e:
        logger.error(f"Similar search failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Similar search failed: {str(e)}",
        )


@router.get("/quick")
async def quick_search(
    q: str,
    limit: int = 10,
):
    """
    Quick search endpoint for simple queries.
    
    A simplified search that uses default settings for fast results.
    """
    try:
        query = SearchQuery(query=q, limit=limit)
        response = await search_service.search(query)
        
        # Return simplified format
        return {
            "query": q,
            "count": response.total,
            "took_ms": response.took_ms,
            "results": [
                {
                    "id": str(r.memory.id),
                    "title": r.memory.title,
                    "content": r.memory.content[:200] + "..." if len(r.memory.content) > 200 else r.memory.content,
                    "score": r.score,
                    "type": r.memory.memory_type.value,
                    "highlights": r.highlights[:2] if r.highlights else [],
                }
                for r in response.results
            ],
        }
        
    except Exception as e:
        logger.error(f"Quick search failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )
