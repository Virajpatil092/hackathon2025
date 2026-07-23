"""
ESG Chat Routes
REST API endpoints for AI Chat Assistant interactions
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.services.ai_chat_service import get_ai_chat_service

router = APIRouter(prefix="/api/v1/chat", tags=["AI Chat Assistant"])


# ─── Request & Response Models ────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" or "model" / "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    include_user_context: Optional[bool] = True


class ChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str]
    timestamp: str


class SuggestedPromptsResponse(BaseModel):
    prompts: List[str]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/message", response_model=ChatResponse)
def send_chat_message(request: ChatRequest):
    """
    Send a message to the ESG AI Assistant (powered by Gemini)
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")
    
    chat_service = get_ai_chat_service()
    
    # Convert history models to dict list
    history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.history] if request.history else []
    
    res = chat_service.generate_response(
        message=request.message.strip(),
        history=history_dicts,
        include_context=request.include_user_context
    )
    
    return ChatResponse(
        reply=res["reply"],
        suggested_actions=res.get("suggested_actions", []),
        timestamp=datetime.now().isoformat()
    )


@router.get("/suggested-prompts", response_model=SuggestedPromptsResponse)
def get_suggested_prompts():
    """
    Get starter prompts for the ESG Advisor chat assistant
    """
    prompts = [
        "Summarize my carbon footprint for this month",
        "How can I cut my business travel emissions by 15%?",
        "What green financing products suit my business?",
        "Explain key actions to improve my ESG score"
    ]
    return SuggestedPromptsResponse(prompts=prompts)
