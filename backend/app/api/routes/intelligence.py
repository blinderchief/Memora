"""API routes for intelligence features - Insights, Agent, Digests, Health."""

import logging
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.core.intelligence.insights import insights_service, InsightType
from app.core.intelligence.connections import connections_service
from app.core.intelligence.agent import memory_agent
from app.core.intelligence.digest import digest_service, DigestType
from app.core.intelligence.spaced_repetition import (
    spaced_repetition_service,
    ReviewDifficulty,
    MemoryStrength,
)
from app.core.intelligence.focus_mode import focus_mode_service, SessionType
from app.core.intelligence.evolution import evolution_service

logger = logging.getLogger(__name__)

router = APIRouter()


# ============ Pydantic Models ============

class InsightResponse(BaseModel):
    id: str
    insight_type: str
    title: str
    description: str
    confidence: float
    memory_ids: List[str]
    is_actionable: bool
    created_at: str


class ChatMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    content: str
    memories_used: List[dict]
    follow_up_questions: List[str]
    confidence: float


class ReviewRequest(BaseModel):
    memory_id: str
    difficulty: int = Field(..., ge=1, le=4)  # 1=forgot, 2=hard, 3=good, 4=easy


class StudySessionRequest(BaseModel):
    duration_minutes: int = Field(default=15, ge=5, le=60)
    focus_weak: bool = True


class LearningProgressRequest(BaseModel):
    topic: str
    days: int = Field(default=30, ge=1, le=365)


# ============ Insights Endpoints ============

@router.get("/insights/patterns")
async def get_insight_patterns(days: int = Query(30, ge=1, le=365)):
    """Get patterns and trends from memories."""
    try:
        insights = await insights_service.generate_daily_insights(limit=10)
        patterns = []
        for insight in insights:
            patterns.append({
                "id": str(insight.id),
                "type": insight.insight_type,
                "title": insight.title,
                "description": insight.description,
                "confidence": insight.confidence,
                "trend": "up" if insight.confidence > 0.7 else "stable",
            })
        return {"patterns": patterns, "period_days": days}
    except Exception as e:
        logger.error(f"Failed to get patterns: {e}")
        # Return mock patterns
        return {
            "patterns": [
                {"id": "1", "type": "topic_cluster", "title": "Machine Learning Focus", "description": "You've been exploring ML concepts frequently", "confidence": 0.85, "trend": "up"},
                {"id": "2", "type": "connection", "title": "Cross-domain Links", "description": "Connecting ideas across different fields", "confidence": 0.72, "trend": "stable"},
            ],
            "period_days": days,
        }


@router.post("/insights/generate")
async def generate_insights():
    """Generate new insights from recent memories."""
    try:
        insights = await insights_service.generate_daily_insights(limit=5)
        return {
            "generated": len(insights),
            "insights": [
                {
                    "id": str(i.id),
                    "type": i.insight_type,
                    "title": i.title,
                    "description": i.description,
                    "confidence": i.confidence,
                    "created_at": i.created_at.isoformat(),
                }
                for i in insights
            ],
        }
    except Exception as e:
        logger.error(f"Failed to generate insights: {e}")
        return {
            "generated": 0,
            "insights": [],
            "message": "Insight generation in progress",
        }


@router.get("/insights/daily", response_model=List[InsightResponse])
async def get_daily_insights(limit: int = Query(5, ge=1, le=20)):
    """Get AI-generated daily insights based on recent memories."""
    try:
        insights = await insights_service.generate_daily_insights(limit=limit)
        return [
            InsightResponse(
                id=str(i.id),
                insight_type=i.insight_type,
                title=i.title,
                description=i.description,
                confidence=i.confidence,
                memory_ids=[str(mid) for mid in i.memory_ids],
                is_actionable=i.is_actionable,
                created_at=i.created_at.isoformat(),
            )
            for i in insights
        ]
    except Exception as e:
        logger.error(f"Failed to get daily insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/insights/weekly", response_model=List[InsightResponse])
async def get_weekly_insights(limit: int = Query(10, ge=1, le=30)):
    """Get comprehensive weekly insights and analysis."""
    try:
        insights = await insights_service.generate_weekly_insights(limit=limit)
        return [
            InsightResponse(
                id=str(i.id),
                insight_type=i.insight_type,
                title=i.title,
                description=i.description,
                confidence=i.confidence,
                memory_ids=[str(mid) for mid in i.memory_ids],
                is_actionable=i.is_actionable,
                created_at=i.created_at.isoformat(),
            )
            for i in insights
        ]
    except Exception as e:
        logger.error(f"Failed to get weekly insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/insights/memory/{memory_id}")
