"""
API routes for chat sessions and history.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["Chat"])


# ============== Schemas ==============

class CreateSessionRequest(BaseModel):
    title: Optional[str] = "New Chat"


class UpdateSessionRequest(BaseModel):
    title: str


class AddMessageRequest(BaseModel):
    role: str  # user or assistant
    content: str
    sources: Optional[List[dict]] = None
    confidence: Optional[float] = None


class ChatSessionResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    is_archived: bool
    
    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    sources: Optional[List[dict]] = None
    confidence: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== Helper ==============

def get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """Get user ID from header or use demo user."""
    return x_user_id or "demo-user"


# ============== Routes ==============

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    limit: int = Query(default=50, le=100),
    include_archived: bool = Query(default=False),
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all chat sessions for the current user."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ChatService(db)
    sessions = await service.get_sessions(user_id, limit, include_archived)
    return sessions


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    request: CreateSessionRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new chat session."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ChatService(db)
    session = await service.create_session(user_id, request.title or "New Chat")
    return session


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific chat session."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ChatService(db)
    session = await service.get_session(session_id, user_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session


@router.patch("/sessions/{session_id}")
async def update_chat_session(
    session_id: str,
    request: UpdateSessionRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update a chat session title."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ChatService(db)
    success = await service.update_session_title(session_id, user_id, request.title)
    
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"success": True}


@router.post("/sessions/{session_id}/archive")
async def archive_chat_session(
    session_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Archive a chat session."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ChatService(db)
    success = await service.archive_session(session_id, user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"success": True}


@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete a chat session and all messages."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ChatService(db)
    success = await service.delete_session(session_id, user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"success": True}


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_chat_messages(
    session_id: str,
    limit: int = Query(default=100, le=500),
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all messages in a chat session."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    service = ChatService(db)
    
    # Verify session exists and belongs to user
    session = await service.get_session(session_id, user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = await service.get_messages(session_id, user_id, limit)
    return messages


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def add_chat_message(
    session_id: str,
    request: AddMessageRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Add a message to a chat session."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    if request.role not in ["user", "assistant"]:
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'assistant'")
    
    service = ChatService(db)
    
    # Verify session exists
    session = await service.get_session(session_id, user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    message = await service.add_message(
        session_id, user_id, request.role, request.content, 
        request.sources, request.confidence
    )
    return message
