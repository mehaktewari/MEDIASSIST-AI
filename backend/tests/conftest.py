"""
Shared pytest fixtures for the whole test suite.

The `client` fixture spins up a fully isolated instance of the app for
every single test:
  - The SQLite user DB, document history JSON, uploads folder, and FAISS
    index folder all live inside a throwaway pytest tmp_path — tests never
    touch your real data in backend/data or backend/vector_db.
  - The actual embedding model and LLM calls are replaced with instant,
    deterministic fakes, so the whole suite runs in seconds without needing
    Ollama running, a real Gemini key, or an internet connection.
"""
import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure "app" and "main" are importable the same way they are when you
# run `cd backend && uvicorn main:app` — i.e. backend/ needs to be on
# sys.path, not just backend/tests/.
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


@pytest.fixture()
def client(tmp_path, monkeypatch):
    import app.core.database as database
    import app.api.routes as routes
    import app.services.rag_service as rag_service
    import app.services.llm_service as llm_service
    from app.core.config import settings

    # ── Redirect all on-disk state into a throwaway temp directory ──
    monkeypatch.setattr(database, "DB_PATH", str(tmp_path / "users.db"))
    monkeypatch.setattr(routes, "HISTORY_FILE", str(tmp_path / "document_history.json"))
    monkeypatch.setattr(rag_service, "VECTOR_DB_PATH", str(tmp_path / "vector_db"))
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path / "uploads"))
    os.makedirs(str(tmp_path / "vector_db"), exist_ok=True)

    # ── Fake out the embedding + FAISS pipeline ──
    # We're testing the API contract (auth, ownership, routing), not the
    # ML model itself — running the real embedding model in every test
    # would make the suite slow and require internet access.
    fake_index_document = lambda file_path, file_id: 3
    fake_search_documents = lambda *a, **k: ["fake chunk of document text"]
    monkeypatch.setattr(rag_service, "index_document", fake_index_document)
    monkeypatch.setattr(rag_service, "search_documents", fake_search_documents)
    # routes.py imported these by name at module load time, so the module-level
    # patch above doesn't reach them — patch routes' own references too.
    monkeypatch.setattr(routes, "index_document", fake_index_document)
    monkeypatch.setattr(routes, "search_documents", fake_search_documents)

    # ── Fake out every LLM-backed function ──
    fake_ask_question = lambda *a, **k: "This is a fake AI answer."
    fake_summarize = lambda *a, **k: {
        "patient_name": "Test Patient", "diagnosis": "Test diagnosis",
        "abnormal_values": [], "recommendations": [], "full_summary": "Test summary."
    }
    fake_extract_prescription = lambda *a, **k: {
        "medicines": [], "doctor_name": "Not found", "date": "Not found"
    }
    fake_check_drug_interaction = lambda *a, **k: "No interaction found."
    fake_calculate_health_risk = lambda *a, **k: {
        "risk_score": 20, "risk_level": "Low", "risk_factors": [],
        "positive_factors": [], "urgency": "None", "lifestyle_tips": []
    }
    fake_generate_doctor_note = lambda *a, **k: "Fake doctor's note."

    monkeypatch.setattr(llm_service, "ask_question", fake_ask_question)
    monkeypatch.setattr(llm_service, "summarize_medical_report", fake_summarize)
    monkeypatch.setattr(llm_service, "extract_prescription", fake_extract_prescription)
    monkeypatch.setattr(llm_service, "check_drug_interaction", fake_check_drug_interaction)
    monkeypatch.setattr(llm_service, "calculate_health_risk", fake_calculate_health_risk)
    monkeypatch.setattr(llm_service, "generate_doctor_note", fake_generate_doctor_note)
    # Same story as above — patch routes' own imported references too.
    monkeypatch.setattr(routes, "ask_question", fake_ask_question)
    monkeypatch.setattr(routes, "summarize_medical_report", fake_summarize)
    monkeypatch.setattr(routes, "extract_prescription", fake_extract_prescription)
    monkeypatch.setattr(routes, "generate_doctor_note", fake_generate_doctor_note)

    from main import app
    with TestClient(app) as c:
        yield c