"""Tests for the generic document chat endpoints.

AI calls are mocked so tests don't require a real API key.
"""
from unittest.mock import patch

import pytest

from app.ai import GenericAiTurn, GenericFieldsUpdate
from app.doc_config import get_config

SLUG = "csa"


def _make_ai_turn(next_question="What is the customer company name?", is_complete=False, **fields):
    return GenericAiTurn(
        next_question=next_question,
        fields_update=GenericFieldsUpdate(**fields),
        is_complete=is_complete,
    )


def _auth_client(client):
    client.post("/api/auth/signup", json={"email": "doc@test.com", "password": "x"})
    return client


def test_get_config_known_slug():
    config = get_config(SLUG)
    assert config is not None
    assert config.name == "Cloud Service Agreement (CSA)"
    assert config.template_file == "CSA.md"


def test_get_config_unknown_slug():
    assert get_config("nonexistent") is None


def test_get_session_creates_new_with_greeting(client):
    _auth_client(client)
    res = client.get(f"/api/doc-chat/{SLUG}/session")
    assert res.status_code == 200
    data = res.json()
    assert "session_id" in data
    assert len(data["messages"]) == 1
    assert data["messages"][0]["role"] == "assistant"
    config = get_config(SLUG)
    assert data["messages"][0]["content"] == config.greeting
    assert "fields" in data


def test_get_session_returns_existing_on_repeat_call(client):
    _auth_client(client)
    res1 = client.get(f"/api/doc-chat/{SLUG}/session")
    res2 = client.get(f"/api/doc-chat/{SLUG}/session")
    assert res1.json()["session_id"] == res2.json()["session_id"]


def test_get_session_unknown_slug_returns_404(client):
    _auth_client(client)
    res = client.get("/api/doc-chat/nonexistent/session")
    assert res.status_code == 404


def test_get_session_requires_auth(client):
    res = client.get(f"/api/doc-chat/{SLUG}/session")
    assert res.status_code == 401


def test_send_message_requires_auth(client):
    res = client.post(f"/api/doc-chat/{SLUG}/message", json={"content": "hello"})
    assert res.status_code == 401


@patch("app.routers.doc_chat.call_generic_ai")
def test_send_message_returns_assistant_response(mock_ai, client):
    mock_ai.return_value = _make_ai_turn(next_question="What is the customer company?")
    _auth_client(client)
    client.get(f"/api/doc-chat/{SLUG}/session")

    res = client.post(f"/api/doc-chat/{SLUG}/message", json={"content": "Acme Corp"})
    assert res.status_code == 200
    data = res.json()
    assert data["assistant_message"] == "What is the customer company?"
    assert data["is_complete"] is False


@patch("app.routers.doc_chat.call_generic_ai")
def test_send_message_updates_fields(mock_ai, client):
    mock_ai.return_value = _make_ai_turn(
        next_question="Got it. What is the customer name?",
        providerCompany="Acme Corp",
    )
    _auth_client(client)
    client.get(f"/api/doc-chat/{SLUG}/session")
    res = client.post(f"/api/doc-chat/{SLUG}/message", json={"content": "Acme Corp"})
    assert res.json()["fields"]["providerCompany"] == "Acme Corp"


@patch("app.routers.doc_chat.call_generic_ai")
def test_send_message_is_complete_flag(mock_ai, client):
    mock_ai.return_value = _make_ai_turn(next_question=None, is_complete=True)
    _auth_client(client)
    client.get(f"/api/doc-chat/{SLUG}/session")
    res = client.post(f"/api/doc-chat/{SLUG}/message", json={"content": "Done"})
    assert res.json()["is_complete"] is True


@patch("app.routers.doc_chat.call_generic_ai")
def test_send_message_no_session_returns_404(mock_ai, client):
    mock_ai.return_value = _make_ai_turn()
    _auth_client(client)
    res = client.post(f"/api/doc-chat/{SLUG}/message", json={"content": "hello"})
    assert res.status_code == 404


