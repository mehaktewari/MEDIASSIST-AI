import os
from dotenv import load_dotenv

# Force load .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../../.env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def get_llm():
    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=GEMINI_API_KEY,
        temperature=0.3,
    )

def ask_question(context_chunks: list[str], question: str) -> str:
    llm = get_llm()
    context = "\n\n".join(context_chunks)
    prompt = f"""You are a helpful medical document assistant.
Use ONLY the context below to answer the question.
If the answer is not in the context, say "I couldn't find that in the document."

Context:
{context}

Question: {question}

Answer:"""
    response = llm.invoke(prompt)
    return response.content

def summarize_medical_report(text: str) -> dict:
    llm = get_llm()
    prompt = f"""You are a medical document analyzer.
Read the following medical report and extract:
1. Patient Name
2. Main Diagnosis
3. Abnormal Values (list up to 5)
4. Recommended Follow-up actions (list up to 3)

Return ONLY a JSON object like this:
{{
  "patient_name": "...",
  "diagnosis": "...",
  "abnormal_values": ["...", "..."],
  "recommendations": ["...", "..."],
  "full_summary": "2-3 sentence summary"
}}

Medical Report:
{text[:4000]}"""
    response = llm.invoke(prompt)
    import json, re
    try:
        json_str = re.search(r'\{.*\}', response.content, re.DOTALL).group()
        return json.loads(json_str)
    except:
        return {
            "patient_name": "Could not extract",
            "diagnosis": "Could not extract",
            "abnormal_values": [],
            "recommendations": [],
            "full_summary": response.content
        }

def extract_prescription(text: str) -> dict:
    llm = get_llm()
    prompt = f"""You are a pharmacy assistant.
Extract all medicines and their dosages from this prescription.

Return ONLY a JSON object like this:
{{
  "medicines": [
    {{"name": "Paracetamol", "dosage": "500mg", "frequency": "twice daily"}}
  ],
  "doctor_name": "...",
  "date": "..."
}}

Prescription:
{text[:3000]}"""
    response = llm.invoke(prompt)
    import json, re
    try:
        json_str = re.search(r'\{.*\}', response.content, re.DOTALL).group()
        return json.loads(json_str)
    except:
        return {"medicines": [], "doctor_name": "Not found", "date": "Not found"}