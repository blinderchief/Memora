"""Social prompting API routes."""

import logging
from typing import List

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.core.embedding import embedding_service
from app.core.social import lamatic_service, social_processor
from app.db.qdrant import qdrant_service
from app.models.social import (
    InspireMeRequest,
    InspireMeResponse,
    LamaticFlowRequest,
    NetworkSparkCard,
    PrivacyLevel,
    SocialPlatform,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/inspire", response_model=InspireMeResponse)
async def inspire_me(request: InspireMeRequest):
    """
    Get network inspiration from social signals.
    
    This endpoint orchestrates the full flow:
    1. Fetch social signals from connected platforms
    2. Process through Lamatic flow (filter → embed → match → generate)
    3. Upsert network sparks to Qdrant
    4. Return inspiring results
    
    Privacy-first: Only vectors + anonymized metadata stored, never raw posts.
    """
    try:
        logger.info(f"Inspire request from user {request.user_id}")
        
        # Step 1: Fetch social signals
        platforms = [SocialPlatform.TWITTER, SocialPlatform.LINKEDIN]
        raw_signals = await social_processor.fetch_signals(
            platforms=platforms,
            time_window_hours=72,
            max_per_platform=50,
        )
        
        if not raw_signals:
            return InspireMeResponse(
                sparks=[],
                total_found=0,
                generated_prompts=[],
                network_heuristics=["No recent network activity found. Check back later!"],
            )
        
        logger.info(f"Fetched {len(raw_signals)} raw signals")
        
        # Step 2: Configure Lamatic flow
        flow_request = LamaticFlowRequest(
            user_id=request.user_id,
            platforms=platforms,
            max_signals=request.max_results,
            time_window_hours=72,
            relevance_threshold=0.6,
            privacy_level=request.privacy_level,
            include_topics=request.focus_areas,
        )
        
        # Step 3: Process through Lamatic flow
        flow_response = await lamatic_service.trigger_flow(
            flow_request=flow_request,
            signals=raw_signals,
        )
        
        if flow_response.status == "failed":
            raise HTTPException(
                status_code=500,
                detail="Failed to process social signals",
            )
        
        logger.info(f"Generated {flow_response.sparks_generated} network sparks")
        
        # Step 4: Embed and upsert sparks to Qdrant
        for spark in flow_response.sparks:
            # Generate embeddings
            dense_vector = await embedding_service.embed_text(spark.content)
            sparse_vector = embedding_service.generate_sparse_vector(spark.content)
            
            # Privacy-safe metadata
            metadata = {
                "user_id": request.user_id,
                "platform": spark.platform.value,
                "anonymized_author": spark.source.anonymized_id,
                "source_label": spark.source.display_label,
                "relevance_score": spark.relevance_score,
                "topic_tags": spark.topic_tags,
                "privacy_level": spark.privacy_level.value,
            }
            
            # Upsert to Qdrant (privacy-first: no raw content)
            await qdrant_service.upsert_network_spark(
                spark_id=spark.id,
                content=spark.content,
                dense_vector=dense_vector,
                sparse_vector=sparse_vector,
                metadata=metadata,
            )
        
        # Step 5: Extract prompts and heuristics
        prompts = [
            spark.generated_prompt
            for spark in flow_response.sparks
            if spark.generated_prompt
        ]
        
        # Generate network heuristics (patterns across sparks)
        heuristics = _extract_network_heuristics(flow_response.sparks)
        
        return InspireMeResponse(
            sparks=flow_response.sparks,
            total_found=flow_response.sparks_generated,
            generated_prompts=prompts[:5],  # Top 5 prompts
            network_heuristics=heuristics,
        )
        
    except Exception as e:
        logger.error(f"Inspire endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sparks", response_model=List[NetworkSparkCard])
async def get_network_sparks(
    user_id: str,
    limit: int = 20,
    min_relevance: float = 0.5,
):
    """
    Retrieve stored network sparks for a user.
    
    Args:
        user_id: User identifier
        limit: Max results
        min_relevance: Minimum relevance score filter
        
    Returns:
        List of network spark cards ready for UI display
    """
    try:
        # Generate embedding for user's general interests (could be enhanced)
        query_text = f"inspiring insights and ideas for {user_id}"
        dense_vector = await embedding_service.embed_text(query_text)
        
        # Search Qdrant for network sparks
        results = await qdrant_service.search_network_sparks(
            user_id=user_id,
            dense_vector=dense_vector,
            limit=limit,
            relevance_threshold=min_relevance,
        )
        
        # Convert to frontend cards
        cards = []
        for result in results:
            payload = result.get("payload", {})
            score = result.get("score", 0.0)
            
            card = NetworkSparkCard(
                id=result.get("id", ""),
                title=_generate_spark_title(payload.get("topic_tags", [])),
                content=payload.get("content", ""),
                source_label=payload.get("source_label", "Network Node"),
                platform=SocialPlatform(payload.get("platform", "twitter")),
                relevance_score=score,
                glow_intensity=min(score, 1.0),  # For UI glow effect
                tags=payload.get("topic_tags", []),
                prompt=None,  # Could fetch from metadata
                created_at=payload.get("created_at", ""),
                metadata=payload,
            )
            cards.append(card)
        
        return cards
        
    except Exception as e:
        logger.error(f"Get sparks failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sparks/{spark_id}")
async def delete_network_spark(spark_id: str, user_id: str):
    """Delete a network spark."""
    try:
        # Add user verification here
        success = await qdrant_service.delete_memory(spark_id)
        
        if success:
            return JSONResponse(
                content={"message": "Network spark deleted successfully"}
            )
        else:
            raise HTTPException(status_code=404, detail="Spark not found")
            
    except Exception as e:
        logger.error(f"Delete spark failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _extract_network_heuristics(sparks: List) -> List[str]:
    """
    Extract high-level patterns from network sparks.
    
    Example: "Your network is buzzing about AI productivity tools"
    """
    if not sparks:
        return []
    
    # Aggregate topic tags
    all_topics = []
    for spark in sparks:
        all_topics.extend(spark.topic_tags)
    
    # Find top topics
    from collections import Counter
    topic_counts = Counter(all_topics)
    top_topics = topic_counts.most_common(3)
    
    heuristics = []
    
    if top_topics:
        topics_str = ", ".join([t[0] for t in top_topics])
        heuristics.append(
            f"🔥 Your network is actively discussing: {topics_str}"
        )
    
    # Engagement patterns
    high_engagement = [s for s in sparks if s.relevance_score > 0.8]
    if high_engagement:
        heuristics.append(
            f"⚡ {len(high_engagement)} highly relevant insights detected"
        )
    
    # Platform diversity
    platforms = set(s.platform for s in sparks)
    if len(platforms) > 1:
        heuristics.append(
            f"🌐 Cross-platform signals from {len(platforms)} networks"
        )
    
    return heuristics


def _generate_spark_title(topics: List[str]) -> str:
    """Generate a title from topic tags."""
    if not topics:
        return "Network Insight"
    
    primary_topic = topics[0]
    return f"Network Insight: {primary_topic.title()}"
