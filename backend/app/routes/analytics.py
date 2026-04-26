"""Analytics routes — dashboard statistics."""

from fastapi import APIRouter
from app.services.analytics_service import get_dashboard_stats

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def dashboard():
    """Get dashboard statistics. Public endpoint, cached 60 seconds."""
    return await get_dashboard_stats()
