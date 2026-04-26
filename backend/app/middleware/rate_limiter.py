"""Rate limiting middleware - simplified without Redis."""

from fastapi import Request


async def rate_limit_login(request: Request) -> None:
    """Placeholder - rate limiting disabled."""
    pass


async def rate_limit_projects(request: Request, user: dict = None) -> None:
    """Placeholder - rate limiting disabled."""
    pass


async def rate_limit_chat(user_id: str) -> None:
    """Placeholder - rate limiting disabled."""
    pass
