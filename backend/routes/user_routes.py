# User & Dashboard Routes

from fastapi import APIRouter, HTTPException
from typing import List, Dict
from datetime import datetime
from pydantic import BaseModel
from ..services.carbon_services import get_carbon_service

router = APIRouter(prefix="/api/v1", tags=["User & Dashboard"])

# ─── Response Models ───────────────────────────────────────────────────────────

class User(BaseModel):
    id: str
    name: str
    email: str
    initials: str
    company: str
    role: str
    joinedAt: str


class DashboardSummary(BaseModel):
    totalEmissions: float
    emissionsUnit: str
    emissionsChangePct: float
    monthlyTarget: float
    targetProgressPct: float
    activeRecommendations: int
    potentialSavings: float
    esgScore: int
    esgScoreChange: int
    goalsOnTrack: int
    totalGoals: int
    greenProductsAvailable: int
    streakDays: int


class Goal(BaseModel):
    id: str
    title: str
    current: float
    target: float
    unit: str
    deadline: str
    progress: float
    status: str


class Activity(BaseModel):
    id: str
    date: str
    action: str
    impact: str
    category: str


# ─── User Endpoints ───────────────────────────────────────────────────────────

@router.get("/user/me", response_model=User)
def get_current_user():
    """Get current user profile"""
    return {
        "id": "usr_001",
        "name": "Jane Smith",
        "email": "jane.smith@example.com",
        "initials": "JS",
        "company": "GreenTech Solutions Ltd",
        "role": "Sustainability Lead",
        "joinedAt": "2025-01-15",
    }


@router.get("/user/settings")
def get_user_settings():
    """Get user settings"""
    return {
        "theme": "light",
        "notifications": True,
        "currency": "EUR",
        "language": "en",
    }


@router.patch("/user/settings")
def update_user_settings(settings: Dict):
    """Update user settings"""
    return {"success": True, "settings": settings}


# ─── Dashboard Endpoints ───────────────────────────────────────────────────────

