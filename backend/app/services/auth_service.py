"""Authentication service — register, login, refresh, logout."""

from datetime import datetime
from bson import ObjectId

from app.database import get_db
from app.redis_client import store_session, get_session, delete_session, delete_all_sessions
from app.middleware.auth_middleware import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import UserRegister, UserResponse


async def register_user(data: UserRegister) -> dict:
    """Register a new user. Returns user dict and tokens."""
    db = get_db()

    # Check existing email
    if await db.users.find_one({"email": data.email}):
        raise ValueError("Email already registered")

    # Check existing username
    if await db.users.find_one({"username": data.username}):
        raise ValueError("Username already taken")

    now = datetime.utcnow()
    user_doc = {
        "username": data.username,
        "email": data.email,
        "full_name": data.full_name,
        "hashed_password": hash_password(data.password),
        "created_at": now,
        "updated_at": now,
        "is_active": True,
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Create tokens
    access_token = create_access_token(user_id, data.email)
    refresh_token, session_id = create_refresh_token(user_id)

    # Store session in Redis
    await store_session(user_id, session_id, {
        "email": data.email,
        "username": data.username,
        "created_at": now.isoformat(),
    })

    user_response = UserResponse(
        id=user_id,
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        created_at=now,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user_response,
    }


async def login_user(email: str, password: str) -> dict:
    """Authenticate user and return tokens."""
    db = get_db()
    user = await db.users.find_one({"email": email})

    if not user or not verify_password(password, user["hashed_password"]):
        raise ValueError("Invalid email or password")

    if not user.get("is_active", True):
        raise ValueError("Account is deactivated")

    user_id = str(user["_id"])

    # Create tokens
    access_token = create_access_token(user_id, email)
    refresh_token, session_id = create_refresh_token(user_id)

    # Store session in Redis
    await store_session(user_id, session_id, {
        "email": email,
        "username": user["username"],
        "created_at": datetime.utcnow().isoformat(),
    })

    user_response = UserResponse(
        id=user_id,
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        created_at=user["created_at"],
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user_response,
    }


async def refresh_access_token(refresh_token_str: str) -> dict:
    """Validate refresh token, check Redis session, and issue new access token."""
    payload = decode_token(refresh_token_str)

    if payload.get("type") != "refresh":
        raise ValueError("Invalid token type")

    user_id = payload.get("sub")
    session_id = payload.get("sid")

    if not user_id or not session_id:
        raise ValueError("Invalid token payload")

    # Check session in Redis (also slides TTL)
    session = await get_session(user_id, session_id)
    if not session:
        raise ValueError("Session expired or invalidated")

    # Get user from DB
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ValueError("User not found")

    # Issue new access token
    access_token = create_access_token(user_id, user["email"])

    user_response = UserResponse(
        id=user_id,
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        created_at=user["created_at"],
    )

    return {
        "access_token": access_token,
        "user": user_response,
    }


async def logout_user(refresh_token_str: str) -> None:
    """Invalidate the refresh token session in Redis."""
    try:
        payload = decode_token(refresh_token_str)
        user_id = payload.get("sub")
        session_id = payload.get("sid")
        if user_id and session_id:
            await delete_session(user_id, session_id)
    except Exception:
        pass  # Logout should always succeed


async def get_user_profile(user_id: str) -> UserResponse:
    """Fetch user profile by ID."""
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ValueError("User not found")

    return UserResponse(
        id=str(user["_id"]),
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        created_at=user["created_at"],
    )
