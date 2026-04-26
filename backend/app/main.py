"""FastAPI application entry point."""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import connect_db, close_db
from app.redis_client import connect_redis, close_redis
from app.routes import projects, analytics, genai


async def _warmup_faiss_index() -> None:
    """Build FAISS index in the background so startup stays fast."""
    try:
        from app.services.genai_service import build_faiss_index

        await build_faiss_index()
    except Exception as e:
        print(f"⚠️  FAISS background warmup skipped: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle events."""
    # ── Startup ──
    db_ready = False
    try:
        await asyncio.wait_for(connect_db(), timeout=12)
        db_ready = True
    except Exception as e:
        # Do not block boot on external DB issues; service can still come up.
        print(f"⚠️  MongoDB startup skipped: {e}")

    await connect_redis()  # optional — warns and continues if unavailable

    # Warm FAISS asynchronously so startup can complete and bind port quickly.
    if db_ready:
        asyncio.create_task(_warmup_faiss_index())

    print("🚀 Hackathon Portal API is ready")
    yield

    # ── Shutdown ──
    await close_db()
    await close_redis()
    print("👋 Hackathon Portal API shut down")


app = FastAPI(
    title="Hackathon Management Portal API",
    description="AI-powered hackathon project management with RAG chat capabilities",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ──
app.include_router(projects.router)
app.include_router(analytics.router)
app.include_router(genai.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "hackathon-portal-api"}
