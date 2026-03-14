"""Authentication routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import create_access_token, decode_token, hash_password, verify_password
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ── Schemas ─────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserMe(BaseModel):
    id: int
    name: str
    email: str
    created_at: str


# ── Dependencies ─────────────────────────────────────────────────────────────

def get_current_user_id(authorization: str | None) -> int | None:
    """Extract user id from Bearer token. Returns None if invalid/missing."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:].strip()
    payload = decode_token(token)
    if not payload:
        return None
    uid = payload.get("sub")
    if uid is None:
        return None
    try:
        return int(uid)
    except (TypeError, ValueError):
        return None


# ── Routes ──────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=AuthResponse)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user."""
    email = (data.email or "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=(data.name or "").strip(),
        email=email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(
        access_token=token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "created_at": user.created_at.isoformat() if user.created_at else "",
        },
    )


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return token."""
    email = (data.email or "").strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(
        access_token=token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "created_at": user.created_at.isoformat() if user.created_at else "",
        },
    )


@router.get("/me", response_model=UserMe)
def me(
    authorization: str | None = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    """Return current user from token. 401 if invalid/missing."""
    user_id = get_current_user_id(authorization)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return UserMe(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )


@router.post("/logout")
def logout():
    """Stateless logout: client must discard token. Returns success for UX."""
    return {"message": "Logged out"}
