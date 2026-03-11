import os

from fastapi import APIRouter, Cookie, HTTPException, Response
from itsdangerous import BadSignature, URLSafeSerializer

from app.database import get_db
from app.schemas import AuthRequest, UserResponse

router = APIRouter(prefix="/api/auth")

_signer = URLSafeSerializer(
    os.environ.get("SECRET_KEY", "dev-secret-change-in-production"),
    salt="session",
)


def _make_session(user_id: int) -> str:
    return _signer.dumps(user_id)


def _load_session(token: str) -> int | None:
    try:
        return _signer.loads(token)
    except BadSignature:
        return None


def _set_session_cookie(response: Response, user_id: int) -> None:
    response.set_cookie(
        key="session",
        value=_make_session(user_id),
        httponly=True,
        samesite="lax",
        path="/",
    )


def _upsert_user(email: str) -> UserResponse:
    """Insert user if not exists and return them."""
    with get_db() as conn:
        conn.execute("INSERT OR IGNORE INTO users (email) VALUES (?)", (email,))
        conn.commit()
        user = conn.execute(
            "SELECT id, email FROM users WHERE email = ?", (email,)
        ).fetchone()
    return UserResponse(id=user["id"], email=user["email"])


@router.post("/signup", response_model=UserResponse)
def signup(request: AuthRequest, response: Response):
    """Create account (any email/password accepted) and set session cookie."""
    user = _upsert_user(request.email)
    _set_session_cookie(response, user.id)
    return user


@router.post("/signin", response_model=UserResponse)
def signin(request: AuthRequest, response: Response):
    """Sign in (any email/password accepted, creates user if needed) and set session cookie."""
    user = _upsert_user(request.email)
    _set_session_cookie(response, user.id)
    return user


@router.post("/signout")
def signout(response: Response):
    """Clear the session cookie."""
    response.delete_cookie(key="session", path="/")
    return {"ok": True}


def get_current_user_id(session: str | None = Cookie(default=None)) -> int:
    """FastAPI dependency: return current user_id or raise 401."""
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = _load_session(session)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid session")
    return user_id


@router.get("/me", response_model=UserResponse)
def me(session: str | None = Cookie(default=None)):
    """Return the current user from the session cookie."""
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = _load_session(session)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid session")
    with get_db() as conn:
        user = conn.execute(
            "SELECT id, email FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return UserResponse(id=user["id"], email=user["email"])
