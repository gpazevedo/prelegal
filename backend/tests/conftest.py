import atexit
import os
import tempfile
import pytest
from fastapi.testclient import TestClient

# Use a temp database for tests
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["DATABASE_URL"] = _tmp.name
os.environ["SECRET_KEY"] = "test-secret"

atexit.register(lambda: os.unlink(_tmp.name) if os.path.exists(_tmp.name) else None)

from app.database import init_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    yield
    import sqlite3
    conn = sqlite3.connect(_tmp.name)
    conn.execute("DELETE FROM chat_messages")
    conn.execute("DELETE FROM chat_sessions")
    conn.execute("DELETE FROM users")
    conn.commit()
    conn.close()


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=True)
