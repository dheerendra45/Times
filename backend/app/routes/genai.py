"""GenAI routes — RAG chat via SSE, suggested questions, index rebuild, chat history."""

from fastapi import APIRouter, HTTPException, Query, status, Depends
from fastapi.responses import StreamingResponse
from typing import Optional
from pydantic import BaseModel

from app.services.genai_service import (
    stream_rag_response,
    get_suggested_questions,
    build_faiss_index,
)
from app.services.chat_service import (
    get_user_chat_sessions,
    get_chat_session,
    delete_chat_session,
    get_or_create_active_session,
    add_message_to_session,
)
from app.middleware.rate_limiter import rate_limit_chat
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/genai", tags=["GenAI"])


class ChatRequest(BaseModel):
    query: str
    project_context: Optional[str] = None
    history: Optional[list[dict[str, str]]] = None
    session_id: Optional[str] = None  # Optional session to continue
    project_id: Optional[str] = None  # Optional project context


@router.post("/chat")
async def chat(
    data: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """RAG-powered chat endpoint with SSE streaming and history persistence."""
    await rate_limit_chat(current_user["user_id"])

    if not data.query or len(data.query.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query must be at least 2 characters",
        )

    # Get or create session
    session_id = data.session_id or await get_or_create_active_session(
        current_user["user_id"],
        data.project_id
    )

    # Save user message to database
    await add_message_to_session(session_id, "user", data.query)

    return StreamingResponse(
        stream_rag_response(
            data.query,
            data.project_context,
            data.history,
            session_id,
            current_user["user_id"]
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Session-ID": session_id,  # Return session ID in header
        },
    )


@router.get("/suggestions")
async def suggestions(project_id: Optional[str] = Query(None)):
    """Get suggested questions, optionally context-aware for a specific project."""
    return await get_suggested_questions(project_id)


@router.post("/rebuild-index")
async def rebuild_index():
    """Rebuild the FAISS index from current MongoDB data."""
    try:
        count = await build_faiss_index()
        return {"message": f"FAISS index rebuilt with {count} projects"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rebuild index: {str(e)}",
        )


@router.get("/chat/sessions")
async def get_sessions(
    project_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get all chat sessions for the current user."""
    sessions = await get_user_chat_sessions(
        current_user["user_id"],
        project_id
    )
    return sessions


@router.get("/chat/sessions/{session_id}")
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific chat session with all messages."""
    session = await get_chat_session(session_id, current_user["user_id"])
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or unauthorized"
        )
    return session


@router.delete("/chat/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a chat session."""
    success = await delete_chat_session(session_id, current_user["user_id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or unauthorized"
        )
    return {"message": "Session deleted successfully"}
