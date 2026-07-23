from backend.services.carbon_services import CarbonFootprintService


def test_calculate_carbon_footprint_uses_latest_available_month():
    service = CarbonFootprintService()
    footprint = service.calculate_carbon_footprint()

    assert footprint["kgThisMonth"] > 0
    assert footprint["kgLastMonth"] >= 0
    assert footprint["transactionCount"] > 0
    assert footprint["totalEmissions"] > 0
    assert 100 <= footprint["kgThisMonth"] <= 1000
