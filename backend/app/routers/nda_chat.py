import json
import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.ai import call_ai
from app.database import get_db
from app.routers.auth import get_current_user_id
from app.schemas import (
    ChatMessage,
    ChatSendRequest,
    ChatSessionResponse,
    ChatTurnResponse,
)

router = APIRouter(prefix="/api/nda-chat")

GREETING = (
    "Hi! I'll help you put together a Mutual NDA. "
    "Let's start with the basics — what's the purpose of this agreement? "
    "For example: 'Evaluating whether to enter into a business relationship.'"
)

_DEFAULT_FIELDS: dict = {
    "purpose": "",
    "effectiveDate": "",
    "mndaTermType": "expires",
    "mndaTermYears": 0,
    "confidentialityTermType": "years",
    "confidentialityTermYears": 0,
    "governingLaw": "",
    "jurisdiction": "",
    "party1Company": "",
    "party1Name": "",
    "party1Title": "",
    "party1Address": "",
    "party1Date": "",
    "party2Company": "",
    "party2Name": "",
    "party2Title": "",
    "party2Address": "",
    "party2Date": "",
}


def _get_active_session(conn, user_id: int):
    return conn.execute(
        "SELECT id, fields FROM chat_sessions "
        "WHERE user_id = ? AND doc_type = 'mutual_nda' "
        "ORDER BY created_at DESC LIMIT 1",
        (user_id,),
    ).fetchone()


@router.get("/session", response_model=ChatSessionResponse)
def get_or_create_session(user_id: int = Depends(get_current_user_id)):
    """Return the active NDA chat session, creating one with a greeting if needed."""
    with get_db() as conn:
        session = _get_active_session(conn, user_id)
        if not session:
            session_id = str(uuid.uuid4())
            conn.execute(
                "INSERT INTO chat_sessions (id, user_id, doc_type, fields) VALUES (?, ?, 'mutual_nda', ?)",
                (session_id, user_id, json.dumps(_DEFAULT_FIELDS)),
            )
            conn.execute(
                "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)",
                (session_id, GREETING),
            )
            conn.commit()
            return ChatSessionResponse(
                session_id=session_id,
                messages=[ChatMessage(role="assistant", content=GREETING)],
                fields=dict(_DEFAULT_FIELDS),
            )

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


@router.post("/message", response_model=ChatTurnResponse)
def send_message(req: ChatSendRequest, user_id: int = Depends(get_current_user_id)):
    """Send a user message and get an AI response that updates fields."""
    with get_db() as conn:
        session = _get_active_session(conn, user_id)
        if not session:
            raise HTTPException(status_code=404, detail="No active session. Call GET /session first.")

        session_id = session["id"]
        current_fields = json.loads(session["fields"])

        prior_rows = conn.execute(
            "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at, id",
            (session_id,),
        ).fetchall()

    # Build history including the new user message (not yet persisted)
    history = [{"role": r["role"], "content": r["content"]} for r in prior_rows]
    history.append({"role": "user", "content": req.content})

    ai_turn = call_ai(history, current_fields)

    updated_fields = {**current_fields}
    for key, val in ai_turn.fields_update.model_dump().items():
        if val is not None:
            updated_fields[key] = val

    assistant_content = ai_turn.next_question or "Your NDA is complete! You can now download it as a PDF."

    # Persist both messages only after AI succeeds
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


@router.delete("/session")
def reset_session(user_id: int = Depends(get_current_user_id)):
    """Delete the current session so the user can start fresh."""
    with get_db() as conn:
        session = _get_active_session(conn, user_id)
        if session:
            conn.execute("DELETE FROM chat_messages WHERE session_id = ?", (session["id"],))
            conn.execute("DELETE FROM chat_sessions WHERE id = ?", (session["id"],))
            conn.commit()
    return {"ok": True}
