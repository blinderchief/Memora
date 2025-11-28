"""
Service for managing chat sessions and messages.
"""

import logging
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import delete, desc, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import ActivityLog, ChatMessage, ChatSession, DBUser

logger = logging.getLogger(__name__)


class ChatService:
    """Service for managing chat history."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def _ensure_user_exists(self, user_id: str) -> None:
        """Ensure the user exists in the database, create if not."""
        try:
            result = await self.db.execute(
                select(DBUser).where(DBUser.id == user_id)
            )
            user = result.scalar_one_or_none()

            if not user:
                # Create a placeholder user - will be updated when Clerk webhook fires
                new_user = DBUser(
                    id=user_id,
                    email=f"{user_id}@placeholder.local",  # Placeholder email
                    first_name="User",
                    last_name="",
                )
                self.db.add(new_user)
                await self.db.commit()
                logger.info(f"Created placeholder user: {user_id}")
        except IntegrityError as e:
            # User might already exist due to concurrent request or email conflict
            await self.db.rollback()
            logger.warning(f"User creation failed (may already exist): {e}")
            # Verify user exists after rollback
            result = await self.db.execute(
                select(DBUser).where(DBUser.id == user_id)
            )
            if not result.scalar_one_or_none():
                raise ValueError(f"Failed to create or find user: {user_id}")
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error ensuring user exists: {e}")
            raise

    # ============== Sessions ==============
    
    async def create_session(self, user_id: str, title: str = "New Chat") -> ChatSession:
        """Create a new chat session."""
        logger.info(f"Creating chat session for user: {user_id}")

        # Ensure user exists first to satisfy foreign key constraint
        await self._ensure_user_exists(user_id)
        logger.info(f"User ensured: {user_id}")

        session = ChatSession(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=title
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        logger.info(f"Created chat session: {session.id}")

        # Log activity
        await self._log_activity(user_id, "chat_session_created", {"session_id": session.id})
        
        return session
    
    async def get_sessions(
        self, 
        user_id: str, 
        limit: int = 50, 
        include_archived: bool = False
    ) -> List[ChatSession]:
        """Get chat sessions for a user."""
        query = select(ChatSession).where(
            ChatSession.user_id == user_id
        ).order_by(desc(ChatSession.updated_at)).limit(limit)
        
        if not include_archived:
            query = query.where(ChatSession.is_archived == False)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_session(self, session_id: str, user_id: str) -> Optional[ChatSession]:
        """Get a specific chat session."""
        query = select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def update_session_title(self, session_id: str, user_id: str, title: str) -> bool:
        """Update session title."""
        query = update(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        ).values(title=title, updated_at=datetime.utcnow())
        
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    async def archive_session(self, session_id: str, user_id: str) -> bool:
        """Archive a chat session."""
        query = update(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        ).values(is_archived=True, updated_at=datetime.utcnow())
        
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    async def delete_session(self, session_id: str, user_id: str) -> bool:
        """Delete a chat session and all its messages."""
        # Messages will be cascade deleted
        query = delete(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        )
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    # ============== Messages ==============
    
    async def add_message(
        self,
        session_id: str,
        user_id: str,
        role: str,
        content: str,
        sources: Optional[List[dict]] = None,
        confidence: Optional[float] = None
    ) -> ChatMessage:
        """Add a message to a chat session."""
        message = ChatMessage(
            id=str(uuid.uuid4()),
            session_id=session_id,
            user_id=user_id,
            role=role,
            content=content,
            sources=sources,
            confidence=confidence
        )
        self.db.add(message)
        
        # Update session timestamp
        await self.db.execute(
            update(ChatSession).where(
                ChatSession.id == session_id
            ).values(updated_at=datetime.utcnow())
        )
        
        await self.db.commit()
        await self.db.refresh(message)
        
        return message
    
    async def add_message_pair(
        self,
        session_id: str,
        user_id: str,
        user_message: str,
        assistant_message: str,
        sources: Optional[List[dict]] = None,
        confidence: Optional[float] = None
    ) -> tuple[ChatMessage, ChatMessage]:
        """Add both user and assistant messages at once."""
        user_msg = ChatMessage(
            id=str(uuid.uuid4()),
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=user_message
        )
        
        assistant_msg = ChatMessage(
            id=str(uuid.uuid4()),
            session_id=session_id,
            user_id=user_id,
            role="assistant",
            content=assistant_message,
            sources=sources,
            confidence=confidence
        )
        
        self.db.add(user_msg)
        self.db.add(assistant_msg)
        
        # Update session timestamp
        await self.db.execute(
            update(ChatSession).where(
                ChatSession.id == session_id
            ).values(updated_at=datetime.utcnow())
        )
        
        await self.db.commit()
        await self.db.refresh(user_msg)
        await self.db.refresh(assistant_msg)
        
        # Log activity
        await self._log_activity(user_id, "chat_message", {
            "session_id": session_id,
            "has_sources": sources is not None and len(sources) > 0
        })
        
        return user_msg, assistant_msg
    
    async def get_messages(
        self, 
        session_id: str, 
        user_id: str,
        limit: int = 100
    ) -> List[ChatMessage]:
        """Get messages for a chat session."""
        query = select(ChatMessage).where(
            ChatMessage.session_id == session_id,
            ChatMessage.user_id == user_id
        ).order_by(ChatMessage.created_at).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_recent_messages(
        self, 
        user_id: str, 
        limit: int = 10
    ) -> List[ChatMessage]:
        """Get recent messages across all sessions."""
        query = select(ChatMessage).where(
            ChatMessage.user_id == user_id
        ).order_by(desc(ChatMessage.created_at)).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    # ============== Activity Logging ==============
    
    async def _log_activity(self, user_id: str, action: str, details: Optional[dict] = None):
        """Log user activity."""
        try:
            log = ActivityLog(
                id=str(uuid.uuid4()),
                user_id=user_id,
                action=action,
                details=details or {}
            )
            self.db.add(log)
            await self.db.commit()
        except Exception as e:
            logger.warning(f"Failed to log activity: {e}")
