"""User database operations for Memora."""

import uuid
from datetime import datetime
from typing import Optional, List

from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models
from qdrant_client.http.exceptions import UnexpectedResponse

from app.config import settings
from app.models.user import User, UserCreate, UserUpdate

# Collection name for users
USERS_COLLECTION = "memora_users"


class UserService:
    """Service for managing user data in Qdrant."""
    
    def __init__(self, client: QdrantClient):
        """Initialize user service with Qdrant client."""
        self.client = client
        self._ensure_collection()
    
    def _ensure_collection(self) -> None:
        """Ensure the users collection exists."""
        try:
            self.client.get_collection(USERS_COLLECTION)
        except (UnexpectedResponse, Exception):
            # Create collection for users (no vectors needed, just payload storage)
            self.client.create_collection(
                collection_name=USERS_COLLECTION,
                vectors_config={
                    # Dummy vector config since Qdrant requires vectors
                    "default": qdrant_models.VectorParams(
                        size=1,
                        distance=qdrant_models.Distance.COSINE,
                    )
                },
            )
            # Create payload index for efficient querying
            self.client.create_payload_index(
                collection_name=USERS_COLLECTION,
                field_name="clerk_id",
                field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
            )
            self.client.create_payload_index(
                collection_name=USERS_COLLECTION,
                field_name="email",
                field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
            )
    
    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user."""
        user_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        user = User(
            id=user_id,
            clerk_id=user_data.clerk_id,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            image_url=user_data.image_url,
            created_at=now,
            updated_at=now,
        )
        
        # Store in Qdrant
        self.client.upsert(
            collection_name=USERS_COLLECTION,
            points=[
                qdrant_models.PointStruct(
                    id=user_id,
                    vector={"default": [0.0]},  # Dummy vector
                    payload=user.model_dump(mode="json"),
                )
            ],
        )
        
        return user
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get a user by their internal ID."""
        try:
            points = self.client.retrieve(
                collection_name=USERS_COLLECTION,
                ids=[user_id],
                with_payload=True,
            )
            if points:
                return User(**points[0].payload)
        except Exception:
            pass
        return None
    
    async def get_user_by_clerk_id(self, clerk_id: str) -> Optional[User]:
        """Get a user by their Clerk ID."""
        try:
            results = self.client.scroll(
                collection_name=USERS_COLLECTION,
                scroll_filter=qdrant_models.Filter(
                    must=[
                        qdrant_models.FieldCondition(
                            key="clerk_id",
                            match=qdrant_models.MatchValue(value=clerk_id),
                        )
                    ]
                ),
                limit=1,
                with_payload=True,
            )
            points, _ = results
            if points:
                return User(**points[0].payload)
        except Exception:
            pass
        return None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by their email."""
        try:
            results = self.client.scroll(
                collection_name=USERS_COLLECTION,
                scroll_filter=qdrant_models.Filter(
                    must=[
                        qdrant_models.FieldCondition(
                            key="email",
                            match=qdrant_models.MatchValue(value=email),
                        )
                    ]
                ),
                limit=1,
                with_payload=True,
            )
            points, _ = results
            if points:
                return User(**points[0].payload)
        except Exception:
            pass
        return None
    
    async def update_user(self, clerk_id: str, update_data: UserUpdate) -> Optional[User]:
        """Update a user by their Clerk ID."""
        user = await self.get_user_by_clerk_id(clerk_id)
        if not user:
            return None
        
        # Update fields
        update_dict = update_data.model_dump(exclude_unset=True)
        update_dict["updated_at"] = datetime.utcnow()
        
        for key, value in update_dict.items():
            if value is not None:
                setattr(user, key, value)
        
        # Store updated user
        self.client.upsert(
            collection_name=USERS_COLLECTION,
            points=[
                qdrant_models.PointStruct(
                    id=user.id,
                    vector={"default": [0.0]},
                    payload=user.model_dump(mode="json"),
                )
            ],
        )
        
        return user
    
    async def delete_user(self, clerk_id: str) -> bool:
        """Delete a user by their Clerk ID."""
        user = await self.get_user_by_clerk_id(clerk_id)
        if not user:
            return False
        
        self.client.delete(
            collection_name=USERS_COLLECTION,
            points_selector=qdrant_models.PointIdsList(
                points=[user.id],
            ),
        )
        return True
    
    async def list_users(self, limit: int = 100, offset: int = 0) -> List[User]:
        """List all users."""
        try:
            results = self.client.scroll(
                collection_name=USERS_COLLECTION,
                limit=limit,
                offset=offset,
                with_payload=True,
            )
            points, _ = results
            return [User(**point.payload) for point in points]
        except Exception:
            return []


# Global user service instance (initialized lazily)
_user_service: Optional[UserService] = None


def get_user_service(client: QdrantClient) -> UserService:
    """Get or create the user service instance."""
    global _user_service
    if _user_service is None:
        _user_service = UserService(client)
    return _user_service
