from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import SignupRequest, LoginRequest, TokenResponse, UserOut
from app.core.database import get_user_by_email, create_user
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest):
    """Create a new account. Emails are stored lowercase and must be unique."""

    email = request.email.strip().lower()

    if get_user_by_email(email):
        raise HTTPException(400, "An account with this email already exists. Try logging in instead.")

    if len(request.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")

    user_id = create_user(
        email=email,
        hashed_password=hash_password(request.password),
        full_name=request.full_name.strip() if request.full_name else email.split("@")[0],
        created_at=datetime.utcnow().isoformat(),
    )

    token = create_access_token({"user_id": user_id, "email": email})
    return TokenResponse(access_token=token, user=UserOut(id=user_id, email=email, full_name=request.full_name or email.split("@")[0]))


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Log in with email + password, get back a JWT to use on future requests."""

    email = request.email.strip().lower()
    user = get_user_by_email(email)

    if not user or not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(401, "Incorrect email or password.")

    token = create_access_token({"user_id": user["id"], "email": user["email"]})
    return TokenResponse(
        access_token=token,
        user=UserOut(id=user["id"], email=user["email"], full_name=user["full_name"])
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the currently logged-in user, based on the Bearer token."""
    return UserOut(id=current_user["id"], email=current_user["email"], full_name=current_user["full_name"])