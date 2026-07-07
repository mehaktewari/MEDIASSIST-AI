"""Tests for endpoints that intentionally don't require login."""


def test_health_check_is_public(client):
    res = client.get("/api/health")
    assert res.status_code == 200


def test_languages_endpoint_returns_list(client):
    res = client.get("/api/languages")
    assert res.status_code == 200
    langs = res.json()["languages"]
    assert any(l["value"] == "english" for l in langs)
    assert len(langs) >= 15  # we expanded this from 3 to 20 languages


def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200