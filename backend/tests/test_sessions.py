from unittest.mock import patch

from app.ai import GenericAiTurn, GenericFieldsUpdate


def _signup(client, email="user@test.com", password="secret123"):
    client.post("/api/auth/signup", json={"email": email, "password": password})


def _nda_session(client):
    return client.get("/api/nda-chat/session")


def _doc_session(client, slug="csa"):
    return client.get(f"/api/doc-chat/{slug}/session")


def test_list_sessions_empty(client):
    _signup(client)
    res = client.get("/api/sessions")
    assert res.status_code == 200
    assert res.json() == []


def test_list_sessions_requires_auth(client):
    res = client.get("/api/sessions")
    assert res.status_code == 401


def test_list_sessions_returns_nda_session(client):
    _signup(client)
    _nda_session(client)
    res = client.get("/api/sessions")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["doc_type"] == "mutual_nda"
    assert data[0]["doc_name"] == "Mutual NDA"
    assert "session_id" in data[0]
    assert "updated_at" in data[0]
    assert "fields" in data[0]


def test_list_sessions_returns_generic_session(client):
    _signup(client)
    with patch("app.routers.doc_chat.call_generic_ai") as mock_ai:
        mock_ai.return_value = GenericAiTurn(
            next_question="Hi!", fields_update=GenericFieldsUpdate(), is_complete=False
        )
        _doc_session(client, "csa")
    res = client.get("/api/sessions")
    assert res.status_code == 200
    data = res.json()
    assert any(s["doc_type"] == "csa" for s in data)
    csa = next(s for s in data if s["doc_type"] == "csa")
    assert csa["doc_name"] == "Cloud Service Agreement (CSA)"


def test_list_sessions_multiple(client):
    _signup(client)
    _nda_session(client)
    with patch("app.routers.doc_chat.call_generic_ai") as mock_ai:
        mock_ai.return_value = GenericAiTurn(
            next_question="Hi!", fields_update=GenericFieldsUpdate(), is_complete=False
        )
        _doc_session(client, "csa")
    res = client.get("/api/sessions")
    assert len(res.json()) == 2


def test_get_session_by_id(client):
    _signup(client)
    _nda_session(client)
    sessions = client.get("/api/sessions").json()
    session_id = sessions[0]["session_id"]
    res = client.get(f"/api/sessions/{session_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["session_id"] == session_id
    assert data["doc_type"] == "mutual_nda"


def test_get_session_by_id_not_found(client):
    _signup(client)
    res = client.get("/api/sessions/nonexistent-uuid")
    assert res.status_code == 404


def test_get_session_by_id_requires_auth(client):
    res = client.get("/api/sessions/some-id")
    assert res.status_code == 401


def test_sessions_isolated_per_user():
    """User A cannot see User B's sessions."""
    from fastapi.testclient import TestClient
    from app.main import app

    client_a = TestClient(app, raise_server_exceptions=True)
    client_b = TestClient(app, raise_server_exceptions=True)

    client_a.post("/api/auth/signup", json={"email": "a@test.com", "password": "password123"})
    client_b.post("/api/auth/signup", json={"email": "b@test.com", "password": "password123"})

    client_a.get("/api/nda-chat/session")
    sessions_a = client_a.get("/api/sessions").json()
    sessions_b = client_b.get("/api/sessions").json()

    assert len(sessions_a) == 1
    assert len(sessions_b) == 0

    session_id = sessions_a[0]["session_id"]
    res = client_b.get(f"/api/sessions/{session_id}")
    assert res.status_code == 404
