"""
FastAPI dependency that reads the `Authorization: Bearer <token>` header,
validates the JWT, and returns the logged-in user. Use as:

    @router.get("/something")
    async def something(user: dict = Depends(get_current_user)):
        ...
"""
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_access_token
from app.core.database import get_user_by_id

bearer_scheme = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload or "user_id" not in payload:
        raise HTTPException(401, "Invalid or expired session. Please log in again.")

    user = get_user_by_id(payload["user_id"])
    if not user:
        raise HTTPException(401, "User no longer exists. Please log in again.")

    # Never leak the password hash to route handlers or logs
    user.pop("hashed_password", None)
    return user