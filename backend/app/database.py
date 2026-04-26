"""Async MongoDB connection via Motor."""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    """Initialize the MongoDB connection and create indexes."""
    global _client, _db
    _client = AsyncIOMotorClient(
        settings.MONGO_URI,
        serverSelectionTimeoutMS=8000,
        connectTimeoutMS=8000,
        socketTimeoutMS=8000,
    )
    _db = _client[settings.MONGO_DB]

    # Fail fast if Mongo is unreachable to avoid hanging startup.
    await _client.admin.command("ping")

    # ── Create indexes ──
    await _db.users.create_index("email", unique=True)
    await _db.users.create_index("username", unique=True)
    await _db.projects.create_index([("title", "text"), ("problem_statement", "text"), ("solution", "text")])
    await _db.projects.create_index("domain")
    await _db.projects.create_index("tech_stack")
    await _db.projects.create_index("award")

    print("✅ MongoDB connected and indexes ensured")


async def close_db() -> None:
    """Close the MongoDB connection."""
    global _client
    if _client:
        _client.close()
        print("🔌 MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    """Return the current database instance."""
    if _db is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    return _db
