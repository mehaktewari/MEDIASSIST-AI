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
class ChatTurn(BaseModel):
    role: str   # "user" or "ai"
    text: str

class QueryRequest(BaseModel):
    question: str
    file_id: Optional[str] = None   # None = search all docs
    language: str = "english"
    history: List[ChatTurn] = []    # previous turns in this conversation, so the AI has memory

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

# ── Doctor Report Generator ─────────────────────
class DoctorNoteRequest(BaseModel):
    file_id: str
    patient_name: Optional[str] = None
    language: str = "english"

class DoctorNoteResponse(BaseModel):
    doctor_note: str
    patient_name: str = "Not specified"
    generated_at: str

# ── Auth ─────────────────────────────────────────
class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut