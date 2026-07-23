import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.carbon_services import get_carbon_service


def test_carbon_service_returns_summary_structure():
    service = get_carbon_service()
    result = service.calculate_carbon_footprint()

    assert "kgThisMonth" in result
    assert "kgLastMonth" in result
    assert "categoryBreakdown" in result
    assert "sixMonthTrend" in result
    assert "transactionCount" in result
    assert "vsNationalAverage" in result
    assert "benchmarks" in result
    assert "weeklyBreakdown" in result
    assert result["kgThisMonth"] > 0
    assert result["vsNationalAverage"] != 0

