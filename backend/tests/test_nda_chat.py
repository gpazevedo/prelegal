"""Tests for the NDA chat endpoints.

AI calls are mocked so tests don't require a real API key.
"""
from unittest.mock import MagicMock, patch

from app.ai import AiTurn, FieldsUpdate
from app.routers.nda_chat import GREETING


def _make_ai_turn(next_question="What is Party 1's company name?", is_complete=False, **fields):
    return AiTurn(
        next_question=next_question,
        fields_update=FieldsUpdate(**fields),
        is_complete=is_complete,
    )


def _auth_client(client):
    """Sign up and return the client with an active session."""
    client.post("/api/auth/signup", json={"email": "chat@test.com", "password": "secret123"})
    return client


def test_get_session_creates_new_with_greeting(client):
    _auth_client(client)
    res = client.get("/api/nda-chat/session")
    assert res.status_code == 200
    data = res.json()
    assert "session_id" in data
    assert len(data["messages"]) == 1
    assert data["messages"][0]["role"] == "assistant"
    assert data["messages"][0]["content"] == GREETING
    assert "fields" in data


def test_get_session_returns_existing_on_repeat_call(client):
    _auth_client(client)
    res1 = client.get("/api/nda-chat/session")
    res2 = client.get("/api/nda-chat/session")
    assert res1.json()["session_id"] == res2.json()["session_id"]


def test_get_session_requires_auth(client):
    res = client.get("/api/nda-chat/session")
    assert res.status_code == 401


def test_send_message_requires_auth(client):
    res = client.post("/api/nda-chat/message", json={"content": "hello"})
    assert res.status_code == 401


@patch("app.routers.nda_chat.call_ai")
def test_send_message_returns_assistant_response(mock_ai, client):
    mock_ai.return_value = _make_ai_turn(next_question="What state governs this agreement?")
    _auth_client(client)
    client.get("/api/nda-chat/session")

    res = client.post("/api/nda-chat/message", json={"content": "Evaluating a partnership"})
    assert res.status_code == 200
    data = res.json()
    assert data["assistant_message"] == "What state governs this agreement?"
    assert data["is_complete"] is False


@patch("app.routers.nda_chat.call_ai")
def test_send_message_updates_fields(mock_ai, client):
    mock_ai.return_value = _make_ai_turn(
        next_question="Got it. What is the effective date?",
        purpose="Evaluating a partnership",
    )
    _auth_client(client)
    client.get("/api/nda-chat/session")
    res = client.post("/api/nda-chat/message", json={"content": "Evaluating a partnership"})
    assert res.json()["fields"]["purpose"] == "Evaluating a partnership"


@patch("app.routers.nda_chat.call_ai")
def test_send_message_is_complete_flag(mock_ai, client):
    mock_ai.return_value = _make_ai_turn(next_question=None, is_complete=True)
    _auth_client(client)
    client.get("/api/nda-chat/session")
    res = client.post("/api/nda-chat/message", json={"content": "Done"})
    assert res.json()["is_complete"] is True


@patch("app.routers.nda_chat.call_ai")
def test_send_message_no_session_404(mock_ai, client):
    """Sending a message without an active session returns 404."""
    mock_ai.return_value = _make_ai_turn()
    _auth_client(client)
    # Don't call GET /session first
    res = client.post("/api/nda-chat/message", json={"content": "hello"})
    assert res.status_code == 404


def test_reset_session(client):
    _auth_client(client)
    res1 = client.get("/api/nda-chat/session")
    session_id = res1.json()["session_id"]

    client.delete("/api/nda-chat/session")

    res2 = client.get("/api/nda-chat/session")
    assert res2.json()["session_id"] != session_id


def test_reset_session_requires_auth(client):
    res = client.delete("/api/nda-chat/session")
    assert res.status_code == 401
