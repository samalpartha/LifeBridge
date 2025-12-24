import os
import json
import logging
import httpx
import google.generativeai as genai
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

# --- Abstract Provider Interface ---
class LLMProvider(ABC):
    @abstractmethod
    def generate_case_plan(self, scenario: str, user_story: str, chunks: List[str]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def chat(self, message: str, history: List[Dict[str, str]] = []) -> str:
        pass

# --- Google Gemini Provider (Primary) ---
class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        
    def generate_case_plan(self, scenario: str, user_story: str, chunks: List[str]) -> Optional[Dict[str, Any]]:
        try:
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            # Context compression
            context_text = "\n".join(chunks[:20]) 
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
            logger.error(f"Gemini Case Plan Failed: {e}", exc_info=True)
            return None

    def chat(self, message: str, history: List[Dict[str, str]] = []) -> str:
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
                # Convert history format if needed, simplified here
                chat = model.start_chat(history=[]) 
                system_prompt = "You are Samaritan, a compassionate and knowledgeable immigration assistant. Answer the user's question concisely. If you don't know, suggest they check the 'Resources' or 'attorneys' section."
                response = chat.send_message(f"{system_prompt}\n\nUser: {message}")
                return response.text
            except Exception as e:
                logger.warning(f"Model {model_name} failed: {e}")
                continue
        
        return "I apologize, but I'm unable to connect to the Google AI service right now."

# --- LocalAI / OpenAI Compatible Provider (Backup) ---
class LocalAIProvider(LLMProvider):
    def __init__(self, base_url: str, model_name: str, api_key: str = "sk-local"):
        self.base_url = base_url.rstrip('/')
        self.model_name = model_name
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }

    def _call_completion(self, messages: List[Dict[str, str]], json_mode: bool = False) -> Optional[str]:
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.2,
        }
        if json_mode:
             # Basic attempt at JSON mode, LocalAI support varies by backend
            payload["response_format"] = {"type": "json_object"}

        try:
            # Using synchronous call here to match existing sync interface, 
            # but ideally this should be async or threaded.
            with httpx.Client(timeout=60.0) as client:
                resp = client.post(url, headers=self.headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data['choices'][0]['message']['content']
        except Exception as e:
            logger.error(f"LocalAI Call Failed: {e}", exc_info=True)
            return None

    def generate_case_plan(self, scenario: str, user_story: str, chunks: List[str]) -> Optional[Dict[str, Any]]:
        context_text = "\n".join(chunks[:10]) # Smaller context for local models
        if len(context_text) > 8000:
             context_text = context_text[:8000] + "...(truncated)"

        system_prompt = """You are an expert immigration legal assistant. Output strictly valid JSON."""
        user_prompt = f"""
        Analyze this case:
        Scenario: {scenario}
        User Story: {user_story}
        Docs: {context_text}

        Return a JSON object with keys: "checklist", "timeline", "risks".
        Example Item: {{ "label": "Text", "notes": "Text", "status": "todo", "evidence_keywords": ["word"] }}
        """
        
        try:
            content = self._call_completion([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ], json_mode=True)
            
            if not content: return None
            
            # extract json block if wrapped in markdown
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
                
            return json.loads(content)
        except Exception as e:
            logger.error(f"LocalAI JSON Parsing Failed: {e}")
            return None

    def chat(self, message: str, history: List[Dict[str, str]] = []) -> str:
        res = self._call_completion([
             {"role": "system", "content": "You are Samaritan, a helpful immigration assistant."},
             {"role": "user", "content": message}
        ])
        return res or "LocalAI is currently unavailable or unresponsive."


# --- Factory & Global Access ---

def get_llm_provider() -> LLMProvider:
    provider_type = os.getenv("LLM_PROVIDER", "google").lower()
    
    if provider_type == "local":
        base_url = os.getenv("LOCALAI_BASE_URL", "http://host.docker.internal:8080/v1")
        model = os.getenv("LOCALAI_MODEL", "llama-3.2-8b-instruct")
        logger.info(f"Using LocalAI Provider: {base_url} ({model})")
        return LocalAIProvider(base_url, model)
    
    # Default to Google
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.warning("GOOGLE_API_KEY missing. AI features heavily degraded.")
        # Minimal mock provider could go here, or just fail gracefully later
    else:
        logger.info("Using Google Gemini Provider")
        
    return GeminiProvider(api_key=api_key if api_key else "dummy")


# Backwards compatibility wrappers
def generate_case_plan_llm(scenario: str, user_story: str, chunks: List[str]) -> Dict[str, Any]:
    provider = get_llm_provider()
    return provider.generate_case_plan(scenario, user_story, chunks)

def generate_chat_response(message: str, history: List[Dict[str, str]] = []) -> str:
    provider = get_llm_provider()
    return provider.chat(message, history)
