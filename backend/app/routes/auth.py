"""Auth routes — Register, Login, Refresh, Logout, Me."""

from fastapi import APIRouter, HTTPException, Request, Response, Depends, status

from app.models.user import UserRegister, UserLogin, TokenResponse, UserResponse
from app.services.auth_service import (
    register_user,
    login_user,
    refresh_access_token,
    logout_user,
    get_user_profile,
)
from app.middleware.auth_middleware import (
    get_current_user,
    set_refresh_cookie,
    clear_refresh_cookie,
)
from app.middleware.rate_limiter import rate_limit_login

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, response: Response):
    """Register a new user account."""
    try:
        result = await register_user(data)
        set_refresh_cookie(response, result["refresh_token"])
        return TokenResponse(
            access_token=result["access_token"],
            user=result["user"],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, request: Request, response: Response):
    """Login with email and password."""
    await rate_limit_login(request)
    try:
        result = await login_user(data.email, data.password)
        set_refresh_cookie(response, result["refresh_token"])
        return TokenResponse(
            access_token=result["access_token"],
            user=result["user"],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/refresh")
async def refresh(request: Request, response: Response):
    """Refresh access token using httpOnly refresh token cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token found",
        )
    try:
        result = await refresh_access_token(refresh_token)
        return {
            "access_token": result["access_token"],
            "token_type": "bearer",
            "user": result["user"],
        }
    except ValueError as e:
        clear_refresh_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout — invalidate session and clear cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        await logout_user(refresh_token)
    clear_refresh_cookie(response)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    try:
        return await get_user_profile(current_user["user_id"])
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
