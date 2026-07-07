# ── MediAssist AI — Backend (FastAPI) ────────────────────────────
# Build context is the PROJECT ROOT (not backend/), since requirements.txt
# lives at the root. Build with:
#   docker build -f backend/Dockerfile -t mediassist-backend .
# (docker-compose handles this automatically — see docker-compose.yml)

FROM python:3.11-slim

# build-essential is needed to compile a couple of the ML dependencies
# (faiss-cpu / sentence-transformers) on some platforms.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first so Docker can cache this layer — it won't
# re-download everything just because you changed a line of app code.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Now copy the actual backend source
COPY backend/ .

# These match the relative paths used throughout the app (data/uploads,
# data/document_history.json, data/users.db, vector_db/*.index) so they
# behave identically to running `cd backend && uvicorn main:app` locally.
RUN mkdir -p data vector_db

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]