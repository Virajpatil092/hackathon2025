from backend.routes.green_products_routes import get_green_products


def test_green_products_endpoint_returns_active_products():
    payload = get_green_products()

    assert payload["success"] is True
    assert payload["count"] > 0
    assert len(payload["products"]) == payload["count"]
    assert all(product["status"] == "ACTIVE" for product in payload["products"])