def test_sessions_are_isolated_per_doc_type(client):
    """Different doc types get separate sessions for the same user."""
    _auth_client(client)
    res1 = client.get(f"/api/doc-chat/csa/session")
    res2 = client.get(f"/api/doc-chat/baa/session")
    assert res1.json()["session_id"] != res2.json()["session_id"]


def test_reset_session(client):
    _auth_client(client)
    res1 = client.get(f"/api/doc-chat/{SLUG}/session")
    session_id = res1.json()["session_id"]

    client.delete(f"/api/doc-chat/{SLUG}/session")

    res2 = client.get(f"/api/doc-chat/{SLUG}/session")
    assert res2.json()["session_id"] != session_id


def test_reset_session_requires_auth(client):
    res = client.delete(f"/api/doc-chat/{SLUG}/session")
    assert res.status_code == 401


def test_reset_unknown_slug_returns_404(client):
    _auth_client(client)
    res = client.delete("/api/doc-chat/nonexistent/session")
    assert res.status_code == 404


# ─── All 10 config slugs ──────────────────────────────────────────────────────

@pytest.mark.parametrize("slug,expected_template", [
    ("ai-addendum", "AI-Addendum.md"),
    ("baa", "BAA.md"),
    ("csa", "CSA.md"),
    ("design-partner-agreement", "design-partner-agreement.md"),
    ("dpa", "DPA.md"),
    ("partnership-agreement", "Partnership-Agreement.md"),
    ("pilot-agreement", "Pilot-Agreement.md"),
    ("psa", "psa.md"),
    ("sla", "sla.md"),
    ("software-license-agreement", "Software-License-Agreement.md"),
])
def test_all_configs_have_correct_template(slug, expected_template):
    config = get_config(slug)
    assert config is not None, f"get_config({slug!r}) returned None"
    assert config.template_file == expected_template
    assert config.slug == slug
    assert len(config.greeting) > 0
    assert len(config.fields_description) > 0


def test_get_default_fields_returns_18_empty_strings():
    from app.doc_config import get_default_fields
    fields = get_default_fields()
    assert len(fields) == 18
    for val in fields.values():
        assert val == ""


# ─── Field merge: None vs empty string ───────────────────────────────────────

@patch("app.routers.doc_chat.call_generic_ai")
def test_none_field_preserves_existing_value(mock_ai, client):
    """AI returning None for a field should not overwrite an already-set value."""
    _auth_client(client)
    client.get(f"/api/doc-chat/{SLUG}/session")

    # First message sets providerCompany
    mock_ai.return_value = _make_ai_turn(providerCompany="Acme Corp")
    client.post(f"/api/doc-chat/{SLUG}/message", json={"content": "Acme Corp"})

    # Second message returns None for providerCompany (not mentioned)
    mock_ai.return_value = _make_ai_turn(next_question="What is the customer?")
    res = client.post(f"/api/doc-chat/{SLUG}/message", json={"content": "next"})
    assert res.json()["fields"]["providerCompany"] == "Acme Corp"


@patch("app.routers.doc_chat.call_generic_ai")
def test_empty_string_field_overwrites_existing_value(mock_ai, client):
    """AI explicitly returning '' for a field should overwrite the existing value."""
    _auth_client(client)
    client.get(f"/api/doc-chat/{SLUG}/session")

    # First message sets providerCompany
    mock_ai.return_value = _make_ai_turn(providerCompany="Acme Corp")
    client.post(f"/api/doc-chat/{SLUG}/message", json={"content": "Acme Corp"})

    # Second message explicitly returns empty string (correction)
    mock_ai.return_value = _make_ai_turn(providerCompany="")
    res = client.post(f"/api/doc-chat/{SLUG}/message", json={"content": "actually empty"})
    assert res.json()["fields"]["providerCompany"] == ""