@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary():
    """Get dashboard summary with carbon footprint data from CSV"""
    try:
        service = get_carbon_service()
        footprint = service.calculate_carbon_footprint()
        
        # Calculate progress and metrics
        total_emissions = footprint.get('kgThisMonth', 620)
        monthly_target = 500
        target_progress = (total_emissions / monthly_target * 100) if monthly_target > 0 else 0
        potential_savings = sum(cat.get('kg', 0) * 0.3 for cat in footprint.get('categoryBreakdown', []))  # 30% reduction potential
        
        # Get active green products count from greenProductsService
        try:
            from ..services.greenProductsService import get_available_green_products
            available_products = get_available_green_products()
            green_products_count = len(available_products)
        except Exception:
            green_products_count = 4

        recommendations_count = len(get_recommendations())
        
        return {
            "totalEmissions": round(total_emissions, 1),
            "emissionsUnit": "kg CO₂e",
            "emissionsChangePct": footprint.get('vsLastMonth', -2.8),
            "monthlyTarget": monthly_target,
            "targetProgressPct": min(round(target_progress, 1), 100),  # Cap at 100%
            "activeRecommendations": recommendations_count,
            "potentialSavings": round(potential_savings, 2),
            "esgScore": 72,
            "esgScoreChange": 3,
            "goalsOnTrack": 3,
            "totalGoals": 5,
            "greenProductsAvailable": green_products_count,
            "streakDays": 28,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard: {str(e)}")


@router.get("/dashboard/trends")
def get_dashboard_trends():
    """Get dashboard trends data"""
    try:
        service = get_carbon_service()
        trend_data = service.get_carbon_trend(months=6)
        
        # Format as monthly summary with target
        result = []
        if trend_data:
            for item in trend_data:
                month = item.get('month', '')
                data_dict = item.get('data', {})
                if isinstance(data_dict, dict):
                    total_co2 = sum(float(v) if isinstance(v, (int, float)) else 0 for v in data_dict.values())
                else:
                    total_co2 = 0
                result.append({
                    "month": month,
                    "emissions": round(total_co2, 2),
                    "target": 500
                })
        else:
            # Fallback data if service returns empty
            result = [
                {"month": "Feb 2026", "emissions": 720, "target": 550},
                {"month": "Mar 2026", "emissions": 680, "target": 550},
                {"month": "Apr 2026", "emissions": 710, "target": 540},
                {"month": "May 2026", "emissions": 655, "target": 530},
                {"month": "Jun 2026", "emissions": 638, "target": 520},
                {"month": "Jul 2026", "emissions": 620, "target": 500},
            ]
        
        return result
    except Exception as e:
        # Return fallback data on error
        return [
            {"month": "Feb 2026", "emissions": 720, "target": 550},
            {"month": "Mar 2026", "emissions": 680, "target": 550},
            {"month": "Apr 2026", "emissions": 710, "target": 540},
            {"month": "May 2026", "emissions": 655, "target": 530},
            {"month": "Jun 2026", "emissions": 638, "target": 520},
            {"month": "Jul 2026", "emissions": 620, "target": 500},
        ]


# ─── Goals Endpoints ───────────────────────────────────────────────────────────

@router.get("/goals", response_model=List[Goal])
def get_goals():
    """Get user goals with live emissions metrics"""
    current_emissions = 620.0
    try:
        service = get_carbon_service()
        footprint = service.calculate_carbon_footprint()
        current_emissions = footprint.get('kgThisMonth', 620.0)
    except Exception:
        pass

    # Goal 1 target is 500, baseline ~720
    target_1 = 500.0
    baseline_1 = 720.0
    progress_1 = max(0, min(100, int((1 - (current_emissions - target_1) / (baseline_1 - target_1)) * 100))) if current_emissions > target_1 else 100

    return [
        {
            "id": "goal-1",
            "title": "Reduce monthly emissions to 500 kg",
            "current": round(current_emissions, 1),
            "target": target_1,
            "unit": "kg CO₂e",
            "deadline": "2026-12-31",
            "progress": progress_1,
            "status": "on-track" if progress_1 >= 50 else "behind"
        },
        {
            "id": "goal-2",
            "title": "Switch to 100% renewable electricity",
            "current": 40,
            "target": 100,
            "unit": "%",
            "deadline": "2026-09-30",
            "progress": 40,
            "status": "on-track"
        },
        {
            "id": "goal-3",
            "title": "Replace 50% of car trips with cycling",
            "current": 15,
            "target": 50,
            "unit": "%",
            "deadline": "2026-12-31",
            "progress": 30,
            "status": "behind"
        },
        {
            "id": "goal-4",
            "title": "Plant-based meals 4x/week",
            "current": 2,
            "target": 4,
            "unit": "meals/wk",
            "deadline": "2026-08-31",
            "progress": 50,
            "status": "on-track"
        },
        {
            "id": "goal-5",
            "title": "Zero short-haul flights",
            "current": 1,
            "target": 0,
            "unit": "flights/yr",
            "deadline": "2026-12-31",
            "progress": 0,
            "status": "behind"
        },
    ]


@router.post("/goals")
def create_goal(goal: Dict):
    """Create a new goal"""
    return {
        "id": f"goal-{datetime.now().timestamp()}",
        **goal,
        "progress": 0,
        "status": "on-track"
    }


@router.patch("/goals/{goal_id}")
def update_goal(goal_id: str, goal: Dict):
    """Update a goal"""
    return {"success": True, "id": goal_id}


@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: str):
    """Delete a goal"""
    return {"success": True}


# ─── Activity Log Endpoints ────────────────────────────────────────────────────

