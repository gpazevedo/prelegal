import json

from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.doc_config import get_config
from app.routers.auth import get_current_user_id
from app.schemas import SessionSummary

router = APIRouter(prefix="/api")


def _doc_name(doc_type: str) -> str:
    if doc_type == "mutual_nda":
        return "Mutual NDA"
    config = get_config(doc_type)
    return config.name if config else doc_type


@router.get("/sessions", response_model=list[SessionSummary])
def list_sessions(user_id: int = Depends(get_current_user_id)):
    """List all document sessions for the current user, newest first."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, doc_type, fields, updated_at FROM chat_sessions "
            "WHERE user_id = ? ORDER BY updated_at DESC",
            (user_id,),
        ).fetchall()
    return [
        SessionSummary(
            session_id=row["id"],
            doc_type=row["doc_type"],
            doc_name=_doc_name(row["doc_type"]),
            updated_at=row["updated_at"],
            fields=json.loads(row["fields"]),
        )
        for row in rows
    ]


@router.get("/sessions/{session_id}", response_model=SessionSummary)
def get_session(session_id: str, user_id: int = Depends(get_current_user_id)):
    """Get a specific session by ID (must belong to current user)."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, doc_type, fields, updated_at FROM chat_sessions "
            "WHERE id = ? AND user_id = ?",
            (session_id, user_id),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionSummary(
        session_id=row["id"],
        doc_type=row["doc_type"],
        doc_name=_doc_name(row["doc_type"]),
        updated_at=row["updated_at"],
        fields=json.loads(row["fields"]),
    )
