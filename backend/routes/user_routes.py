# User & Dashboard Routes

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import pandas as pd
from pathlib import Path
from ..services.carbon_services import get_carbon_service

router = APIRouter(prefix="", tags=["User & Dashboard"])

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
        
        # Calculate progress and metrics with a more practical, demo-friendly scale.
        total_emissions = footprint.get('kgThisMonth', 500)
        monthly_target = 500
        target_progress = (
            100 if total_emissions <= monthly_target else max(0, round((monthly_target / total_emissions) * 100))
        )
        potential_savings = round(total_emissions * 0.25, 2)
        
        return {
            "totalEmissions": round(total_emissions, 2),
            "emissionsUnit": "kg CO₂e",
            "emissionsChangePct": footprint.get('vsLastMonth', -2.8),
            "monthlyTarget": monthly_target,
            "targetProgressPct": target_progress,
            "activeRecommendations": 4,
            "potentialSavings": potential_savings,
            "esgScore": 72,
            "esgScoreChange": 3,
            "goalsOnTrack": 3,
            "totalGoals": 5,
            "greenProductsAvailable": 4,
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
    """Get user goals"""
    service = get_carbon_service()
    footprint = service.calculate_carbon_footprint()
    current_emissions = round(footprint.get("kgThisMonth", 500), 2)
    goal_progress = 100 if current_emissions <= 500 else max(0, round((500 / current_emissions) * 100))

    return [
        {
            "id": "goal-1",
            "title": "Reduce monthly emissions to 500 kg",
            "current": current_emissions,
            "target": 500,
            "unit": "kg CO₂e",
            "deadline": "2026-12-31",
            "progress": goal_progress,
            "status": "on-track"
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

