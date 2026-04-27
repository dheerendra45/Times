"""Chat history model schemas for storing user conversations."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class ChatMessage(BaseModel):
    """Single message in a chat conversation."""
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    sources: Optional[List[dict]] = None


class ChatSession(BaseModel):
    """A chat session with multiple messages."""
    user_id: str
    project_id: Optional[str] = None  # Optional project context
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    title: Optional[str] = None  # Auto-generated from first message


class ChatSessionResponse(BaseModel):
    """Response model for chat session."""
    id: str
    user_id: str
    project_id: Optional[str] = None
    title: Optional[str] = None
    message_count: int
    created_at: datetime
    updated_at: datetime
    preview: Optional[str] = None  # First user message preview

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class ChatHistoryResponse(BaseModel):
    """Full chat history with messages."""
    id: str
    user_id: str
    project_id: Optional[str] = None
    title: Optional[str] = None
    messages: List[ChatMessage]
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
