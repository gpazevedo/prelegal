def test_signup_creates_user(client):
    res = client.post("/api/auth/signup", json={"email": "a@test.com", "password": "any"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "a@test.com"
    assert "id" in data


def test_signup_sets_session_cookie(client):
    res = client.post("/api/auth/signup", json={"email": "b@test.com", "password": "x"})
    assert "session" in res.cookies


def test_signin_creates_user_if_not_exists(client):
    res = client.post("/api/auth/signin", json={"email": "new@test.com", "password": "x"})
    assert res.status_code == 200
    assert res.json()["email"] == "new@test.com"


def test_signin_returns_existing_user(client):
    client.post("/api/auth/signup", json={"email": "c@test.com", "password": "x"})
    res = client.post("/api/auth/signin", json={"email": "c@test.com", "password": "different"})
    assert res.status_code == 200
    assert res.json()["email"] == "c@test.com"


def test_me_returns_user_when_authenticated(client):
    client.post("/api/auth/signup", json={"email": "d@test.com", "password": "x"})
    res = client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == "d@test.com"


def test_me_returns_401_when_not_authenticated(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_signout_clears_session(client):
    client.post("/api/auth/signup", json={"email": "e@test.com", "password": "x"})
    client.post("/api/auth/signout")
    res = client.get("/api/auth/me")
    assert res.status_code == 401
