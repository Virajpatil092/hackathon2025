import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.greenProductsService import get_available_green_products, load_green_products_data
from routes.green_products_routes import get_green_products


def test_load_green_products_data():
    data = load_green_products_data()
    assert "products" in data
    assert isinstance(data["products"], list)


def test_get_available_green_products():
    products = get_available_green_products()
    assert len(products) > 0
    for product in products:
        assert product.get("status") == "ACTIVE"


def test_green_products_route():
    response = get_green_products()
    assert response["success"] is True
    assert "products" in response
    assert response["count"] == len(response["products"])
