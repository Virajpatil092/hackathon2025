"""
Carbon Footprint Routes
REST API endpoints for carbon footprint analytics and MCC mapping
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
from ..services.carbon_services import get_carbon_service

router = APIRouter(prefix="", tags=["Carbon Footprint"])


# ─── Response Models ───────────────────────────────────────────────────────────

class MCCMapping(BaseModel):
    """MCC code with carbon mapping details"""
    mcc_code: str
    description: str
    high_level_category: str
    emission_factor: float
    transaction_count: int


class CategoryBreakdown(BaseModel):
    """Carbon emissions by category"""
    label: str
    value: float  # Percentage
    kg: float
    emission_factor: float


class CarbonFootprintResponse(BaseModel):
    """Carbon footprint overview"""
    kgThisMonth: float
    kgLastMonth: float
    vsLastMonth: float
    topEmissionCategory: str
    categoryBreakdown: List[CategoryBreakdown]
    sixMonthTrend: List[Dict]
    totalEmissions: float
    transactionCount: int


class CarbonTrendPoint(BaseModel):
    """Single month in trend data"""
    month: str
    data: Dict[str, float]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/carbon-footprint", response_model=CarbonFootprintResponse)
def get_carbon_footprint():
    """
    Get overall carbon footprint for the current user
    
    Returns:
    - Total CO2e for this month and last month
    - Category breakdown with percentages
    - 6-month trend
    - Top emission category
    """
    try:
        service = get_carbon_service()
        footprint = service.calculate_carbon_footprint()
        return footprint
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating footprint: {str(e)}")


@router.get("/carbon-footprint/trend")
def get_carbon_trend(months: int = Query(6, ge=1, le=24)):
    """
    Get carbon emissions trend over specified number of months
    
    Parameters:
    - months: Number of months to retrieve (1-24)
    
    Returns:
    - List of months with CO2e breakdown by category
    """
    try:
        service = get_carbon_service()
        trend = service.get_carbon_trend(months)
        return {"months": months, "data": trend}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trend: {str(e)}")


@router.get("/carbon-footprint/categories")
def get_carbon_by_category():
    """
    Get carbon emissions breakdown by high-level category
    
    Returns:
    - Total CO2e per category
    - Average CO2e per transaction
    - Transaction count per category
    - Total spending per category
    """
    try:
        service = get_carbon_service()
        categories = service.get_carbon_by_category()
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")


@router.get("/carbon-footprint/benchmarks")
def get_carbon_benchmarks():
    """
    Get carbon emissions benchmarks and comparisons
    
    Returns:
    - Your footprint vs national average, EU target, Paris agreement target
    - Percentage differences
    - Scale for visualization
    """
    try:
        service = get_carbon_service()
        benchmarks = service.get_carbon_benchmarks()
        return benchmarks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching benchmarks: {str(e)}")


# ─── MCC Data Endpoints ────────────────────────────────────────────────────────

@router.get("/carbon-footprint/mcc/distinct", response_model=List[MCCMapping])
def get_distinct_mcc_codes():
    """
    Get all distinct MCC codes found in transaction data
    Includes carbon mapping and transaction counts
    
    Returns:
    - List of distinct MCCs with descriptions, categories, and emission factors
    """
    try:
        service = get_carbon_service()
        mccs = service.get_distinct_mcc_codes()
        return mccs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching MCC codes: {str(e)}")


@router.get("/carbon-footprint/mcc/categories")
def get_mcc_by_category():
    """
    Get distinct MCC codes grouped by high-level category
    
    Returns:
    - Dictionary with category names as keys
    - List of MCCs per category
    """
    try:
        service = get_carbon_service()
        categorized = service.get_mcc_by_category()
        return categorized
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error grouping MCCs: {str(e)}")


@router.get("/carbon-footprint/mcc/stats")
def get_mcc_statistics():
    """
    Get statistics about MCC codes in the transaction data
    
    Returns:
    - Total distinct MCCs
    - Categories represented
    - Emission factors range
    - Total transactions analyzed
    """
    try:
        service = get_carbon_service()
        mccs = service.get_distinct_mcc_codes()
        categories = service.get_mcc_by_category()
        
        stats = {
            'totalDistinctMCCs': len(mccs),
            'totalCategories': len(categories),
            'totalTransactions': sum(mcc['transaction_count'] for mcc in mccs),
            'categories': list(categories.keys()),
            'emissionFactorRange': {
                'min': round(min(mcc['emission_factor'] for mcc in mccs), 2) if mccs else 0,
                'max': round(max(mcc['emission_factor'] for mcc in mccs), 2) if mccs else 0
            }
        }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating stats: {str(e)}")
