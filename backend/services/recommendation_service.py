"""
Recommendation Service
Generates personalized, LLM-powered carbon reduction recommendations
grounded in the user's actual footprint data and cross-linked to Green Financing products.
"""

import os
import re
import json
import asyncio
import logging
from typing import List, Dict, Optional, Any
from pathlib import Path
from dotenv import load_dotenv

from pydantic import BaseModel, Field

try:
    from google import genai
    from google.genai import types as genai_types
    HAS_GENAI = True
except ImportError:
    genai = None
    genai_types = None
    HAS_GENAI = False


class RecommendationItemSchema(BaseModel):
    category: str = Field(description="The category label corresponding to the customer's spend category")
    title: str = Field(description="Short, specific action title (e.g., 'Switch Daily Commute to EV')")
    description: str = Field(description="2-3 sentence explanation grounded in customer data")
    savingKg: float = Field(description="estimated kg CO2e saved per month")
    savingPct: float = Field(description="percentage reduction within category (0-100)")
    priority: str = Field(description="'high' or 'medium'")
    difficulty: str = Field(description="'easy', 'medium', or 'hard'")
    timeframe: str = Field(description="e.g. Immediate, 1-2 weeks, 1-3 months")
    ctaLabel: str = Field(description="Short call-to-action label")
    linkedProductId: Optional[str] = Field(default=None, description="productId from bank's catalog if relevant, else null")


class RecommendationListSchema(BaseModel):
    recommendations: List[RecommendationItemSchema] = Field(description="List of recommendations, strictly one per category")


load_dotenv()

logger = logging.getLogger(__name__)

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
PROJECT_ID = os.getenv("GCP_PROJECT_ID", "hack-team-aivanguard")
LOCATION = os.getenv("GCP_LOCATION", "us-central1")
if LOCATION == "global":
    LOCATION = "us-central1"

PROJECT_ROOT = Path(__file__).parent.parent.parent

# ─── Hardcoded fallback recommendations ─────────────────────────────────────

FALLBACK_RECOMMENDATIONS = [
    {
        "id": "rec-1",
        "icon": "train",
        "title": "Switch Short-Haul Flights to Train",
        "category": "Transport",
        "priority": "high",
        "description": "Short-haul flights generate approximately 20x more CO₂e per km than trains. Switching one return flight within Europe saves 200-400 kg CO₂e.",
        "savingKg": 310,
        "savingPct": 50,
        "currentKg": 620,
        "projectedKg": 310,
        "difficulty": "easy",
        "timeframe": "1-2 weeks",
        "ctaLabel": "Explore Rail Options",
        "ctaLink": "#",
        "linkedProduct": None,
    },
    {
        "id": "rec-2",
        "icon": "leaf",
        "title": "Reduce Meat Consumption",
        "category": "Food & Drink",
        "priority": "medium",
        "description": "Your food spending suggests a high-meat diet. Replacing 2 meat meals/week with plant-based options cuts food emissions by approximately 25%.",
        "savingKg": 37,
        "savingPct": 27,
        "currentKg": 137,
        "projectedKg": 100,
        "difficulty": "easy",
        "timeframe": "Immediate",
        "ctaLabel": "Sustainable Diet Tips",
        "ctaLink": "#",
        "linkedProduct": None,
    },
    {
        "id": "rec-3",
        "icon": "zap",
        "title": "Switch to Renewable Energy Tariff",
        "category": "Utilities",
        "priority": "high",
        "description": "Your utility provider emits above the national grid average. Switching to a 100% renewable tariff could eliminate your Scope 2 household emissions.",
        "savingKg": 75,
        "savingPct": 100,
        "currentKg": 75,
        "projectedKg": 0,
        "difficulty": "medium",
        "timeframe": "2-4 weeks",
        "ctaLabel": "View Green Energy Loans",
        "ctaLink": "#",
        "linkedProduct": {
            "id": "GRP-IND-003",
            "name": "Rooftop Solar Loan",
            "rate": "From 9.5%",
        },
    },
    {
        "id": "rec-4",
        "icon": "bike",
        "title": "Cycle or Use Public Transport for Short Journeys",
        "category": "Transport",
        "priority": "medium",
        "description": "Your transport spending is your #1 emission source. Replacing car trips under 5 km with cycling or public transport saves ~35% of transport emissions.",
        "savingKg": 68,
        "savingPct": 35,
        "currentKg": 194,
        "projectedKg": 126,
        "difficulty": "easy",
        "timeframe": "Immediate",
        "ctaLabel": "Find Bike Loans",
        "ctaLink": "#",
        "linkedProduct": None,
    },
]

