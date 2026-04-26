"""GenAI routes — RAG chat via SSE, suggested questions, index rebuild."""

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from typing import Optional
from pydantic import BaseModel

from app.services.genai_service import (
    stream_rag_response,
    get_suggested_questions,
    build_faiss_index,
)
from app.middleware.rate_limiter import rate_limit_chat

router = APIRouter(prefix="/api/genai", tags=["GenAI"])


class ChatRequest(BaseModel):
    query: str
    project_context: Optional[str] = None


@router.post("/chat")
async def chat(data: ChatRequest):
    """RAG-powered chat endpoint with SSE streaming."""
    await rate_limit_chat("anonymous")

    if not data.query or len(data.query.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query must be at least 2 characters",
        )

    return StreamingResponse(
        stream_rag_response(data.query, data.project_context),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
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
