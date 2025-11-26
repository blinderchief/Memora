"""User models for Memora."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user model."""
    
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    image_url: Optional[str] = None


class UserCreate(UserBase):
    """Model for creating a user from Clerk webhook."""
    
    clerk_id: str = Field(..., description="Clerk user ID")


class UserUpdate(BaseModel):
    """Model for updating a user."""
    
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    image_url: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class User(UserBase):
    """Full user model stored in database."""
    
    id: str = Field(..., description="Internal user ID (UUID)")
    clerk_id: str = Field(..., description="Clerk user ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        """Pydantic config."""
        
        from_attributes = True


class UserResponse(BaseModel):
    """User response model for API."""
    
    id: str
    clerk_id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        parts = [self.first_name, self.last_name]
        return " ".join(filter(None, parts)) or self.email


class WebhookEvent(BaseModel):
    """Model for Clerk webhook events."""
    
    type: str
    data: dict
