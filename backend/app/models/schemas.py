from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ── Upload ──────────────────────────────────────
class UploadResponse(BaseModel):
    message: str
    file_id: str
    filename: str
    file_type: str
    chunks_created: int

# ── Query / Q&A ─────────────────────────────────
class QueryRequest(BaseModel):
    question: str
    file_id: Optional[str] = None   # None = search all docs
    language: str = "english"

class QueryResponse(BaseModel):
    answer: str
    sources: List[str] = []
    confidence: float = 0.0

# ── Summarize ────────────────────────────────────
class SummarizeRequest(BaseModel):
    file_id: str
    language: str = "english"

class SummarizeResponse(BaseModel):
    patient_name: str = "Not found"
    diagnosis: str = "Not found"
    abnormal_values: List[str] = []
    recommendations: List[str] = []
    full_summary: str = ""

# ── Prescription ─────────────────────────────────
class PrescriptionResponse(BaseModel):
    medicines: List[dict] = []   # [{"name": "Paracetamol", "dosage": "500mg"}]
    doctor_name: str = "Not found"
    date: str = "Not found"

# ── Translation ──────────────────────────────────
class TranslateRequest(BaseModel):
    text: str
    target_language: str   # "hindi", "tamil", "english"

class TranslateResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str