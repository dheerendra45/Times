"""Async Redis client with caching, rate-limiting, and session utilities.

Redis is OPTIONAL. If REDIS_URL is not set or the connection fails the app
starts normally — caching, rate-limiting and session storage are silently
skipped so every call degrades gracefully.
"""

import json
from typing import Optional
from app.config import settings

_redis = None  # redis.asyncio.Redis | None
_redis_available: bool = False


async def connect_redis() -> None:
    """Try to connect to Redis. Logs a warning and continues if unavailable."""
    global _redis, _redis_available

    if not settings.REDIS_URL:
        print("⚠️  REDIS_URL not set — Redis features disabled (caching/sessions/rate-limits)")
        return

    try:
        import redis.asyncio as aioredis
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
        await _redis.ping()
        _redis_available = True
        print("✅ Redis connected")
    except Exception as e:
        _redis = None
        _redis_available = False
        print(f"⚠️  Redis unavailable ({e}) — caching/sessions/rate-limits disabled")


async def close_redis() -> None:
    """Close the Redis connection if open."""
    global _redis, _redis_available
    if _redis:
        await _redis.aclose()
        _redis_available = False
        print("🔌 Redis connection closed")


def get_redis():
    """Return the Redis instance, or None if Redis is not available."""
    return _redis if _redis_available else None


# ═══════════════════════════════════════════════════════════════════
# Cache helpers
# ═══════════════════════════════════════════════════════════════════

async def set_with_ttl(key: str, value, ttl_seconds: int = 300) -> None:
    """Set a JSON-serialized value with TTL. No-op if Redis unavailable."""
    r = get_redis()
    if r is None:
        return
    await r.setex(key, ttl_seconds, json.dumps(value, default=str))


async def get_cached(key: str) -> Optional[dict]:
    """Get and deserialize a cached value. Returns None on miss or no Redis."""
    r = get_redis()
    if r is None:
        return None
    data = await r.get(key)
    if data:
        return json.loads(data)
    return None


async def invalidate_pattern(pattern: str) -> int:
    """Delete all keys matching a glob pattern using SCAN. Returns 0 if no Redis."""
    r = get_redis()
    if r is None:
        return 0
    deleted = 0
    async for key in r.scan_iter(match=pattern, count=100):
        await r.delete(key)
        deleted += 1
    return deleted


# ═══════════════════════════════════════════════════════════════════
# Rate limiting
# ═══════════════════════════════════════════════════════════════════

async def increment_counter(key: str, window_seconds: int = 60) -> int:
    """Increment a sliding-window counter. Returns 0 if Redis unavailable."""
    r = get_redis()
    if r is None:
        return 0  # always allow when Redis is down
    pipe = r.pipeline()
    pipe.incr(key)
    pipe.expire(key, window_seconds)
    results = await pipe.execute()
    return results[0]


async def check_rate_limit(identifier: str, prefix: str, max_requests: int, window: int = 60) -> bool:
    """
    Check and enforce a rate limit.
    Returns True (ALLOWED) if Redis is unavailable (fail-open) or under the limit.
    """
    r = get_redis()
    if r is None:
        return True  # fail-open: no Redis → no rate limiting
    key = f"rate:{prefix}:{identifier}"
    count = await increment_counter(key, window)
    return count <= max_requests


# ═══════════════════════════════════════════════════════════════════
# Session management
# ═══════════════════════════════════════════════════════════════════

async def store_session(user_id: str, session_id: str, data: dict, ttl_days: int = 7) -> None:
    """Store a user session with sliding TTL. No-op if Redis unavailable."""
    r = get_redis()
    if r is None:
        return
    key = f"session:{user_id}:{session_id}"
    await r.setex(key, ttl_days * 86400, json.dumps(data, default=str))


async def get_session(user_id: str, session_id: str) -> Optional[dict]:
    """Retrieve and refresh a session (sliding window). Returns None if no Redis."""
    r = get_redis()
    if r is None:
        return None
    key = f"session:{user_id}:{session_id}"
    data = await r.get(key)
    if data:
        # Slide the TTL on access
        await r.expire(key, 7 * 86400)
        return json.loads(data)
    return None


async def delete_session(user_id: str, session_id: str) -> None:
    """Delete a specific session. No-op if Redis unavailable."""
    r = get_redis()
    if r is None:
        return
    key = f"session:{user_id}:{session_id}"
    await r.delete(key)


async def delete_all_sessions(user_id: str) -> int:
    """Delete all sessions for a user. Returns 0 if no Redis."""
    return await invalidate_pattern(f"session:{user_id}:*")
