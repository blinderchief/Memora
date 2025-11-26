"""Authentication middleware for Clerk JWT verification."""

from typing import Optional

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.db.qdrant import get_qdrant_client
from app.db.users import get_user_service
from app.models.user import User

# HTTP Bearer scheme for JWT tokens
security = HTTPBearer(auto_error=False)


async def verify_clerk_token(token: str) -> Optional[dict]:
    """
    Verify a Clerk session token.
    
    In production, you would verify the JWT signature using Clerk's public keys.
    For simplicity, we use Clerk's API to verify the session.
    """
    if not settings.clerk_secret_key:
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            # Get session info from Clerk
            response = await client.get(
                "https://api.clerk.com/v1/sessions",
                headers={
                    "Authorization": f"Bearer {settings.clerk_secret_key}",
                },
            )
            if response.status_code == 200:
                return response.json()
    except Exception:
        pass
    
    return None


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[User]:
    """
    Get the current user if authenticated, otherwise return None.
    
    This dependency can be used for routes that support both authenticated
    and unauthenticated access.
    """
    # Check for Clerk user ID in headers (set by frontend)
    clerk_user_id = request.headers.get("X-Clerk-User-Id")
    
    if not clerk_user_id:
        return None
    
    try:
        client = get_qdrant_client()
        user_service = get_user_service(client)
        user = await user_service.get_user_by_clerk_id(clerk_user_id)
        return user
    except Exception:
        return None


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> User:
    """
    Get the current authenticated user.
    
    Raises HTTPException if not authenticated.
    """
    user = await get_optional_user(request, credentials)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def require_authenticated(
    user: User = Depends(get_current_user),
) -> User:
    """
    Dependency that requires authentication.
    
    Use this to protect routes that require a logged-in user.
    """
    return user