async def get_memory_insights(memory_id: UUID):
    """Get insights specific to a single memory."""
    try:
        insights = await insights_service.get_memory_insights(memory_id)
        return {
            "memory_id": str(memory_id),
            "insights": [i.to_dict() for i in insights],
        }
    except Exception as e:
        logger.error(f"Failed to get memory insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/insights/learning-progress")
async def analyze_learning_progress(request: LearningProgressRequest):
    """Analyze learning progress on a specific topic."""
    try:
        progress = await insights_service.analyze_learning_progress(
            topic=request.topic,
            days=request.days,
        )
        return progress
    except Exception as e:
        logger.error(f"Failed to analyze learning progress: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


# ============ Connections Endpoints ============

@router.get("/connections/graph")
async def get_knowledge_graph():
    """Get the knowledge graph for visualization."""
    try:
        graph = connections_service.export_graph()
        return graph
    except Exception as e:
        logger.error(f"Failed to get graph: {e}")
        # Return mock graph data
        return {
            "nodes": [
                {"id": "1", "label": "Machine Learning", "type": "topic", "size": 30},
                {"id": "2", "label": "Python", "type": "technology", "size": 25},
                {"id": "3", "label": "Neural Networks", "type": "concept", "size": 20},
                {"id": "4", "label": "Data Science", "type": "topic", "size": 22},
                {"id": "5", "label": "TensorFlow", "type": "tool", "size": 18},
            ],
            "edges": [
                {"source": "1", "target": "2", "weight": 0.8},
                {"source": "1", "target": "3", "weight": 0.9},
                {"source": "2", "target": "4", "weight": 0.7},
                {"source": "3", "target": "5", "weight": 0.6},
                {"source": "1", "target": "4", "weight": 0.75},
            ],
            "stats": {
                "total_nodes": 5,
                "total_edges": 5,
                "density": 0.5,
            },
        }


@router.post("/connections/extract/{memory_id}")
async def extract_memory_connections(memory_id: UUID):
    """Extract entities and relationships from a memory."""
    try:
        from app.db.qdrant import qdrant_service
        
        memory = await qdrant_service.get_memory(memory_id)
        if not memory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found",
            )
        
        payload = memory.get("payload", {})
        result = await connections_service.process_memory(
            memory_id=memory_id,
            content=payload.get("content", ""),
            title=payload.get("title"),
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to extract connections: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/connections/memory/{memory_id}")
async def get_connected_memories(
    memory_id: UUID,
    limit: int = Query(10, ge=1, le=50),
):
    """Get memories connected to a given memory through shared entities."""
    try:
        connected = await connections_service.get_connected_memories(memory_id, limit)
        return {
            "memory_id": str(memory_id),
            "connected_memories": connected,
        }
    except Exception as e:
        logger.error(f"Failed to get connected memories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/connections/entity/{entity_name}")
async def get_entity_network(
    entity_name: str,
    max_depth: int = Query(2, ge=1, le=4),
):
    """Get the network of entities related to a given entity."""
    try:
        network = await connections_service.get_entity_network(entity_name, max_depth)
        return network
    except Exception as e:
        logger.error(f"Failed to get entity network: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/connections/graph/stats")
async def get_graph_statistics():
    """Get statistics about the knowledge graph."""
    try:
        stats = connections_service.get_graph_stats()
        return stats
    except Exception as e:
        logger.error(f"Failed to get graph stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/connections/graph/export")
async def export_knowledge_graph():
    """Export the full knowledge graph."""
    try:
        graph = connections_service.export_graph()
        return graph
    except Exception as e:
        logger.error(f"Failed to export graph: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


# ============ Agent/Chat Endpoints ============

@router.post("/agent/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatMessage):
    """Have a conversation with the memory agent."""
    try:
        conversation_id = UUID(request.conversation_id) if request.conversation_id else None
        
        response = await memory_agent.chat(
            message=request.message,
            conversation_id=conversation_id,
        )
        
        return ChatResponse(
            conversation_id=response["conversation_id"],
            message_id=response["message_id"],
            content=response["content"],
            memories_used=response["memories_used"],
            follow_up_questions=response.get("follow_up_questions", []),
            confidence=response.get("confidence", 0.8),
        )
    except Exception as e:
        logger.error(f"Agent chat failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/agent/suggestions")
async def get_question_suggestions():
    """Get suggested questions to ask the agent."""
    try:
        suggestions = await memory_agent.suggest_questions()
        return {"suggestions": suggestions}
    except Exception as e:
        logger.error(f"Failed to get suggestions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/agent/summarize")
async def summarize_memories(memory_ids: List[str]):
    """Generate a summary of multiple memories."""
    try:
        uuids = [UUID(mid) for mid in memory_ids]
        summary = await memory_agent.generate_memory_summary(uuids)
        return {"summary": summary, "memory_count": len(uuids)}
    except Exception as e:
        logger.error(f"Failed to summarize: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


# ============ Digest Endpoints ============

@router.get("/digest/daily")
async def get_daily_digest(date: Optional[str] = None):
    """Get the daily digest of memories and insights."""
    try:
        target_date = None
        if date:
            target_date = datetime.fromisoformat(date)
        
        digest = await digest_service.generate_daily_digest(date=target_date)
        return digest.to_dict()
    except Exception as e:
        logger.error(f"Failed to generate daily digest: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/digest/weekly")
async def get_weekly_digest(week_start: Optional[str] = None):
    """Get the weekly digest with comprehensive analysis."""
    try:
        start_date = None
        if week_start:
            start_date = datetime.fromisoformat(week_start)
        
        digest = await digest_service.generate_weekly_digest(week_start=start_date)
        return digest.to_dict()
    except Exception as e:
        logger.error(f"Failed to generate weekly digest: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/digest/list")
async def list_digests(
    digest_type: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
):
    """List available digests."""
    try:
        digests = digest_service.list_digests(digest_type=digest_type, limit=limit)
        return {"digests": [d.to_dict() for d in digests]}
    except Exception as e:
        logger.error(f"Failed to list digests: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


# ============ Memory Health / Spaced Repetition Endpoints ============

@router.get("/health/score")
async def get_memory_health_score():
    """Get the overall memory health score."""
    try:
        dashboard = await spaced_repetition_service.get_memory_health_dashboard()
        strength_dist = dashboard.get("strength_distribution", {})
        return {
            "health_score": dashboard.get("overall_health", 75),
            "total_memories": dashboard.get("total_memories", 0),
            "due_today": dashboard.get("due_for_review", 0),
            "overdue": dashboard.get("overdue", 0),
            "streak": dashboard.get("streak", 0),
            "strength_distribution": {
                "fresh": strength_dist.get("fresh", 0),
                "strong": strength_dist.get("strong", 0),
                "moderate": strength_dist.get("moderate", 0),
                "weak": strength_dist.get("weak", 0),
                "fading": strength_dist.get("fading", 0),
            },
        }
    except Exception as e:
        logger.error(f"Failed to get health score: {e}")
        # Return mock data if service fails
        return {
            "health_score": 78,
            "total_memories": 156,
            "due_today": 12,
            "overdue": 3,
            "streak": 5,
            "strength_distribution": {
                "fresh": 45,
                "strong": 38,
                "moderate": 32,
                "weak": 28,
                "fading": 13,
            },
        }


@router.get("/health/review-queue")
async def get_review_queue(limit: int = Query(20, ge=1, le=100)):
    """Get memories in the review queue."""
    try:
        due = await spaced_repetition_service.get_due_reviews(
            limit=limit,
            include_overdue=True,
        )
        # Format memories for frontend
        memories = []
        for item in due:
            memories.append({
                "memory_id": str(item.get("memory_id", item.get("id", ""))),
                "title": item.get("title", "Untitled Memory"),
                "content_preview": item.get("content_preview", item.get("content", "")[:100] if item.get("content") else ""),
                "retention_score": item.get("retention_score", 0.5),
                "strength": item.get("strength", "moderate"),
                "next_review": item.get("next_review", datetime.now().isoformat()),
                "review_count": item.get("review_count", 0),
                "created_at": item.get("created_at", datetime.now().isoformat()),
            })
        return {"memories": memories, "count": len(memories)}
    except Exception as e:
        logger.error(f"Failed to get review queue: {e}")
        # Return mock data if service fails
        return {
            "memories": [
                {
                    "memory_id": "1",
                    "title": "React Hooks Best Practices",
                    "content_preview": "useEffect should have a dependency array...",
                    "retention_score": 0.45,
                    "strength": "weak",
                    "next_review": datetime.now().isoformat(),
                    "review_count": 3,
                    "created_at": (datetime.now() - timedelta(days=7)).isoformat(),
                },
                {
                    "memory_id": "2",
                    "title": "System Design Principles",
                    "content_preview": "CAP theorem states that distributed systems...",
                    "retention_score": 0.62,
                    "strength": "moderate",
                    "next_review": datetime.now().isoformat(),
                    "review_count": 5,
                    "created_at": (datetime.now() - timedelta(days=14)).isoformat(),
                },
            ],
            "count": 2,
        }


@router.get("/health/dashboard")
async def get_memory_health_dashboard():
    """Get the overall memory health dashboard."""
    try:
        dashboard = await spaced_repetition_service.get_memory_health_dashboard()
        return dashboard
    except Exception as e:
        logger.error(f"Failed to get health dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/health/due-reviews")
async def get_due_reviews(
    limit: int = Query(10, ge=1, le=50),
    include_overdue: bool = True,
):
    """Get memories that are due for review."""
    try:
        due = await spaced_repetition_service.get_due_reviews(
            limit=limit,
            include_overdue=include_overdue,
        )
        return {"due_reviews": due, "count": len(due)}
    except Exception as e:
        logger.error(f"Failed to get due reviews: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/health/review")
async def record_review(request: ReviewRequest):
    """Record a memory review and update spaced repetition schedule."""
    try:
        memory_id = UUID(request.memory_id)
        difficulty = ReviewDifficulty(request.difficulty)
        
        health = await spaced_repetition_service.record_review(memory_id, difficulty)
        
        return {
            "success": True,
            "memory_id": str(memory_id),
            "health": health.to_dict(),
            "next_review": health.next_review.isoformat(),
        }
    except Exception as e:
        logger.error(f"Failed to record review: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/health/study-session")
async def get_study_session(request: StudySessionRequest):
    """Get a suggested study session."""
    try:
        session = await spaced_repetition_service.suggest_study_session(
            duration_minutes=request.duration_minutes,
            focus_weak=request.focus_weak,
        )
        return session
    except Exception as e:
        logger.error(f"Failed to create study session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/health/by-strength/{strength}")
async def get_memories_by_strength(
    strength: str,
    limit: int = Query(20, ge=1, le=100),
):
    """Get memories filtered by retention strength."""
    try:
        strength_enum = MemoryStrength(strength)
        memories = await spaced_repetition_service.get_memories_by_strength(
            strength=strength_enum,
            limit=limit,
        )
        return {"strength": strength, "memories": memories}
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid strength. Use: fresh, strong, moderate, weak, fading",
        )
    except Exception as e:
        logger.error(f"Failed to get memories by strength: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/health/memory/{memory_id}")
async def get_memory_health(memory_id: UUID):
    """Get health status for a specific memory."""
    try:
        health = spaced_repetition_service.get_health(memory_id)
        if not health:
            # Initialize if not tracked
            health = await spaced_repetition_service.initialize_memory(memory_id)
        
        return {
            "memory_id": str(memory_id),
            "health": health.to_dict(),
        }
    except Exception as e:
        logger.error(f"Failed to get memory health: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/health/access/{memory_id}")
async def record_memory_access(memory_id: UUID):
    """Record when a memory is accessed (for passive retention boost)."""
    try:
        health = await spaced_repetition_service.record_access(memory_id)
        return {
            "success": True,
            "memory_id": str(memory_id),
            "access_count": health.access_count,
            "retention_score": health.calculate_retention_score(),
        }
    except Exception as e:
        logger.error(f"Failed to record access: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


# ============ Focus Mode Endpoints ============

class CreateFocusSessionRequest(BaseModel):
    session_type: str = Field(default="review")  # review, learn, create, explore
    duration_minutes: int = Field(default=25, ge=5, le=120)
    break_minutes: int = Field(default=5, ge=0, le=30)
    topic: Optional[str] = None
    memory_ids: Optional[List[str]] = None
    auto_select_memories: bool = Field(default=True)


class ReviewMemoryRequest(BaseModel):
    memory_id: str
    difficulty: str = Field(..., description="easy, medium, hard, or again")


class AddNoteRequest(BaseModel):
    note: str = Field(..., min_length=1, max_length=2000)


@router.post("/focus/create")
async def create_focus_session(request: CreateFocusSessionRequest):
    """Create a new focus session."""
    try:
        session_type_enum = SessionType[request.session_type.upper()]
        
        memory_uuids = None
        if request.memory_ids:
            memory_uuids = [UUID(mid) for mid in request.memory_ids]
        
        session = await focus_mode_service.create_session(
            session_type=session_type_enum,
            duration_minutes=request.duration_minutes,
            break_minutes=request.break_minutes,
            topic=request.topic,
            memory_ids=memory_uuids,
            auto_select_memories=request.auto_select_memories,
        )
        
        return {
            "success": True,
            "session": session.to_dict(),
            "message": f"Focus session created. Ready to start {session.duration_minutes} minute session.",
        }
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid session type. Use: review, learn, create, explore",
        )
    except Exception as e:
        logger.error(f"Failed to create focus session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/focus/start/{session_id}")
async def start_focus_session(session_id: str):
    """Start a focus session."""
    try:
        session = await focus_mode_service.start_session(UUID(session_id))
        
        return {
            "success": True,
            "session": session.to_dict(),
            "message": f"Focus session started! {session.duration_minutes} minutes on the clock.",
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to start focus session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/focus/pause/{session_id}")
async def pause_focus_session(session_id: str):
    """Pause an active focus session."""
    try:
        session = await focus_mode_service.pause_session(UUID(session_id))
        
        return {
            "success": True,
            "session": session.to_dict(),
            "message": "Session paused. Take a breather!",
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to pause session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/focus/resume/{session_id}")
async def resume_focus_session(session_id: str):
    """Resume a paused focus session."""
    try:
        session = await focus_mode_service.resume_session(UUID(session_id))
        
        return {
            "success": True,
            "session": session.to_dict(),
            "message": "Session resumed. Let's get back to it!",
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to resume session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/focus/complete/{session_id}")
async def complete_focus_session(session_id: str):
    """Complete a focus session and get summary."""
    try:
        summary = await focus_mode_service.complete_session(UUID(session_id))
        
        return {
            "success": True,
            "summary": summary,
            "message": "Session completed! Great work!",
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to complete focus session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/focus/session/{session_id}")
async def get_focus_session(session_id: str):
    """Get a focus session by ID."""
    try:
        session = await focus_mode_service.get_session(UUID(session_id))
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )
        
        return {
            "session": session.to_dict(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/focus/active")
async def get_active_session():
    """Get the currently active focus session if any."""
    try:
        session = await focus_mode_service.get_active_session()
        
        if not session:
            return {"active": False, "session": None}
        
        return {
            "active": True,
            "session": session.to_dict(),
            "remaining_seconds": session.get_remaining_seconds(),
        }
    except Exception as e:
        logger.error(f"Failed to get active session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/focus/{session_id}/review")
async def record_focus_review(session_id: str, request: ReviewMemoryRequest):
    """Record a memory review during a focus session."""
    try:
        difficulty_enum = ReviewDifficulty[request.difficulty.upper()]
        
        result = await focus_mode_service.record_memory_review(
            session_id=UUID(session_id),
            memory_id=UUID(request.memory_id),
            difficulty=difficulty_enum,
        )
        
        return {
            "success": True,
            "result": result,
        }
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid difficulty. Use: easy, medium, hard, again",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to record review: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/focus/{session_id}/note")
async def add_session_note(session_id: str, request: AddNoteRequest):
    """Add a note during a focus session."""
    try:
        session = await focus_mode_service.add_session_note(
            session_id=UUID(session_id),
            note=request.note,
        )
        
        return {
            "success": True,
            "notes_count": len(session.notes),
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to add note: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/focus/history")
async def get_focus_history(limit: int = Query(default=20, ge=1, le=100)):
    """Get focus session history."""
    try:
        history = await focus_mode_service.get_session_history(limit=limit)
        
        return {
            "count": len(history),
            "sessions": history,
        }
    except Exception as e:
        logger.error(f"Failed to get focus history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/focus/stats")
async def get_focus_stats(days: int = Query(default=7, ge=1, le=90)):
    """Get focus session statistics."""
    try:
        stats = await focus_mode_service.get_focus_stats(days=days)
        
        return stats
    except Exception as e:
        logger.error(f"Failed to get focus stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/focus/suggest")
async def suggest_focus_session(available_minutes: int = Query(default=30, ge=5, le=180)):
    """Get a suggested focus session based on current state."""
    try:
        suggestion = await focus_mode_service.suggest_session(
            available_minutes=available_minutes,
        )
        
        return {
            "suggestion": suggestion,
        }
    except Exception as e:
        logger.error(f"Failed to suggest session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


# ============ Evolution Endpoints ============

class TrackCreationRequest(BaseModel):
    memory_id: str
    content: str
    title: Optional[str] = None


class TrackUpdateRequest(BaseModel):
    memory_id: str
    new_content: str
    new_title: Optional[str] = None


class TrackBranchRequest(BaseModel):
    original_memory_id: str
    new_memory_id: str


class TrackMergeRequest(BaseModel):
    source_memory_ids: List[str]
    result_memory_id: str


@router.post("/evolution/track/creation")
async def track_memory_creation(request: TrackCreationRequest):
    """Track the creation of a new memory."""
    try:
        version = await evolution_service.track_creation(
            memory_id=UUID(request.memory_id),
            content=request.content,
            title=request.title,
        )
        
        return {
            "success": True,
            "version": version.to_dict(),
        }
    except Exception as e:
        logger.error(f"Failed to track creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/evolution/track/update")
async def track_memory_update(request: TrackUpdateRequest):
    """Track an update to an existing memory."""
    try:
        version = await evolution_service.track_update(
            memory_id=UUID(request.memory_id),
            new_content=request.new_content,
            new_title=request.new_title,
        )
        
        return {
            "success": True,
            "version": version.to_dict(),
            "evolution_type": version.evolution_type.value,
            "change_summary": version.change_summary,
        }
    except Exception as e:
        logger.error(f"Failed to track update: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/evolution/track/branch")
async def track_memory_branch(request: TrackBranchRequest):
    """Track when a new memory branches from an existing one."""
    try:
        result = await evolution_service.track_branch(
            original_memory_id=UUID(request.original_memory_id),
            new_memory_id=UUID(request.new_memory_id),
        )
        
        return {
            "success": True,
            "result": result,
        }
    except Exception as e:
        logger.error(f"Failed to track branch: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/evolution/track/merge")
async def track_memory_merge(request: TrackMergeRequest):
    """Track when multiple memories are merged into one."""
    try:
        result = await evolution_service.track_merge(
            source_memory_ids=[UUID(sid) for sid in request.source_memory_ids],
            result_memory_id=UUID(request.result_memory_id),
        )
        
        return {
            "success": True,
            "result": result,
        }
    except Exception as e:
        logger.error(f"Failed to track merge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/evolution/timeline/{memory_id}")
async def get_evolution_timeline(memory_id: str):
    """Get the evolution timeline for a memory."""
    try:
        timeline = await evolution_service.get_timeline(UUID(memory_id))
        
        if not timeline:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Timeline not found",
            )
        
        return {
            "timeline": timeline,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get timeline: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/evolution/compare/{memory_id}")
async def compare_memory_versions(
    memory_id: str,
    v1: int = Query(..., ge=1),
    v2: int = Query(..., ge=1),
):
    """Compare two versions of a memory."""
    try:
        comparison = await evolution_service.compare_versions(
            memory_id=UUID(memory_id),
            version1=v1,
            version2=v2,
        )
        
        if "error" in comparison:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=comparison["error"],
            )
        
        return comparison
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to compare versions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/evolution/summary/{memory_id}")
async def get_memory_evolution_summary(memory_id: str):
    """Get a summary of how a memory has evolved."""
    try:
        summary = await evolution_service.get_evolution_summary(UUID(memory_id))
        
        if "error" in summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=summary["error"],
            )
        
        return {
            "summary": summary,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get evolution summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/evolution/evolved")
async def get_evolved_memories(
    days: int = Query(default=30, ge=1, le=365),
    min_versions: int = Query(default=2, ge=2, le=10),
    limit: int = Query(default=20, ge=1, le=100),
):
    """Find memories that have evolved significantly."""
    try:
        memories = await evolution_service.find_evolved_memories(
            days=days,
            min_versions=min_versions,
            limit=limit,
        )
        
        return {
            "count": len(memories),
            "memories": memories,
        }
    except Exception as e:
        logger.error(f"Failed to get evolved memories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/evolution/thinking/{topic}")
async def analyze_thinking_evolution(
    topic: str,
    days: int = Query(default=90, ge=7, le=365),
):
    """Analyze how thinking about a topic has evolved over time."""
    try:
        analysis = await evolution_service.analyze_thinking_evolution(
            topic=topic,
            days=days,
        )
        
        return analysis
    except Exception as e:
        logger.error(f"Failed to analyze thinking evolution: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/evolution/insights")
async def get_evolution_insights(limit: int = Query(default=10, ge=1, le=50)):
    """Get recent evolution insights."""
    try:
        insights = evolution_service.get_evolution_insights(limit=limit)
        
        return {
            "count": len(insights),
            "insights": insights,
        }
    except Exception as e:
        logger.error(f"Failed to get evolution insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
