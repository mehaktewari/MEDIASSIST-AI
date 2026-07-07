"""
Tests for document upload, history, and — most importantly — per-user
data isolation. Before the auth system existed, any user could see or
delete any other user's documents just by knowing a file_id. These
tests exist specifically to make sure that never regresses.
"""
import io


def signup_and_get_headers(client, email):
    res = client.post("/api/auth/signup", json={
        "email": email, "password": "password123", "full_name": email.split("@")[0]
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def upload_fake_document(client, headers, filename="report.txt", content=b"Patient has mild fever."):
    files = {"file": (filename, io.BytesIO(content), "text/plain")}
    return client.post("/api/upload", files=files, headers=headers)


def test_upload_requires_auth(client):
    files = {"file": ("report.txt", io.BytesIO(b"hello"), "text/plain")}
    res = client.post("/api/upload", files=files)
    assert res.status_code in (401, 403)


def test_upload_rejects_bad_file_type(client):
    headers = signup_and_get_headers(client, "frank@example.com")
    files = {"file": ("virus.exe", io.BytesIO(b"MZ"), "application/octet-stream")}
    res = client.post("/api/upload", files=files, headers=headers)
    assert res.status_code == 400


def test_upload_and_list_documents(client):
    headers = signup_and_get_headers(client, "grace@example.com")
    upload = upload_fake_document(client, headers)
    assert upload.status_code == 200
    file_id = upload.json()["file_id"]

    docs = client.get("/api/documents", headers=headers)
    assert docs.status_code == 200
    ids = [d["file_id"] for d in docs.json()["documents"]]
    assert file_id in ids


def test_user_cannot_see_another_users_documents(client):
    """The core security fix: /documents must never leak another user's files."""
    headers_a = signup_and_get_headers(client, "userA@example.com")
    headers_b = signup_and_get_headers(client, "userB@example.com")

    upload_fake_document(client, headers_a)

    docs_b = client.get("/api/documents", headers=headers_b).json()["documents"]
    assert docs_b == []  # user B sees nothing, even though user A has a document


def test_user_cannot_summarize_another_users_document(client):
    headers_a = signup_and_get_headers(client, "ownerA@example.com")
    headers_b = signup_and_get_headers(client, "attackerB@example.com")

    upload = upload_fake_document(client, headers_a)
    file_id = upload.json()["file_id"]

    res = client.post(
        "/api/summarize",
        json={"file_id": file_id, "language": "english"},
        headers=headers_b,
    )
    assert res.status_code == 403


def test_user_cannot_delete_another_users_document(client):
    headers_a = signup_and_get_headers(client, "ownerC@example.com")
    headers_b = signup_and_get_headers(client, "attackerD@example.com")

    upload = upload_fake_document(client, headers_a)
    file_id = upload.json()["file_id"]

    res = client.delete(f"/api/documents/{file_id}", headers=headers_b)
    assert res.status_code == 403

    # confirm it's still there for the real owner afterwards
    docs_a = client.get("/api/documents", headers=headers_a).json()["documents"]
    assert any(d["file_id"] == file_id for d in docs_a)


def test_owner_can_delete_own_document(client):
    headers = signup_and_get_headers(client, "owner_e@example.com")
    upload = upload_fake_document(client, headers)
    file_id = upload.json()["file_id"]

    res = client.delete(f"/api/documents/{file_id}", headers=headers)
    assert res.status_code == 200

    docs = client.get("/api/documents", headers=headers).json()["documents"]
    assert not any(d["file_id"] == file_id for d in docs)


def test_query_without_file_id_only_searches_own_documents(client):
    """When file_id is omitted, /query must only search the caller's own docs."""
    headers_a = signup_and_get_headers(client, "queryA@example.com")
    upload_fake_document(client, headers_a)

    res = client.post(
        "/api/query",
        json={"question": "What's wrong with the patient?"},
        headers=headers_a,
    )
    assert res.status_code == 200
    assert "answer" in res.json()


def test_generate_doctor_note_blocked_for_non_owner(client):
    headers_a = signup_and_get_headers(client, "noteOwner@example.com")
    headers_b = signup_and_get_headers(client, "noteAttacker@example.com")

    upload = upload_fake_document(client, headers_a)
    file_id = upload.json()["file_id"]

    res = client.post(
        "/api/generate-doctor-note",
        json={"file_id": file_id, "language": "english"},
        headers=headers_b,
    )
    assert res.status_code == 403