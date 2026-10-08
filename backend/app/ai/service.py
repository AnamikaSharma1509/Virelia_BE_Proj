import httpx
import json
import logging
from typing import Dict, Any, List
from app.core.config import settings
from app.ai.provider import AIProvider
from app.ai.fallback import LocalFallbackProvider

logger = logging.getLogger(__name__)

class OpenAICompatibleProvider(AIProvider):
    def __init__(self, api_key: str, model: str, base_url: str = None):
        self.api_key = api_key
        self.model = model
        self.base_url = (base_url or "https://api.openai.com/v1").rstrip("/")
        self.fallback = LocalFallbackProvider()

    def analyze_written_assessment(self, answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            answers_text = "\n\n".join([
                f"Question: {a.get('question_text', 'N/A')}\nAnswer: {a.get('written_answer', 'N/A')}"
                for a in answers if a.get("written_answer")
            ])
            if not answers_text.strip():
                return self.fallback.analyze_written_assessment(answers)

            prompt = (
                "You are an AI assistant for Virelia, a guided confidence-building platform for students.\n"
                "Review the following self-reported written assessment answers.\n"
                "STRICT SAFETY RULES:\n"
                "- Do NOT diagnose, classify anxiety severity, or claim to treat disorders.\n"
                "- Summarize stated points factually and identify practical communication or preparation themes.\n"
                "- Output strictly valid JSON matching this schema:\n"
                "{\n"
                '  "summary": "concise factual summary",\n'
                '  "observed_themes": ["theme 1", "theme 2"],\n'
                '  "strengths": ["strength 1"],\n'
                '  "practice_suggestions": ["practical suggestion 1"],\n'
                '  "limitations": ["non-diagnostic limitations note"],\n'
                '  "requires_human_review": true\n'
                "}\n\n"
                f"PATIENT RESPONSES:\n{answers_text}"
            )

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "response_format": {"type": "json_object"}
            }

            with httpx.Client(timeout=15.0) as client:
                res = client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    parsed["requires_human_review"] = True
                    return parsed
                else:
                    logger.warning(f"OpenAI API returned status {res.status_code}, falling back to local provider.")
                    return self.fallback.analyze_written_assessment(answers)
        except Exception as e:
            logger.error(f"Error calling external AI API: {e}. Using fallback.")
            return self.fallback.analyze_written_assessment(answers)

    def summarize_exposure_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        return self.fallback.summarize_exposure_session(session_data)

def get_ai_provider() -> AIProvider:
    if settings.AI_PROVIDER == "openai" and settings.AI_API_KEY:
        return OpenAICompatibleProvider(
            api_key=settings.AI_API_KEY,
            model=settings.AI_MODEL,
            base_url=settings.AI_BASE_URL
        )
    return LocalFallbackProvider()
