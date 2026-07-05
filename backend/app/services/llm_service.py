import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../../.env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def get_llm():
    """
    Smart fallback system:
    1. Try Gemini API (if key exists)
    2. Fall back to local Ollama (no key needed, free forever!)
    """
    if GEMINI_API_KEY and len(GEMINI_API_KEY) > 10:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                google_api_key=GEMINI_API_KEY,
                temperature=0.3,
            )
        except Exception:
            pass  # Fall through to local model

    # Local Ollama model - FREE, no API key needed!
    from langchain_community.llms import Ollama
    return Ollama(model="gemma2:2b", temperature=0.3)


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
    return response if isinstance(response, str) else response.content


def summarize_medical_report(text: str) -> dict:
    llm = get_llm()

    prompt = f"""You are a medical document analyzer.
Read this medical report and extract key information.

Return ONLY a JSON object like this (no extra text):
{{
  "patient_name": "...",
  "diagnosis": "...",
  "abnormal_values": ["value1", "value2"],
  "recommendations": ["rec1", "rec2"],
  "full_summary": "2-3 sentence summary here"
}}

Medical Report:
{text[:3000]}"""

    response = llm.invoke(prompt)
    content = response if isinstance(response, str) else response.content

    import json, re
    try:
        json_str = re.search(r'\{.*\}', content, re.DOTALL).group()
        return json.loads(json_str)
    except:
        return {
            "patient_name": "Could not extract",
            "diagnosis": "Could not extract",
            "abnormal_values": [],
            "recommendations": [],
            "full_summary": content[:500]
        }


def extract_prescription(text: str) -> dict:
    llm = get_llm()

    prompt = f"""You are a pharmacy assistant.
Extract medicines from this prescription.

Return ONLY a JSON object (no extra text):
{{
  "medicines": [
    {{"name": "MedicineName", "dosage": "500mg", "frequency": "twice daily"}}
  ],
  "doctor_name": "Dr. Name",
  "date": "DD/MM/YYYY"
}}

Prescription:
{text[:2000]}"""

    response = llm.invoke(prompt)
    content = response if isinstance(response, str) else response.content

    import json, re
    try:
        json_str = re.search(r'\{.*\}', content, re.DOTALL).group()
        return json.loads(json_str)
    except:
        return {"medicines": [], "doctor_name": "Not found", "date": "Not found"}


def check_drug_interaction(medicines: list[str]) -> str:
    llm = get_llm()

    prompt = f"""You are a clinical pharmacist.
Check for dangerous interactions between these medicines: {', '.join(medicines)}

For each pair, mention:
1. Interaction level (None/Mild/Moderate/Severe)
2. What happens if taken together
3. Recommendation

Be concise and clear."""

    response = llm.invoke(prompt)
    return response if isinstance(response, str) else response.content


def calculate_health_risk(report_text: str) -> dict:
    llm = get_llm()

    prompt = f"""You are a medical risk analyst.
Based on this medical report, calculate a health risk score.

Return ONLY a JSON object:
{{
  "risk_score": 75,
  "risk_level": "High",
  "risk_factors": ["High blood sugar", "High BP"],
  "positive_factors": ["Normal kidney function"],
  "urgency": "See a doctor within 1 week",
  "lifestyle_tips": ["Exercise daily", "Reduce sugar intake"]
}}

Risk score: 0-30 = Low, 31-60 = Medium, 61-80 = High, 81-100 = Critical

Medical Report:
{report_text[:3000]}"""

    response = llm.invoke(prompt)
    content = response if isinstance(response, str) else response.content

    import json, re
    try:
        json_str = re.search(r'\{.*\}', content, re.DOTALL).group()
        return json.loads(json_str)
    except:
        return {
            "risk_score": 50,
            "risk_level": "Medium",
            "risk_factors": ["Could not analyze"],
            "positive_factors": [],
            "urgency": "Please consult a doctor",
            "lifestyle_tips": []
        }