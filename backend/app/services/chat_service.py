"""Chat history service — save, retrieve, and manage user chat sessions."""

from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from app.database import get_db
from app.models.chat import ChatMessage, ChatSession, ChatSessionResponse, ChatHistoryResponse


async def create_chat_session(user_id: str, project_id: Optional[str] = None) -> str:
    """Create a new chat session for a user. Returns session ID."""
    db = get_db()
    
    session_doc = {
        "user_id": user_id,
        "project_id": project_id,
        "messages": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "title": None,
    }
    
    result = await db.chat_sessions.insert_one(session_doc)
    return str(result.inserted_id)


async def add_message_to_session(
    session_id: str,
    role: str,
    content: str,
    sources: Optional[List[dict]] = None
) -> None:
    """Add a message to an existing chat session."""
    db = get_db()
    
    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow(),
        "sources": sources or []
    }
    
    # Simple approach: always push message, conditionally set title for first user message
    if role == "user":
        title = content[:60] + "..." if len(content) > 60 else content
        # Try to set title only if it doesn't exist (single atomic operation)
        result = await db.chat_sessions.update_one(
            {
                "_id": ObjectId(session_id),
                "title": {"$in": [None, ""]}  # Match if title is None or empty
            },
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.utcnow(), "title": title}
            }
        )
        
        # If title already exists (matched_count == 0), update without setting title
        if result.matched_count == 0:
            await db.chat_sessions.update_one(
                {"_id": ObjectId(session_id)},
                {
                    "$push": {"messages": message},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
    else:
        # For assistant messages, simple update
        await db.chat_sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )


async def get_user_chat_sessions(
    user_id: str,
    project_id: Optional[str] = None,
    limit: int = 50
) -> List[ChatSessionResponse]:
    """Get all chat sessions for a user, optionally filtered by project."""
    db = get_db()
    
    query = {"user_id": user_id}
    if project_id:
        query["project_id"] = project_id
    
    cursor = db.chat_sessions.find(query).sort("updated_at", -1).limit(limit)
    sessions = await cursor.to_list(length=limit)
    
    results = []
    for session in sessions:
        messages = session.get("messages", [])
        preview = None
        if messages:
            first_user_msg = next((m for m in messages if m.get("role") == "user"), None)
            if first_user_msg:
                preview = first_user_msg.get("content", "")[:80]
        
        results.append(ChatSessionResponse(
            id=str(session["_id"]),
            user_id=session["user_id"],
            project_id=session.get("project_id"),
            title=session.get("title"),
            message_count=len(messages),
            created_at=session["created_at"],
            updated_at=session["updated_at"],
            preview=preview
        ))
    
    return results


async def get_chat_session(session_id: str, user_id: str) -> Optional[ChatHistoryResponse]:
    """Get a specific chat session with all messages. Validates ownership."""
    db = get_db()
    
    session = await db.chat_sessions.find_one({
        "_id": ObjectId(session_id),
        "user_id": user_id  # Ensure user owns this session
    })
    
    if not session:
        return None
    
    messages = [
        ChatMessage(
            role=m.get("role"),
            content=m.get("content"),
            timestamp=m.get("timestamp"),
            sources=m.get("sources")
        )
        for m in session.get("messages", [])
    ]
    
    return ChatHistoryResponse(
        id=str(session["_id"]),
        user_id=session["user_id"],
        project_id=session.get("project_id"),
        title=session.get("title"),
        messages=messages,
        created_at=session["created_at"],
        updated_at=session["updated_at"]
    )


async def delete_chat_session(session_id: str, user_id: str) -> bool:
    """Delete a chat session. Returns True if deleted, False if not found/unauthorized."""
    db = get_db()
    
    result = await db.chat_sessions.delete_one({
        "_id": ObjectId(session_id),
        "user_id": user_id
    })
    
    return result.deleted_count > 0


async def get_or_create_active_session(
    user_id: str,
    project_id: Optional[str] = None
) -> str:
    """
    Get the most recent active session for a user/project, or create a new one.
    Sessions are considered 'active' if updated within the last hour.
    """
    db = get_db()
    
    query = {"user_id": user_id}
    if project_id:
        query["project_id"] = project_id
    
    # Find most recent session
    session = await db.chat_sessions.find_one(
        query,
        sort=[("updated_at", -1)]
    )
    
    # If recent session exists (within last hour), reuse it
    if session:
        time_diff = datetime.utcnow() - session["updated_at"]
        if time_diff.total_seconds() < 3600:  # 1 hour
            return str(session["_id"])
    
    # Create new session
    return await create_chat_session(user_id, project_id)
