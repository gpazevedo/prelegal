def test_signup_creates_user(client):
    res = client.post("/api/auth/signup", json={"email": "a@test.com", "password": "secret123"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "a@test.com"
    assert "id" in data


def test_signup_sets_session_cookie(client):
    res = client.post("/api/auth/signup", json={"email": "b@test.com", "password": "secret123"})
    assert "session" in res.cookies


def test_signup_rejects_duplicate_email(client):
    client.post("/api/auth/signup", json={"email": "dup@test.com", "password": "secret123"})
    res = client.post("/api/auth/signup", json={"email": "dup@test.com", "password": "other"})
    assert res.status_code == 409


def test_signin_returns_user_with_correct_password(client):
    client.post("/api/auth/signup", json={"email": "c@test.com", "password": "mypassword"})
    res = client.post("/api/auth/signin", json={"email": "c@test.com", "password": "mypassword"})
    assert res.status_code == 200
    assert res.json()["email"] == "c@test.com"


def test_signin_rejects_wrong_password(client):
    client.post("/api/auth/signup", json={"email": "d@test.com", "password": "correct"})
    res = client.post("/api/auth/signin", json={"email": "d@test.com", "password": "wrong"})
    assert res.status_code == 401


def test_signin_rejects_unknown_email(client):
    res = client.post("/api/auth/signin", json={"email": "nobody@test.com", "password": "x"})
    assert res.status_code == 401


def test_me_returns_user_when_authenticated(client):
    client.post("/api/auth/signup", json={"email": "e@test.com", "password": "secret"})
    res = client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == "e@test.com"


def test_me_returns_401_when_not_authenticated(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_signout_clears_session(client):
    client.post("/api/auth/signup", json={"email": "f@test.com", "password": "secret"})
    client.post("/api/auth/signout")
    res = client.get("/api/auth/me")
    assert res.status_code == 401