@router.get("/activities", response_model=List[Activity])
def get_activity_log():
    """Get activity log"""
    return [
        {
            "id": "act-1",
            "date": "2026-07-22",
            "action": "Logged cycling commute",
            "impact": "-5 kg CO₂e",
            "category": "Transport"
        },
        {
            "id": "act-2",
            "date": "2026-07-21",
            "action": "Switched to plant-based lunch",
            "impact": "-2 kg CO₂e",
            "category": "Food"
        },
        {
            "id": "act-3",
            "date": "2026-07-20",
            "action": "Completed ESG assessment",
            "impact": "Score updated",
            "category": "ESG"
        },
        {
            "id": "act-4",
            "date": "2026-07-19",
            "action": "Applied for EV loan",
            "impact": "Pending review",
            "category": "Financing"
        },
        {
            "id": "act-5",
            "date": "2026-07-18",
            "action": "Set new emissions goal",
            "impact": "Target: 500 kg/mo",
            "category": "Goals"
        },
    ]


# ─── User Profile PATCH Endpoint ─────────────────────────────────────────────

@router.patch("/user/me")
def update_user_profile(body: Dict):
    """Update user profile"""
    return {
        "id": "usr_001",
        "name": body.get("name", "Jane Smith"),
        "email": body.get("email", "jane.smith@example.com"),
        "initials": "JS",
        "company": body.get("company", "GreenTech Solutions Ltd"),
        "role": body.get("role", "Sustainability Lead"),
        "joinedAt": "2025-01-15",
    }


# ─── Recommendations Endpoints ───────────────────────────────────────────────

@router.get("/recommendations")
def get_recommendations():
    """Get priority recommendations"""
    return [
        {
            "id": "rec-1",
            "icon": "train",
            "title": "Switch Short-Haul Flights to Train",
            "category": "Transport",
            "priority": "high",
            "description": "Short-haul flights generate approximately 20x more CO₂e per km than trains. Switching one return flight within Europe saves 200-400 kg CO₂e.",
            "savingKg": 310,
            "savingPct": 50,
            "difficulty": "easy",
            "timeframe": "1-2 weeks",
            "ctaLabel": "Explore Rail Options",
            "ctaLink": "#"
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
            "difficulty": "easy",
            "timeframe": "Immediate",
            "ctaLabel": "Sustainable Diet Tips",
            "ctaLink": "#"
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
            "difficulty": "medium",
            "timeframe": "2-4 weeks",
            "ctaLabel": "View Green Energy Loans",
            "ctaLink": "#"
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
            "difficulty": "easy",
            "timeframe": "Immediate",
            "ctaLabel": "Find Bike Loans",
            "ctaLink": "#"
        }
    ]


@router.get("/recommendations/{rec_id}/dismiss")
def dismiss_recommendation(rec_id: str):
    """Dismiss recommendation"""
    return {"success": True}


@router.post("/recommendations/{rec_id}/apply")
def apply_recommendation(rec_id: str):
    """Apply recommendation"""
    return {"success": True}


# ─── ESG Insights Endpoints ──────────────────────────────────────────────────

