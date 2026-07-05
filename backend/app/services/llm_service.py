from app.core.config import settings

def get_llm():
    """
    Returns the Gemini AI model (FREE tier!).
    👶 This is the actual brain that reads and answers questions!
    """
    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",   # FREE model!
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.3,            # Lower = more factual (good for medical!)
    )

def ask_question(context_chunks: list[str], question: str) -> str:
    """
    Give context + question to AI, get answer back.
    👶 Like showing a student the textbook pages, then asking the question!
    """
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
    """
    Extract key info from a medical report.
    👶 Like reading a 20-page report and writing a 1-page summary!
    """
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
    """
    Pull out medicine names and dosages from a prescription.
    👶 Like reading a doctor's note and making a medicine table!
    """
    llm = get_llm()

    prompt = f"""You are a pharmacy assistant.
Extract all medicines and their dosages from this prescription.

Return ONLY a JSON object like this:
{{
  "medicines": [
    {{"name": "Paracetamol", "dosage": "500mg", "frequency": "twice daily"}},
    {{"name": "Amoxicillin", "dosage": "250mg", "frequency": "three times daily"}}
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