import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import *
from app.services.rag_service import index_document, search_documents
from app.services.llm_service import ask_question, summarize_medical_report, extract_prescription
from app.core.config import settings

router = APIRouter()

ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt"
}

# ── 1. UPLOAD ────────────────────────────────────────────────
@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a medical document (PDF, DOCX, TXT)"""

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only PDF, DOCX, TXT files allowed!")

    # Save file
    file_id = str(uuid.uuid4())[:8]
    ext = ALLOWED_TYPES[file.content_type]
    filename = f"{file_id}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    # Index into FAISS
    chunks = index_document(file_path, file_id)

    return UploadResponse(
        message="Document uploaded and indexed successfully!",
        file_id=file_id,
        filename=file.filename,
        file_type=ext,
        chunks_created=chunks
    )

# ── 2. QUERY (Q&A) ───────────────────────────────────────────
@router.post("/query", response_model=QueryResponse)
async def query_document(request: QueryRequest):
    """Ask a question about uploaded documents"""

    # Find relevant chunks
    chunks = search_documents(request.question, request.file_id)

    if not chunks:
        return QueryResponse(answer="No relevant documents found. Please upload a document first.")

    # Ask AI
    answer = ask_question(chunks, request.question)

    return QueryResponse(
        answer=answer,
        sources=chunks[:2],  # Return top 2 source chunks
        confidence=0.85
    )

# ── 3. SUMMARIZE ─────────────────────────────────────────────
@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_report(request: SummarizeRequest):
    """Summarize a medical report"""

    # Find the uploaded file
    for ext in [".pdf", ".docx", ".txt"]:
        file_path = os.path.join(settings.UPLOAD_DIR, f"{request.file_id}{ext}")
        if os.path.exists(file_path):
            break
    else:
        raise HTTPException(404, f"File {request.file_id} not found")

    from app.utils.document_parser import parse_document
    text = parse_document(file_path)
    result = summarize_medical_report(text)

    return SummarizeResponse(**result)

# ── 4. PRESCRIPTION ──────────────────────────────────────────
@router.post("/extract-prescription", response_model=PrescriptionResponse)
async def extract_prescription_route(request: SummarizeRequest):
    """Extract medicines and dosages from a prescription"""

    for ext in [".pdf", ".docx", ".txt"]:
        file_path = os.path.join(settings.UPLOAD_DIR, f"{request.file_id}{ext}")
        if os.path.exists(file_path):
            break
    else:
        raise HTTPException(404, f"File {request.file_id} not found")

    from app.utils.document_parser import parse_document
    text = parse_document(file_path)
    result = extract_prescription(text)

    return PrescriptionResponse(**result)

# ── 5. TRANSLATE ─────────────────────────────────────────────
@router.post("/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """Translate text to Hindi, Tamil, or English"""

    lang_map = {
        "hindi": "hi",
        "tamil": "ta",
        "english": "en"
    }

    target = lang_map.get(request.target_language.lower(), "hi")

    from deep_translator import GoogleTranslator
    translated = GoogleTranslator(source="auto", target=target).translate(request.text)

    return TranslateResponse(
        translated_text=translated,
        source_language="auto-detected",
        target_language=request.target_language
    )

# ── 6. HEALTH CHECK ──────────────────────────────────────────
@router.get("/health")
async def health_check():
    return {"status": "✅ MediAssist AI is running!", "version": "1.0.0"}