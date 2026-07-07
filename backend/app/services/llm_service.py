LANGUAGE_CODES = {
    "english": "en",
    "hindi": "hi",
    "tamil": "ta",
    "telugu": "te",
    "kannada": "kn",
    "malayalam": "ml",
    "marathi": "mr",
    "bengali": "bn",
    "gujarati": "gu",
    "punjabi": "pa",
    "urdu": "ur",
    "spanish": "es",
    "french": "fr",
    "german": "de",
    "portuguese": "pt",
    "russian": "ru",
    "arabic": "ar",
    "chinese": "zh-CN",
    "japanese": "ja",
    "korean": "ko",
}
def get_llm():
    """
    Picks the LLM backend based on app.core.config.settings:
      - LLM_PROVIDER="gemini"  -> always use Gemini (needs GEMINI_API_KEY)
      - LLM_PROVIDER="ollama"  -> always use local Ollama
      - LLM_PROVIDER="auto"    -> use Gemini if a key is set, else fall back to Ollama

    This makes the .env / config.py settings actually control what runs,
    instead of silently always using Ollama regardless of GEMINI_API_KEY.
    """
    from app.core.config import settings

    provider = settings.LLM_PROVIDER.lower()
    use_gemini = provider == "gemini" or (provider == "auto" and bool(settings.GEMINI_API_KEY))

    if use_gemini:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError(
                "LLM_PROVIDER is set to 'gemini' but GEMINI_API_KEY is empty in .env"
            )
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            print(f"✅ Using Gemini ({settings.GEMINI_MODEL})")
            return ChatGoogleGenerativeAI(
                model=settings.GEMINI_MODEL,
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.3,
            )
        except Exception as e:
            print(f"⚠️ Gemini init failed ({e}), falling back to Ollama")

    from langchain_community.llms import Ollama
    print(f"✅ Using Ollama local model ({settings.OLLAMA_MODEL})")
    return Ollama(model=settings.OLLAMA_MODEL, base_url=settings.OLLAMA_BASE_URL)


def _invoke(llm, prompt: str) -> str:
    """Normalizes the return value across Ollama (str) and Gemini/Chat models (AIMessage)."""
    response = llm.invoke(prompt)
    return response if isinstance(response, str) else response.content


def _translate_if_needed(text: str, language: str) -> str:
    """
    Translates text to the requested language if it isn't English.
    Used so /query and /summarize actually honor the `language` field
    instead of silently ignoring it.
    """
    lang = (language or "english").lower()
    if lang == "english" or not text:
        return text

    target = LANGUAGE_CODES.get(lang)
    if not target:
        return text  # unknown language code, just return the original

    try:
        from deep_translator import GoogleTranslator
        # GoogleTranslator has a ~5000 char limit per call; chunk long text.
        if len(text) <= 4500:
            return GoogleTranslator(source="auto", target=target).translate(text)

        chunks = [text[i:i + 4500] for i in range(0, len(text), 4500)]
        translated = [GoogleTranslator(source="auto", target=target).translate(c) for c in chunks]
        return " ".join(translated)
    except Exception as e:
        print(f"⚠️ Translation failed ({e}), returning original text")
        return text


def _format_history(history: list) -> str:
    """Turns a list of {role, text} chat turns into readable prompt context."""
    if not history:
        return ""
    lines = []
    for turn in history[-6:]:  # keep only the last few turns so prompts don't blow up
        role = "User" if turn.get("role") == "user" else "Assistant"
        lines.append(f"{role}: {turn.get('text', '')}")
    return "\n".join(lines)


def ask_question(context_chunks: list[str], question: str, history: list = None, language: str = "english") -> str:
    llm = get_llm()
    context = "\n\n".join(context_chunks)
    history_text = _format_history(history or [])

    # Built as a plain variable (not a nested f-string) because Python 3.11
    # and earlier don't allow a backslash inside an f-string's {...} part —
    # this bit it during the Render deploy.
    history_block = ""
    if history_text:
        history_block = f"Here is the conversation so far, for context on follow-up questions:\n{history_text}\n"

    prompt = f"""You are a helpful medical document assistant.
Use ONLY the context below to answer the question.
If the answer is not in the context, say "I couldn't find that in the document."
{history_block}
Context:
{context}

Question: {question}

Answer:"""

    answer = _invoke(llm, prompt)
    return _translate_if_needed(answer, language)

def summarize_medical_report(text: str, language: str = "english") -> dict:
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

    content = _invoke(llm, prompt)

    import json, re
    try:
        json_str = re.search(r'\{.*\}', content, re.DOTALL).group()
        result = json.loads(json_str)
    except:
        result = {
            "patient_name": "Could not extract",
            "diagnosis": "Could not extract",
            "abnormal_values": [],
            "recommendations": [],
            "full_summary": content[:500]
        }

    if (language or "english").lower() != "english":
        result["diagnosis"] = _translate_if_needed(result.get("diagnosis", ""), language)
        result["full_summary"] = _translate_if_needed(result.get("full_summary", ""), language)
        result["abnormal_values"] = [_translate_if_needed(v, language) for v in result.get("abnormal_values", [])]
        result["recommendations"] = [_translate_if_needed(r, language) for r in result.get("recommendations", [])]

    return result


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

    content = _invoke(llm, prompt)

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

For each pair mention:
1. Interaction level (None/Mild/Moderate/Severe)
2. What happens if taken together
3. Recommendation

Be concise and clear."""

    return _invoke(llm, prompt)


def calculate_health_risk(report_text: str) -> dict:
    llm = get_llm()

    prompt = f"""You are a medical risk analyst.
Based on this medical report, calculate a health risk score.

Return ONLY a JSON object (no extra text):
{{
  "risk_score": 75,
  "risk_level": "High",
  "risk_factors": ["High blood sugar", "High BP"],
  "positive_factors": ["Normal kidney function"],
  "urgency": "See a doctor within 1 week",
  "lifestyle_tips": ["Exercise daily", "Reduce sugar intake"]
}}

Risk score guide: 0-30 Low, 31-60 Medium, 61-80 High, 81-100 Critical

Medical Report:
{report_text[:3000]}"""

    content = _invoke(llm, prompt)

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


def generate_doctor_note(text: str, patient_name: str = None, language: str = "english") -> str:
    """
    Turns raw uploaded document text (lab results, symptoms notes, prior reports)
    into a professional-sounding doctor's note / clinical summary.
    """
    llm = get_llm()

    name_line = f"The patient's name is {patient_name}." if patient_name else ""

    prompt = f"""You are an experienced physician writing a formal clinical note based on the
patient information and/or report below. {name_line}

Write a professional doctor's note with these sections, using clear clinical language:
- Chief Complaint
- History / Findings (summarize what's in the source material)
- Assessment
- Plan / Recommendations
- Follow-up

Keep it factual and grounded only in what's in the source text below — do not invent
lab values, medications, or history that isn't present. If a section has nothing
relevant in the source, write "Not documented" for that section.

Source material:
{text[:3500]}

Doctor's Note:"""

    note = _invoke(llm, prompt)
    return _translate_if_needed(note, language)