# ─── Icon mapping heuristics ────────────────────────────────────────────────

CATEGORY_ICON_MAP = {
    "transport": "train",
    "fuel": "train",
    "food": "leaf",
    "dining": "leaf",
    "grocer": "leaf",
    "utilit": "zap",
    "energy": "zap",
    "travel": "bike",
}


def _pick_icon(category: str) -> str:
    cat_lower = category.lower()
    for keyword, icon in CATEGORY_ICON_MAP.items():
        if keyword in cat_lower:
            return icon
    return "leaf"


# ─── Green product matching ─────────────────────────────────────────────────

def _load_green_products_summary() -> str:
    """Load a compact summary of green financing products for the LLM prompt."""
    try:
        path = PROJECT_ROOT / "backend" / "green_products_mock_data.json"
        if not path.exists():
            path = Path(__file__).resolve().parent.parent / "green_products_mock_data.json"
        with path.open("r", encoding="utf-8") as fh:
            catalog = json.load(fh)

        lines = []
        for p in catalog.get("products", []):
            if p.get("status") != "ACTIVE":
                continue
            pid = p["productId"]
            name = p["productName"]
            sub = p.get("subCategory", "")
            esg_cat = p.get("esgCriteria", {}).get("esgCategory", "")
            co2 = p.get("esgCriteria", {}).get("estimatedAnnualCO2ReductionKg", "N/A")
            rate_min = p.get("financials", {}).get("interestRateMin", "N/A")
            cust_type = p.get("customerType", "")
            lines.append(
                f"- {pid}: {name} ({sub}) | ESG: {esg_cat} | CO₂ reduction: {co2} kg/yr | Rate from: {rate_min}% | For: {cust_type}"
            )
        return "\n".join(lines)
    except Exception as e:
        logger.warning(f"Could not load green products for recommendation prompt: {e}")
        return ""


def _load_green_products_lookup() -> Dict[str, Dict]:
    """Load a lookup dict of green products by productId for linking."""
    try:
        path = PROJECT_ROOT / "backend" / "green_products_mock_data.json"
        if not path.exists():
            path = Path(__file__).resolve().parent.parent / "green_products_mock_data.json"
        with path.open("r", encoding="utf-8") as fh:
            catalog = json.load(fh)

        lookup = {}
        for p in catalog.get("products", []):
            if p.get("status") != "ACTIVE":
                continue
            rate_min = p.get("financials", {}).get("interestRateMin")
            rate_str = f"From {rate_min}%" if rate_min else "N/A"
            lookup[p["productId"]] = {
                "id": p["productId"],
                "name": p["productName"],
                "rate": rate_str,
            }
        return lookup
    except Exception as e:
        logger.warning(f"Could not load green products lookup: {e}")
        return {}


# ─── Robust JSON Parsing Helper ──────────────────────────────────────────────

def _clean_and_parse_json(text: str) -> Optional[Any]:
    """Clean, repair, and parse JSON string from LLM response."""
    if not text:
        return None
    cleaned = text.strip()

    # 1. Strip markdown code block fences if present
    if "```" in cleaned:
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(1).strip()
        else:
            lines = [l for l in cleaned.split("\n") if not l.strip().startswith("```")]
            cleaned = "\n".join(lines).strip()

    # 2. Extract substring between first '{' and last '}' (or '[' and ']')
    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        cleaned = cleaned[first_brace:last_brace + 1]

    # Attempt 1: Direct JSON parsing
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Attempt 2: Fix trailing commas before closing braces/brackets
    try:
        repaired = re.sub(r",\s*([\}\]])", r"\1", cleaned)
        return json.loads(repaired)
    except json.JSONDecodeError:
        pass

    # Attempt 3: Replace single-quoted property keys/strings with double quotes
    try:
        repaired_sq = re.sub(r"'\s*:\s*", r'": ', cleaned)
        repaired_sq = re.sub(r"([{,]\s*)'", r'\1"', repaired_sq)
        return json.loads(repaired_sq)
    except json.JSONDecodeError:
        pass

    logger.warning("Could not parse LLM output as JSON. Snippet: %s", cleaned[:200])
    return None


