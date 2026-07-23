import os
import logging
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv
try:
    from google import genai
    from google.genai import types as genai_types
    HAS_GENAI = True
except ImportError:
    genai = None
    genai_types = None
    HAS_GENAI = False

from backend.services.carbon_services import get_carbon_service

load_dotenv()

logger = logging.getLogger(__name__)

# Default model configuration from .env or fallback
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
PROJECT_ID = os.getenv("GCP_PROJECT_ID", "hack-team-aivanguard")
LOCATION = os.getenv("GCP_LOCATION", "us-central1")
if LOCATION == "global":
    LOCATION = "us-central1"  # Vertex AI regional default for gemini models

class EAIChatService:
    """Service to handle AI chat queries using Gemini model on Vertex AI"""
    
    def __init__(self):
        self.client = None
        self._init_client()

    def _init_client(self):
        if not HAS_GENAI:
            self.client = None
            return
        try:
            self.client = genai.Client(
                vertexai=True,
                project=PROJECT_ID,
                location=LOCATION
            )
            logger.info(f"Initialized GenAI client for project {PROJECT_ID} in {LOCATION}")
        except Exception as e:
            logger.error(f"Failed to initialize GenAI client: {e}")
            self.client = None


    def _build_system_context(self) -> str:
        """Fetch live ESG and Carbon data to build rich context for Gemini"""
        context_parts = [
            "You are esgAdvisor AI, an expert ESG and Carbon Analytics Assistant.",
            "RESPONSE STYLE RULES (follow strictly):",
            "- Be concise. Keep answers short and scannable — aim for 3-6 bullet points max.",
            "- NEVER use markdown headings (no #, ##, ###). Use **bold text** for emphasis instead.",
            "- Use short bullet points (- ) for lists. No numbered sub-lists unless explicitly asked.",
            "- Avoid long paragraphs. One to two sentences per point.",
            "- Be direct, professional, and actionable. Skip filler phrases.",
            "- If the user asks a simple question, give a simple answer."
        ]
        
        try:
            carbon_service = get_carbon_service()
            footprint = carbon_service.calculate_carbon_footprint()
            
            if footprint:
                kg_this_month = footprint.get('kgThisMonth', 0)
                kg_last_month = footprint.get('kgLastMonth', 0)
                vs_last_month = footprint.get('vsLastMonth', 0)
                top_category = footprint.get('topEmissionCategory', 'Unknown')
                breakdown = footprint.get('categoryBreakdown', [])
                
                context_parts.append("\n=== LIVE USER ESG CONTEXT ===")
                context_parts.append(f"- Emissions This Month: {kg_this_month:.1f} kg CO2e")
                context_parts.append(f"- Emissions Last Month: {kg_last_month:.1f} kg CO2e")
                context_parts.append(f"- Month-over-Month Change: {vs_last_month:+.1f}%")
                context_parts.append(f"- Top Emission Category: {top_category}")
                
                if breakdown:
                    cat_summary = ", ".join([f"{c['label']}: {c['value']:.1f}% ({c['kg']:.1f} kg)" for c in breakdown[:4]])
                    context_parts.append(f"- Top Category Breakdown: {cat_summary}")
        except Exception as e:
            logger.warning(f"Could not load live carbon footprint context: {e}")
            
        return "\n".join(context_parts)

    def generate_response(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None,
        include_context: bool = True
    ) -> Dict[str, Any]:
        """
        Generate AI response for user message using Gemini with conversation history
        """
        if not self.client:
            self._init_client()
            if not self.client:
                return {
                    "reply": "I'm currently operating in offline mode. GenAI client initialization failed. Please verify API configuration.",
                    "suggested_actions": ["How to reduce carbon footprint?", "What is ESG scoring?"]
                }
        
        system_instruction = self._build_system_context() if include_context else "You are esgAdvisor AI, an expert ESG Assistant."
        
        # Build contents list from history + current message
        contents = []
        if history:
            for item in history:
                role = item.get("role")
                content = item.get("content")
                if role in ["user", "model", "assistant"] and content:
                    norm_role = "user" if role == "user" else "model"
                    contents.append(genai_types.Content(
                        role=norm_role,
                        parts=[genai_types.Part.from_text(text=content)]
                    ))
        
        contents.append(genai_types.Content(
            role="user",
            parts=[genai_types.Part.from_text(text=message)]
        ))

        try:
            config = genai_types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                max_output_tokens=1024,
            )

            response = self.client.models.generate_content(
                model=MODEL_NAME,
                contents=contents,
                config=config
            )

            reply_text = response.text if response and response.text else "I could not process your request at this time."
            
            # Generate relevant follow-up prompt suggestions
            suggested_actions = self._generate_suggested_actions(message, reply_text)

            return {
                "reply": reply_text,
                "suggested_actions": suggested_actions
            }

        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return {
                "reply": f"Sorry, I encountered an issue processing your ESG query: {str(e)}",
                "suggested_actions": [
                    "How can I cut emissions by 10%?",
                    "What green financing is available?"
                ]
            }

    def _generate_suggested_actions(self, user_msg: str, bot_reply: str) -> List[str]:
        """Generate smart follow-up suggestions based on conversation topic"""
        lower_msg = user_msg.lower()
        if "transport" in lower_msg or "travel" in lower_msg or "flight" in lower_msg:
            return [
                "What is EV fleet optimization?",
                "How to lower business travel emissions?",
                "Show carbon footprint breakdown"
            ]
        elif "financing" in lower_msg or "loan" in lower_msg or "green" in lower_msg:
            return [
                "What are Sustainability-Linked Loans?",
                "How do I qualify for green financing?",
                "What are key ESG disclosure rules?"
            ]
        elif "score" in lower_msg or "esg" in lower_msg:
            return [
                "How is my ESG score calculated?",
                "Top 3 actions to boost ESG rating",
                "What are Scope 1, 2, and 3 emissions?"
            ]
        else:
            return [
                "How can I reduce Scope 3 emissions?",
                "What green loans match my profile?",
                "Summarize my carbon footprint"
            ]

# Singleton instance
_ai_chat_service = None

def get_ai_chat_service() -> EAIChatService:
    global _ai_chat_service
    if _ai_chat_service is None:
        _ai_chat_service = EAIChatService()
    return _ai_chat_service
