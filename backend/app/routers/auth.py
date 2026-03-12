import hashlib
import hmac
import os

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
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
    secure = os.environ.get("SECURE_COOKIES", "false").lower() == "true"
    response.set_cookie(
        key="session",
        value=_make_session(user_id),
        httponly=True,
        samesite="lax",
        path="/",
        secure=secure,
    )


def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 260000)
    return salt.hex() + ":" + dk.hex()


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, dk_hex = stored_hash.split(":")
        salt = bytes.fromhex(salt_hex)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 260000)
        return hmac.compare_digest(dk.hex(), dk_hex)
    except Exception:
        return False


@router.post("/signup", response_model=UserResponse)
def signup(request: AuthRequest, response: Response):
    """Create a new account. Returns 409 if email already registered."""
    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (request.email,)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        password_hash = _hash_password(request.password)
        conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (request.email, password_hash),
        )
        conn.commit()
        user = conn.execute(
            "SELECT id, email FROM users WHERE email = ?", (request.email,)
        ).fetchone()
    _set_session_cookie(response, user["id"])
    return UserResponse(id=user["id"], email=user["email"])


@router.post("/signin", response_model=UserResponse)
def signin(request: AuthRequest, response: Response):
    """Sign in with email and password. Returns 401 if credentials are invalid."""
    with get_db() as conn:
        user = conn.execute(
            "SELECT id, email, password_hash FROM users WHERE email = ?",
            (request.email,),
        ).fetchone()
    if not user or not _verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    _set_session_cookie(response, user["id"])
    return UserResponse(id=user["id"], email=user["email"])


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
def me(user_id: int = Depends(get_current_user_id)):
    """Return the current user from the session cookie."""
    with get_db() as conn:
        user = conn.execute(
            "SELECT id, email FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return UserResponse(id=user["id"], email=user["email"])