# ─── LLM prompt builder ─────────────────────────────────────────────────────

def _build_batch_recommendation_prompt(
    top_categories: List[Dict[str, Any]],
    total_footprint_kg: float,
    green_products_summary: str,
) -> str:
    categories_str = "\n".join([
        f"- {cat['label']}: {cat['kg']:.1f} kg CO₂e ({cat['value']:.1f}% of total)"
        for cat in top_categories
    ])
    return f"""You are an ESG sustainability advisor for a bank. Analyze a customer's carbon emissions across their top spending categories and generate ONE actionable recommendation per category.

## Customer's Carbon Data (Total Monthly Footprint: {total_footprint_kg:.1f} kg CO₂e)
{categories_str}

## Bank's Green Financing Products Catalog:
{green_products_summary}

## Instructions:
For each category listed above, generate exactly one high-impact, realistic recommendation.
- Keep all descriptions concise (1-2 sentences max).
- Ensure savingKg is realistic and less than that category's monthly emissions.
- If a bank green financing product is relevant to the action, set linkedProductId to its exact ID. Otherwise set linkedProductId to null.
- Output ONLY valid JSON matching the schema with a root key "recommendations". Use double quotes for all property names and strings."""


# ─── Core service ────────────────────────────────────────────────────────────

class RecommendationService:
    """Generates and caches personalized recommendations using Gemini."""

    def __init__(self):
        self.client = None
        self._cached_result: Optional[Dict[str, Any]] = None
        self._green_products_lookup: Dict[str, Dict] = {}
        self._init_client()

    def _init_client(self):
        if not HAS_GENAI:
            logger.info("RecommendationService: google-genai package not available. Using fallback recommendations.")
            self.client = None
            return

        try:
            self.client = genai.Client(
                vertexai=True,
                project=PROJECT_ID,
                location=LOCATION,
            )
            logger.info("RecommendationService: Gemini client initialized")
        except Exception as e:
            logger.error(f"RecommendationService: Failed to init Gemini client: {e}")
            self.client = None

    def get_cached_recommendations(self) -> Dict[str, Any]:
        """Return cached recommendations or fallback."""
        if self._cached_result is not None:
            return self._cached_result
        return self._build_fallback_result()

    async def generate_recommendations(self) -> Dict[str, Any]:
        """Generate personalized recommendations from carbon data using a single structured LLM call."""
        from backend.services.carbon_services import get_carbon_service

        try:
            carbon_service = get_carbon_service()
            footprint = carbon_service.calculate_carbon_footprint()

            if not footprint or footprint.get("totalEmissions", 0) == 0:
                logger.warning("No carbon footprint data available, using fallback")
                self._cached_result = self._build_fallback_result()
                return self._cached_result

            total_emissions = footprint["totalEmissions"]
            breakdown = footprint.get("categoryBreakdown", [])

            # Take top 5 categories
            top_categories = breakdown[:5]
            if not top_categories:
                self._cached_result = self._build_fallback_result()
                return self._cached_result

            # Load green products
            green_products_summary = _load_green_products_summary()
            self._green_products_lookup = _load_green_products_lookup()

            current_monthly = footprint.get("kgThisMonth", total_emissions)

            if self.client is None:
                self._init_client()
            if self.client is None:
                logger.error("Gemini client unavailable, using fallback")
                self._cached_result = self._build_fallback_result()
                return self._cached_result

            # Category map for quick metric lookup
            cat_map = {cat["label"].lower(): cat for cat in top_categories}

            prompt = _build_batch_recommendation_prompt(
                top_categories=top_categories,
                total_footprint_kg=current_monthly,
                green_products_summary=green_products_summary,
            )

            config = genai_types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=4096,
                response_mime_type="application/json",
                response_schema=RecommendationListSchema if HAS_GENAI else None,
            )

            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=MODEL_NAME,
                contents=[genai_types.Content(
                    role="user",
                    parts=[genai_types.Part.from_text(text=prompt)],
                )],
                config=config,
            )

            parsed_list = []
            if response and getattr(response, "parsed", None) is not None:
                try:
                    if hasattr(response.parsed, "recommendations"):
                        parsed_list = [
                            item.model_dump() if hasattr(item, "model_dump") else item
                            for item in response.parsed.recommendations
                        ]
                    elif isinstance(response.parsed, dict):
                        parsed_list = response.parsed.get("recommendations", [])
                    elif isinstance(response.parsed, list):
                        parsed_list = response.parsed
                except Exception as e:
                    logger.warning(f"Failed to extract from response.parsed: {e}")

            if not parsed_list and response and getattr(response, "text", None):
                raw_dict = _clean_and_parse_json(response.text)
                if isinstance(raw_dict, dict):
                    parsed_list = raw_dict.get("recommendations", [])
                elif isinstance(raw_dict, list):
                    parsed_list = raw_dict

            if not parsed_list:
                logger.warning("Empty LLM recommendation list, using fallback")
                self._cached_result = self._build_fallback_result()
                return self._cached_result

            recommendations = []
            for i, item in enumerate(parsed_list):
                cat_label = item.get("category", "")
                matched_cat = cat_map.get(cat_label.lower())
                if not matched_cat and i < len(top_categories):
                    matched_cat = top_categories[i]
                    cat_label = matched_cat["label"]

                cat_kg = matched_cat["kg"] if matched_cat else 100.0
                raw_saving = float(item.get("savingKg", 10.0))
                saving_pct = float(item.get("savingPct", 20.0))

                # Sanity check: Ensure savingKg is realistic and relative to monthly category emissions (cat_kg)
                if raw_saving > cat_kg or raw_saving > current_monthly:
                    effective_pct = min(saving_pct if 0 < saving_pct <= 50 else 20.0, 50.0)
                    saving_kg = round(cat_kg * (effective_pct / 100.0), 2)
                else:
                    saving_kg = round(raw_saving, 2)

                # Cap maximum saving at 80% of category monthly emissions
                saving_kg = min(saving_kg, round(cat_kg * 0.8, 2))
                effective_pct = round((saving_kg / cat_kg * 100) if cat_kg > 0 else saving_pct, 1)

                rec = {
                    "id": f"rec-{i + 1}",
                    "title": item.get("title", f"Optimize {cat_label}"),
                    "description": item.get("description", ""),
                    "category": cat_label,
                    "priority": item.get("priority", "medium"),
                    "difficulty": item.get("difficulty", "medium"),
                    "timeframe": item.get("timeframe", "1-2 weeks"),
                    "savingKg": saving_kg,
                    "savingPct": effective_pct,
                    "currentKg": round(cat_kg, 2),
                    "projectedKg": round(max(0, cat_kg - saving_kg), 2),
                    "ctaLabel": item.get("ctaLabel", "Take Action"),
                    "ctaLink": "#",
                    "icon": _pick_icon(cat_label),
                }

                linked_id = item.get("linkedProductId")
                if linked_id and linked_id in self._green_products_lookup:
                    rec["linkedProduct"] = self._green_products_lookup[linked_id]
                else:
                    rec["linkedProduct"] = None

                recommendations.append(rec)

            if not recommendations:
                self._cached_result = self._build_fallback_result()
                return self._cached_result

            total_saving = sum(r["savingKg"] for r in recommendations)
            projected_footprint = max(0, current_monthly - total_saving)

            self._cached_result = {
                "currentFootprint": round(current_monthly, 2),
                "projectedFootprint": round(projected_footprint, 2),
                "totalPotentialSaving": round(total_saving, 2),
                "recommendations": recommendations,
            }

            logger.info(
                f"Generated {len(recommendations)} recommendations via structured LLM output. "
                f"Current: {current_monthly:.0f} kg → Projected: {projected_footprint:.0f} kg"
            )
            return self._cached_result

        except Exception as e:
            logger.error(f"Recommendation generation failed: {e}", exc_info=True)
            self._cached_result = self._build_fallback_result()
            return self._cached_result

    def _build_fallback_result(self) -> Dict[str, Any]:
        """Build response using hardcoded fallback recommendations."""
        total_saving = sum(r["savingKg"] for r in FALLBACK_RECOMMENDATIONS)
        current = 620  # Default fallback value
        return {
            "currentFootprint": current,
            "projectedFootprint": round(max(0, current - total_saving), 2),
            "totalPotentialSaving": total_saving,
            "recommendations": FALLBACK_RECOMMENDATIONS,
        }


# ─── Singleton ───────────────────────────────────────────────────────────────

_recommendation_service: Optional[RecommendationService] = None


def get_recommendation_service() -> RecommendationService:
    global _recommendation_service
    if _recommendation_service is None:
        _recommendation_service = RecommendationService()
    return _recommendation_service