@router.get("/esg-insights")
def get_esg_insights():
    """Get complete ESG metrics"""
    return {
        "radarScores": {
            "yourScore": { "environmental": 72, "social": 55, "governance": 68 },
            "industryAverage": { "environmental": 58, "social": 62, "governance": 54 }
        },
        "scopeEmissions": {
            "scope1": { "label": "Direct emissions", "value": 120, "color": "#16a34a" },
            "scope2": { "label": "Purchased energy", "value": 45, "color": "#3b82f6" },
            "scope3": { "label": "Value chain", "value": 380, "color": "#8b5cf6" }
        },
        "scopeTrend": [
            { "month": "Jan", "scope1": 140, "scope2": 55, "scope3": 420 },
            { "month": "Feb", "scope1": 135, "scope2": 52, "scope3": 410 },
            { "month": "Mar", "scope1": 130, "scope2": 50, "scope3": 400 },
            { "month": "Apr", "scope1": 128, "scope2": 48, "scope3": 395 },
            { "month": "May", "scope1": 125, "scope2": 47, "scope3": 390 },
            { "month": "Jun", "scope1": 122, "scope2": 46, "scope3": 385 },
            { "month": "Jul", "scope1": 120, "scope2": 45, "scope3": 380 }
        ],
        "regulatoryCompliance": [
            {
                "id": "rc-1",
                "name": "CSRD Reporting",
                "status": "Applicable - large undertaking",
                "color": "yellow",
                "deadline": "2026-12-31",
                "description": "Corporate Sustainability Reporting Directive requires detailed ESG disclosure."
            },
            {
                "id": "rc-2",
                "name": "EU Taxonomy Disclosure",
                "status": "Required - assess alignment",
                "color": "yellow",
                "deadline": "2026-06-30",
                "description": "Disclose share of business activities aligned with EU Taxonomy."
            },
            {
                "id": "rc-3",
                "name": "SFDR Article 8",
                "status": "Review product classification",
                "color": "green",
                "deadline": "2026-03-31",
                "description": "Sustainable Finance Disclosure Regulation product classification."
            }
        ],
        "priorityActions": [
            "Measure and disclose Scope 1 & 2 GHG emissions",
            "Conduct Scope 3 screening across the value chain",
            "Set a Science Based Target (SBTi) net-zero commitment",
            "Increase renewable energy usage - explore PPAs",
            "Publish annual sustainability report aligned with GRI/ESRS"
        ],
        "esgScoreHistory": [
            { "month": "Jan", "score": 65 },
            { "month": "Feb", "score": 66 },
            { "month": "Mar", "score": 67 },
            { "month": "Apr", "score": 69 },
            { "month": "May", "score": 70 },
            { "month": "Jun", "score": 71 },
            { "month": "Jul", "score": 72 }
        ]
    }


@router.get("/esg-insights/radar")
def get_esg_radar_scores():
    """Get ESG radar scores"""
    return {
        "yourScore": { "environmental": 72, "social": 55, "governance": 68 },
        "industryAverage": { "environmental": 58, "social": 62, "governance": 54 }
    }


@router.get("/esg-insights/scopes")
def get_esg_scope_emissions():
    """Get scope emissions data"""
    return {
        "scope1": { "label": "Direct emissions", "value": 120, "color": "#16a34a" },
        "scope2": { "label": "Purchased energy", "value": 45, "color": "#3b82f6" },
        "scope3": { "label": "Value chain", "value": 380, "color": "#8b5cf6" }
    }


@router.get("/esg-insights/regulatory")
def get_esg_regulatory_compliance():
    """Get regulatory compliance list"""
    return [
        {
            "id": "rc-1",
            "name": "CSRD Reporting",
            "status": "Applicable - large undertaking",
            "color": "yellow",
            "deadline": "2026-12-31",
            "description": "Corporate Sustainability Reporting Directive requires detailed ESG disclosure."
        },
        {
            "id": "rc-2",
            "name": "EU Taxonomy Disclosure",
            "status": "Required - assess alignment",
            "color": "yellow",
            "deadline": "2026-06-30",
            "description": "Disclose share of business activities aligned with EU Taxonomy."
        },
        {
            "id": "rc-3",
            "name": "SFDR Article 8",
            "status": "Review product classification",
            "color": "green",
            "deadline": "2026-03-31",
            "description": "Sustainable Finance Disclosure Regulation product classification."
        }
    ]


@router.get("/esg-insights/priority-actions")
def get_esg_priority_actions():
    """Get priority actions list"""
    return [
        "Measure and disclose Scope 1 & 2 GHG emissions",
        "Conduct Scope 3 screening across the value chain",
        "Set a Science Based Target (SBTi) net-zero commitment",
        "Increase renewable energy usage - explore PPAs",
        "Publish annual sustainability report aligned with GRI/ESRS"
    ]


