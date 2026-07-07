"""Tests for signup, login, and the /me endpoint."""


def test_signup_success(client):
    res = client.post("/api/auth/signup", json={
        "email": "alice@example.com", "password": "password123", "full_name": "Alice"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["full_name"] == "Alice"
    assert "access_token" in data


def test_signup_duplicate_email_rejected(client):
    client.post("/api/auth/signup", json={"email": "bob@example.com", "password": "password123"})
    res = client.post("/api/auth/signup", json={"email": "bob@example.com", "password": "password123"})
    assert res.status_code == 400


def test_signup_is_case_insensitive_on_email(client):
    client.post("/api/auth/signup", json={"email": "Case@Example.com", "password": "password123"})
    res = client.post("/api/auth/signup", json={"email": "case@example.com", "password": "password123"})
    assert res.status_code == 400


def test_signup_short_password_rejected(client):
    res = client.post("/api/auth/signup", json={"email": "short@example.com", "password": "123"})
    assert res.status_code == 400


def test_login_success(client):
    client.post("/api/auth/signup", json={"email": "carol@example.com", "password": "password123"})
    res = client.post("/api/auth/login", json={"email": "carol@example.com", "password": "password123"})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password_rejected(client):
    client.post("/api/auth/signup", json={"email": "dave@example.com", "password": "password123"})
    res = client.post("/api/auth/login", json={"email": "dave@example.com", "password": "wrongpass"})
    assert res.status_code == 401


def test_login_unknown_email_rejected(client):
    res = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "whatever"})
    assert res.status_code == 401


def test_me_requires_token(client):
    res = client.get("/api/auth/me")
    assert res.status_code in (401, 403)  # FastAPI's HTTPBearer raises 403 if the header is missing entirely


def test_me_returns_current_user(client):
    signup = client.post("/api/auth/signup", json={
        "email": "erin@example.com", "password": "password123", "full_name": "Erin"
    })
    token = signup.json()["access_token"]
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "erin@example.com"


def test_invalid_token_rejected(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert res.status_code == 401