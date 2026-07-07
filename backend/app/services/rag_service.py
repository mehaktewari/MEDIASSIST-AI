import os
import pickle
import faiss
import numpy as np
from pathlib import Path
from app.utils.document_parser import parse_document, chunk_text
from app.core.config import settings

# Storage for our vector index
VECTOR_DB_PATH = "vector_db"
os.makedirs(VECTOR_DB_PATH, exist_ok=True)


def _use_gemini_embeddings() -> bool:
    """
    Decide whether to embed via the Gemini API (lightweight HTTP calls, no
    model loaded into memory) or via a local HuggingFace model (heavier —
    loads PyTorch + the model into RAM).

    On memory-constrained hosts (like Render's free tier, 512MB RAM), loading
    the local embedding model alongside the rest of the app can exceed
    available memory and get the process killed. Since we already require a
    Gemini key when LLM_PROVIDER=gemini, reusing that same key for embeddings
    avoids the local model entirely in that case.
    """
    return settings.LLM_PROVIDER.lower() == "gemini" and bool(settings.GEMINI_API_KEY)


def _gemini_embed(texts: list[str], task_type: str) -> np.ndarray:
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)

    vectors = []
    for text in texts:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type=task_type,  # "retrieval_document" for indexing, "retrieval_query" for searching
        )
        vectors.append(result["embedding"])

    return np.array(vectors).astype("float32")


def _local_embed(texts: list[str], is_query: bool) -> np.ndarray:
    from langchain_huggingface import HuggingFaceEmbeddings
    model = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"  # FREE & fast, but needs local RAM
    )
    if is_query:
        return np.array(model.embed_query(texts[0])).astype("float32").reshape(1, -1)
    return np.array(model.embed_documents(texts)).astype("float32")


def get_embeddings(texts: list[str]) -> np.ndarray:
    """
    Convert text into numbers (vectors) that AI understands.
    👶 Like giving each sentence a unique fingerprint!
    """
    if _use_gemini_embeddings():
        return _gemini_embed(texts, task_type="retrieval_document")
    return _local_embed(texts, is_query=False)


def get_query_embedding(question: str) -> np.ndarray:
    """Same idea as get_embeddings, but for a single search question."""
    if _use_gemini_embeddings():
        return _gemini_embed([question], task_type="retrieval_query")
    return _local_embed([question], is_query=True)


def index_document(file_path: str, file_id: str) -> int:
    """
    Read a document, chunk it, embed it, save to FAISS.
    👶 Like reading a book and making index cards for each page!
    """
    # Step 1: Read the file
    text = parse_document(file_path)

    # Step 2: Cut into chunks
    chunks = chunk_text(text)

    if not chunks:
        return 0

    # Step 3: Turn chunks into vectors (numbers)
    vectors = get_embeddings(chunks)

    # Step 4: Save to FAISS index
    dimension = vectors.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(vectors)

    # Step 5: Save index + chunks to disk
    faiss.write_index(index, f"{VECTOR_DB_PATH}/{file_id}.index")
    with open(f"{VECTOR_DB_PATH}/{file_id}.pkl", "wb") as f:
        pickle.dump(chunks, f)

    return len(chunks)


def search_documents(question: str, file_id: str = None, top_k: int = 4, allowed_ids: list[str] = None) -> list[str]:
    """
    Find the most relevant chunks for a question.
    👶 Like searching your index cards for the answer!

    `allowed_ids`, if given, restricts the search to only those file_ids —
    used so one user can never accidentally search another user's documents
    when file_id is left blank ("search all my documents").
    """
    q_vector = get_query_embedding(question)

    # Find which indexes to search
    if file_id:
        index_files = [f"{VECTOR_DB_PATH}/{file_id}.index"]
    elif allowed_ids is not None:
        index_files = [f"{VECTOR_DB_PATH}/{fid}.index" for fid in allowed_ids]
    else:
        index_files = list(Path(VECTOR_DB_PATH).glob("*.index"))

    results = []
    for index_path in index_files:
        idx_path = str(index_path)
        pkl_path = idx_path.replace(".index", ".pkl")

        if not os.path.exists(pkl_path) or not os.path.exists(idx_path):
            continue

        index = faiss.read_index(idx_path)
        with open(pkl_path, "rb") as f:
            chunks = pickle.load(f)

        # Search!
        _, indices = index.search(q_vector, min(top_k, len(chunks)))
        for i in indices[0]:
            if i < len(chunks):
                results.append(chunks[i])

    return results