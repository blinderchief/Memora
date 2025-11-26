"""User API routes for Memora."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel

from app.db.qdrant import get_qdrant_client
from app.db.users import get_user_service, UserService
from app.models.user import UserCreate, UserUpdate, UserResponse, User
from app.config import settings

router = APIRouter(prefix="/users", tags=["users"])


# Dependency to get user service
def get_user_svc() -> UserService:
    """Get user service dependency."""
    client = get_qdrant_client()
    return get_user_service(client)


class WebhookPayload(BaseModel):
    """Webhook payload from Clerk."""
    
    type: str
    data: dict


class SyncUserRequest(BaseModel):
    """Request model for syncing a user from Clerk."""
    
    clerk_id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    image_url: Optional[str] = None


class DeleteUserRequest(BaseModel):
    """Request model for deleting a user."""
    
    clerk_id: str


@router.post("/sync", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def sync_user(
    request: SyncUserRequest,
    user_service: UserService = Depends(get_user_svc),
):
    """
    Sync a user from Clerk.
    
    Creates the user if they don't exist, otherwise updates their info.
    Called by the frontend webhook handler.
    """
    # Check if user exists
    existing_user = await user_service.get_user_by_clerk_id(request.clerk_id)
    
    if existing_user:
        # Update existing user
        update_data = UserUpdate(
            email=request.email,
            first_name=request.first_name,
            last_name=request.last_name,
            image_url=request.image_url,
        )
        user = await user_service.update_user(request.clerk_id, update_data)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user",
            )
    else:
        # Create new user
        user_data = UserCreate(
            clerk_id=request.clerk_id,
            email=request.email,
            first_name=request.first_name,
            last_name=request.last_name,
            image_url=request.image_url,
        )
        user = await user_service.create_user(user_data)
    
    return UserResponse(
        id=user.id,
        clerk_id=user.clerk_id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        image_url=user.image_url,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.delete("/sync", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    request: DeleteUserRequest,
    user_service: UserService = Depends(get_user_svc),
):
    """
    Delete a user.
    
    Called by the frontend webhook handler when a user is deleted in Clerk.
    """
    deleted = await user_service.delete_user(request.clerk_id)
    if not deleted:
        # User might not exist, which is fine for delete operations
        pass
    return None


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    user_service: UserService = Depends(get_user_svc),
):
    """
    Get the current authenticated user's info.
    
    The Clerk user ID should be passed in the X-Clerk-User-Id header.
    """
    if not x_clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    user = await user_service.get_user_by_clerk_id(x_clerk_user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return UserResponse(
        id=user.id,
        clerk_id=user.clerk_id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        image_url=user.image_url,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.get("/{clerk_id}", response_model=UserResponse)
async def get_user_by_clerk_id(
    clerk_id: str,
    user_service: UserService = Depends(get_user_svc),
):
    """Get a user by their Clerk ID."""
    user = await user_service.get_user_by_clerk_id(clerk_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return UserResponse(
        id=user.id,
        clerk_id=user.clerk_id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        image_url=user.image_url,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )
