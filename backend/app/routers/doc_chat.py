"""Generic document chat endpoints, parameterized by doc_slug."""
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.ai import call_generic_ai
from app.database import get_db
from app.doc_config import get_config, get_default_fields
from app.routers.auth import get_current_user_id
from app.schemas import (
    ChatMessage,
    ChatSendRequest,
    ChatSessionResponse,
    ChatTurnResponse,
)

router = APIRouter(prefix="/api/doc-chat")


def _get_active_session(conn, user_id: int, doc_slug: str):
    return conn.execute(
        "SELECT id, fields FROM chat_sessions "
        "WHERE user_id = ? AND doc_type = ? "
        "ORDER BY created_at DESC LIMIT 1",
        (user_id, doc_slug),
    ).fetchone()


@router.get("/{doc_slug}/session", response_model=ChatSessionResponse)
def get_or_create_session(doc_slug: str, user_id: int = Depends(get_current_user_id)):
    """Return the active session for this doc type, creating one with a greeting if needed."""
    config = get_config(doc_slug)
    if not config:
        raise HTTPException(status_code=404, detail=f"Unknown document type: {doc_slug}")

    with get_db() as conn:
        session = _get_active_session(conn, user_id, doc_slug)
        if not session:
            session_id = str(uuid.uuid4())
            conn.execute(
                "INSERT OR IGNORE INTO chat_sessions (id, user_id, doc_type, fields) VALUES (?, ?, ?, ?)",
                (session_id, user_id, doc_slug, json.dumps(get_default_fields())),
            )
            if conn.execute("SELECT changes()").fetchone()[0]:
                conn.execute(
                    "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)",
                    (session_id, config.greeting),
                )
            conn.commit()
            session = _get_active_session(conn, user_id, doc_slug)

        session_id = session["id"]
        fields = json.loads(session["fields"])
        rows = conn.execute(
            "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at, id",
            (session_id,),
        ).fetchall()

    return ChatSessionResponse(
        session_id=session_id,
        messages=[ChatMessage(role=r["role"], content=r["content"]) for r in rows],
        fields=fields,
    )


@router.post("/{doc_slug}/message", response_model=ChatTurnResponse)
def send_message(doc_slug: str, req: ChatSendRequest, user_id: int = Depends(get_current_user_id)):
    """Send a user message and get an AI response that updates document fields."""
    config = get_config(doc_slug)
    if not config:
        raise HTTPException(status_code=404, detail=f"Unknown document type: {doc_slug}")

    with get_db() as conn:
        session = _get_active_session(conn, user_id, doc_slug)
        if not session:
            raise HTTPException(status_code=404, detail="No active session. Call GET /session first.")

        session_id = session["id"]
        current_fields = json.loads(session["fields"])
        prior_rows = conn.execute(
            "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at, id",
            (session_id,),
        ).fetchall()

    # Skip leading assistant greeting so history starts with a user message
    history = [{"role": r["role"], "content": r["content"]} for r in prior_rows]
    while history and history[0]["role"] == "assistant":
        history = history[1:]
    history.append({"role": "user", "content": req.content})

    ai_turn = call_generic_ai(history, current_fields, config)

    updated_fields = {**current_fields}
    for key, val in ai_turn.fields_update.model_dump().items():
        if val is not None:
            updated_fields[key] = val

    assistant_content = (
        ai_turn.next_question or f"Your {config.name} is complete! You can now download it as a PDF."
    )

    with get_db() as conn:
        conn.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)",
            (session_id, req.content),
        )
        conn.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)",
            (session_id, assistant_content),
        )
        conn.execute(
            "UPDATE chat_sessions SET fields = ?, updated_at = datetime('now') WHERE id = ?",
            (json.dumps(updated_fields), session_id),
        )
        conn.commit()

    return ChatTurnResponse(
        assistant_message=assistant_content,
        fields=updated_fields,
        is_complete=ai_turn.is_complete,
    )


@router.delete("/{doc_slug}/session")
def reset_session(doc_slug: str, user_id: int = Depends(get_current_user_id)):
    """Delete the current session so the user can start fresh."""
    if not get_config(doc_slug):
        raise HTTPException(status_code=404, detail=f"Unknown document type: {doc_slug}")

    with get_db() as conn:
        session = _get_active_session(conn, user_id, doc_slug)
        if session:
            conn.execute("DELETE FROM chat_messages WHERE session_id = ?", (session["id"],))
            conn.execute("DELETE FROM chat_sessions WHERE id = ?", (session["id"],))
            conn.commit()
    return {"ok": True}
