import os
from pathlib import Path

def parse_document(file_path: str) -> str:
    """
    Read any document (PDF, DOCX, TXT) and return plain text.
    👶 Like a universal translator that reads any file type!
    """
    path = Path(file_path)
    ext = path.suffix.lower()

    if ext == ".txt":
        return _read_txt(file_path)
    elif ext == ".pdf":
        return _read_pdf(file_path)
    elif ext == ".docx":
        return _read_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

def _read_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def _read_pdf(file_path: str) -> str:
    from pypdf import PdfReader
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

def _read_docx(file_path: str) -> str:
    from docx import Document
    doc = Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs])

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Split big text into smaller pieces.
    👶 Like cutting a long book into small chapters so AI can read them!
    """
    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap  # overlap keeps context between chunks

    return [c for c in chunks if len(c.strip()) > 50]  # skip tiny chunks