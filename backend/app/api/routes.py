import os
import uuid
import json
import aiofiles
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from app.models.schemas import *
from app.services.rag_service import index_document, search_documents
from app.services.llm_service import ask_question, summarize_medical_report, extract_prescription, generate_doctor_note
from app.core.config import settings
from app.api.deps import get_current_user

router = APIRouter()

ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt"
}

HISTORY_FILE = "data/document_history.json"

# ── HISTORY HELPERS ──────────────────────────────────────────
def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r") as f:
            return json.load(f)
    return []

def save_history(history):
    os.makedirs("data", exist_ok=True)
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f)

def get_history_entry(file_id: str):
    return next((d for d in load_history() if d["file_id"] == file_id), None)

def resolve_file_path(file_id: str, current_user: dict) -> str:
    """
    Finds the uploaded file on disk for a given file_id, but ONLY if it
    belongs to the requesting user. Raises 404 if it doesn't exist, or
    403 if it exists but belongs to someone else (never leak "exists but
    isn't yours" vs "doesn't exist" — 403 for owned-by-someone-else is fine
    here since file_ids are random UUIDs, not guessable/enumerable).
    """
    entry = get_history_entry(file_id)
    if not entry:
        raise HTTPException(404, f"File {file_id} not found")
    if entry.get("owner_id") != current_user["id"]:
        raise HTTPException(403, "You don't have access to this document")

    for ext in [".pdf", ".docx", ".txt"]:
        file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")
        if os.path.exists(file_path):
            return file_path
    raise HTTPException(404, f"File {file_id} not found on disk")

# ── 1. UPLOAD ────────────────────────────────────────────────
@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload a medical document (PDF, DOCX, TXT). Requires login."""

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only PDF, DOCX, TXT files allowed!")

    file_id = str(uuid.uuid4())[:8]
    ext = ALLOWED_TYPES[file.content_type]
    filename = f"{file_id}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    content = await file.read()

    if len(content) > max_bytes:
        raise HTTPException(
            413,
            f"File too large ({len(content) / (1024 * 1024):.1f}MB). "
            f"Max allowed size is {settings.MAX_FILE_SIZE_MB}MB."
        )

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    chunks = index_document(file_path, file_id)

    # Save to history, tagged with the owner so other users can never see/use it
    history = load_history()
    history.append({
        "file_id": file_id,
        "filename": file.filename,
        "file_type": ext,
        "chunks": chunks,
        "uploaded_at": datetime.now().strftime("%d %b %Y, %I:%M %p"),
        "owner_id": current_user["id"],
    })
    save_history(history)

    return UploadResponse(
        message="Document uploaded and indexed successfully!",
        file_id=file_id,
        filename=file.filename,
        file_type=ext,
        chunks_created=chunks
    )

# ── 2. QUERY (Q&A) ───────────────────────────────────────────
@router.post("/query", response_model=QueryResponse)
async def query_document(request: QueryRequest, current_user: dict = Depends(get_current_user)):
    """Ask a question about YOUR uploaded documents. Remembers prior turns via request.history."""

    owned_ids = [d["file_id"] for d in load_history() if d.get("owner_id") == current_user["id"]]

    if request.file_id:
        if request.file_id not in owned_ids:
            raise HTTPException(403, "You don't have access to this document")
        chunks = search_documents(request.question, file_id=request.file_id)
    else:
        # No specific file chosen — search only across documents this user owns,
        # never other users' documents.
        chunks = search_documents(request.question, allowed_ids=owned_ids)

    if not chunks:
        return QueryResponse(
            answer="No relevant documents found. Please upload a document first."
        )

    history_dicts = [turn.dict() for turn in request.history]
    answer = ask_question(chunks, request.question, history=history_dicts, language=request.language)

    return QueryResponse(
        answer=answer,
        sources=chunks[:2],
        confidence=0.85
    )

# ── 3. SUMMARIZE ─────────────────────────────────────────────
@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_report(request: SummarizeRequest, current_user: dict = Depends(get_current_user)):
    """Summarize a medical report, translated into request.language if not English"""

    file_path = resolve_file_path(request.file_id, current_user)

    from app.utils.document_parser import parse_document
    text = parse_document(file_path)
    result = summarize_medical_report(text, language=request.language)

    return SummarizeResponse(**result)

# ── 4. PRESCRIPTION ──────────────────────────────────────────
@router.post("/extract-prescription", response_model=PrescriptionResponse)
async def extract_prescription_route(request: SummarizeRequest, current_user: dict = Depends(get_current_user)):
    """Extract medicines and dosages from a prescription"""

    file_path = resolve_file_path(request.file_id, current_user)

    from app.utils.document_parser import parse_document
    text = parse_document(file_path)
    result = extract_prescription(text)

    return PrescriptionResponse(**result)

# ── 5. TRANSLATE ─────────────────────────────────────────────
@router.post("/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """Translate text to any supported language (see llm_service.LANGUAGE_CODES). Public — no file access involved."""

    from app.services.llm_service import LANGUAGE_CODES

    target = LANGUAGE_CODES.get(request.target_language.lower())
    if not target:
        raise HTTPException(
            400,
            f"Unsupported language '{request.target_language}'. "
            f"Supported: {', '.join(LANGUAGE_CODES.keys())}"
        )

    from deep_translator import GoogleTranslator
    translated = GoogleTranslator(
        source="auto", target=target
    ).translate(request.text)

    return TranslateResponse(
        translated_text=translated,
        source_language="auto-detected",
        target_language=request.target_language
    )

# ── 6. HEALTH CHECK ──────────────────────────────────────────
@router.get("/health")
async def health_check():
    return {
        "status": "✅ MediAssist AI is running!",
        "version": "1.0.0"
    }

# ── 6b. SUPPORTED LANGUAGES ───────────────────────────────────
@router.get("/languages")
async def get_languages():
    """List of languages supported for translation/summarization/chat responses"""
    from app.services.llm_service import LANGUAGE_CODES
    labels = {
        "english": "English", "hindi": "हिन्दी Hindi", "tamil": "தமிழ் Tamil",
        "telugu": "తెలుగు Telugu", "kannada": "ಕನ್ನಡ Kannada", "malayalam": "മലയാളം Malayalam",
        "marathi": "मराठी Marathi", "bengali": "বাংলা Bengali", "gujarati": "ગુજરાતી Gujarati",
        "punjabi": "ਪੰਜਾਬੀ Punjabi", "urdu": "اردو Urdu", "spanish": "Español Spanish",
        "french": "Français French", "german": "Deutsch German", "portuguese": "Português Portuguese",
        "russian": "Русский Russian", "arabic": "العربية Arabic", "chinese": "中文 Chinese",
        "japanese": "日本語 Japanese", "korean": "한국어 Korean",
    }
    return {
        "languages": [
            {"value": code, "label": labels.get(code, code.title())}
            for code in LANGUAGE_CODES.keys()
        ]
    }

# ── 7. DRUG INTERACTION CHECKER ──────────────────────────────
class DrugCheckRequest(BaseModel):
    medicines: list[str]

@router.post("/drug-interaction")
async def drug_interaction(request: DrugCheckRequest, current_user: dict = Depends(get_current_user)):
    """Check dangerous interactions between medicines"""
    from app.services.llm_service import check_drug_interaction
    result = check_drug_interaction(request.medicines)
    return {
        "result": result,
        "medicines_checked": request.medicines
    }

# ── 8. HEALTH RISK SCORE ─────────────────────────────────────
@router.post("/health-risk")
async def health_risk(request: SummarizeRequest, current_user: dict = Depends(get_current_user)):
    """Calculate patient health risk score"""

    file_path = resolve_file_path(request.file_id, current_user)

    from app.utils.document_parser import parse_document
    from app.services.llm_service import calculate_health_risk
    text = parse_document(file_path)
    result = calculate_health_risk(text)
    return result

# ── 9. GET ALL DOCUMENTS ─────────────────────────────────────
@router.get("/documents")
async def get_documents(current_user: dict = Depends(get_current_user)):
    """Get YOUR uploaded document history — never shows other users' documents"""
    my_docs = [d for d in load_history() if d.get("owner_id") == current_user["id"]]
    return {"documents": my_docs}

# ── 10. DELETE DOCUMENT ──────────────────────────────────────
@router.delete("/documents/{file_id}")
async def delete_document(file_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a document and its index — only if you own it"""

    entry = get_history_entry(file_id)
    if not entry:
        raise HTTPException(404, f"Document {file_id} not found")
    if entry.get("owner_id") != current_user["id"]:
        raise HTTPException(403, "You don't have access to this document")

    history = load_history()
    history = [d for d in history if d["file_id"] != file_id]
    save_history(history)

    # Delete uploaded file
    for ext in [".pdf", ".docx", ".txt"]:
        path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")
        if os.path.exists(path):
            os.remove(path)

    # Delete FAISS index
    for ext in [".index", ".pkl"]:
        path = f"vector_db/{file_id}{ext}"
        if os.path.exists(path):
            os.remove(path)

    return {"message": f"Document {file_id} deleted successfully!"}

# ── 11. DOCTOR REPORT GENERATOR ──────────────────────────────
@router.post("/generate-doctor-note", response_model=DoctorNoteResponse)
async def generate_doctor_note_route(request: DoctorNoteRequest, current_user: dict = Depends(get_current_user)):
    """Turns an uploaded document's raw content into a professional doctor's note"""

    file_path = resolve_file_path(request.file_id, current_user)

    from app.utils.document_parser import parse_document
    text = parse_document(file_path)
    note = generate_doctor_note(text, patient_name=request.patient_name, language=request.language)

    return DoctorNoteResponse(
        doctor_note=note,
        patient_name=request.patient_name or "Not specified",
        generated_at=datetime.now().strftime("%d %b %Y, %I:%M %p")
    )