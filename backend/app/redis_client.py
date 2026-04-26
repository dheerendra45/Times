"""Async Redis client with caching, rate-limiting, and session utilities."""

import json
import redis.asyncio as aioredis
from app.config import settings

_redis: aioredis.Redis | None = None


async def connect_redis() -> None:
    """Initialize the async Redis connection pool."""
    global _redis
    _redis = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
        max_connections=20,
    )
    await _redis.ping()
    print("✅ Redis connected")


async def close_redis() -> None:
    """Close the Redis connection."""
    global _redis
    if _redis:
        await _redis.close()
        print("🔌 Redis connection closed")


def get_redis() -> aioredis.Redis:
    """Return the current Redis instance."""
    if _redis is None:
        raise RuntimeError("Redis not initialized. Call connect_redis() first.")
    return _redis


# ═══════════════════════════════════════════════════════════════════
# Cache helpers
# ═══════════════════════════════════════════════════════════════════

async def set_with_ttl(key: str, value: any, ttl_seconds: int = 300) -> None:
    """Set a JSON-serialized value with TTL."""
    r = get_redis()
    await r.setex(key, ttl_seconds, json.dumps(value, default=str))


async def get_cached(key: str):
    """Get and deserialize a cached value. Returns None on miss."""
    r = get_redis()
    data = await r.get(key)
    if data:
        return json.loads(data)
    return None


async def invalidate_pattern(pattern: str) -> int:
    """Delete all keys matching a glob pattern using SCAN (non-blocking)."""
    r = get_redis()
    deleted = 0
    async for key in r.scan_iter(match=pattern, count=100):
        await r.delete(key)
        deleted += 1
    return deleted


# ═══════════════════════════════════════════════════════════════════
# Rate limiting
# ═══════════════════════════════════════════════════════════════════

async def increment_counter(key: str, window_seconds: int = 60) -> int:
    """Increment a sliding-window counter. Returns current count."""
    r = get_redis()
    pipe = r.pipeline()
    pipe.incr(key)
    pipe.expire(key, window_seconds)
    results = await pipe.execute()
    return results[0]


async def check_rate_limit(identifier: str, prefix: str, max_requests: int, window: int = 60) -> bool:
    """
    Check and enforce a rate limit.
    Returns True if the request is ALLOWED, False if rate-limited.
    """
    key = f"rate:{prefix}:{identifier}"
    count = await increment_counter(key, window)
    return count <= max_requests


# ═══════════════════════════════════════════════════════════════════
# Session management
# ═══════════════════════════════════════════════════════════════════

async def store_session(user_id: str, session_id: str, data: dict, ttl_days: int = 7) -> None:
    """Store a user session with sliding TTL."""
    r = get_redis()
    key = f"session:{user_id}:{session_id}"
    await r.setex(key, ttl_days * 86400, json.dumps(data, default=str))


async def get_session(user_id: str, session_id: str) -> dict | None:
    """Retrieve and refresh a session (sliding window)."""
    r = get_redis()
    key = f"session:{user_id}:{session_id}"
    data = await r.get(key)
    if data:
        # Slide the TTL on access
        await r.expire(key, 7 * 86400)
        return json.loads(data)
    return None


async def delete_session(user_id: str, session_id: str) -> None:
    """Delete a specific session."""
    r = get_redis()
    key = f"session:{user_id}:{session_id}"
    await r.delete(key)


async def delete_all_sessions(user_id: str) -> int:
    """Delete all sessions for a user."""
    return await invalidate_pattern(f"session:{user_id}:*")
