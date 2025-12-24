import os
import json
import logging
import google.generativeai as genai
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def configure_llm():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.warning("GOOGLE_API_KEY not found. AI features will be simulated.")
        return False
    genai.configure(api_key=api_key)
    return True

def generate_case_plan_llm(scenario: str, user_story: str, chunks: List[str]) -> Dict[str, Any]:
    """
    Generates a case plan (Checklist, Timeline, Risks) using Gemini.
    """
    if not configure_llm():
        return None

    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Context compression
        context_text = "\n".join(chunks[:20]) # Limit to first 20 chunks for speed/cost if large
        if len(context_text) > 30000:
            context_text = context_text[:30000] + "...(truncated)"

        prompt = f"""
        You are an expert immigration legal assistant. Your task is to analyze the user's situation and documents to generate a precise, actionable case plan.
        
        Context:
        - User Scenario: {scenario}
        - User Story: {user_story}
        - Document Extracts:
        {context_text}
        
        Output Format (JSON Only):
        {{
            "checklist": [
                {{ "label": "Action Item Title", "notes": "Detailed instructions", "status": "todo", "evidence_keywords": ["keyword1", "keyword2"] }}
            ],
            "timeline": [
                {{ "label": "Task Title", "due_date": "Date or Timeframe", "owner": "user", "notes": "Why this matters", "evidence_keywords": ["keyword"] }}
            ],
            "risks": [
                {{ "category": "category_name", "severity": "high/medium/low", "statement": "Risk Title", "reason": "Explanation why", "evidence_keywords": ["keyword"] }}
            ]
        }}
        
        Instructions:
        1. Analyze the User Story heavily. If they say "I don't have a stamp", that is a critical fact.
        2. Cross-reference with Document Extracts. If a document is missing (e.g., Marriage Cert mentioned but not found), flag it as a risk.
        3. Be specific. Do not give generic advice. Give advice tailored to the visible facts.
        4. For "evidence_keywords", return 2-3 unique words from the source text that justify your finding.
        """

        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"LLM Generation Failed: {e}", exc_info=True)
        return None

def generate_chat_response(message: str, history: List[Dict[str, str]] = []) -> str:
    """
    Generates a conversational response using Gemini.
    """
    if not configure_llm():
        return "I'm having trouble connecting to my AI brain. Please check the API key configuration."

    # Fallback chain for Free Tier resilience
    models_to_try = [
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash', 
        'gemini-flash-latest',
        'gemini-pro-latest'
    ]

    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name)
            chat = model.start_chat(history=[])
            system_prompt = "You are Samaritan, a compassionate and knowledgeable immigration assistant. Answer the user's question concisely. If you don't know, suggest they check the 'Resources' or 'attorneys' section."
            response = chat.send_message(f"{system_prompt}\n\nUser: {message}")
            return response.text
        except Exception as e:
            logger.warning(f"Model {model_name} failed: {e}")
            continue

    logger.error("All Gemini models failed.")
    return "I apologize, but I'm unable to connect to the AI service right now. Please try again later."
