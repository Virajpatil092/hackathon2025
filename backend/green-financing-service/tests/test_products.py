from fastapi.testclient import TestClient
from app.main import app
from app.models.product import Product
from app.db.session import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

client = TestClient(app)

def override_get_db():
    # This function will be used to override the database dependency for testing
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

def test_create_product():
    response = client.post(
        "/api/v1/products/",
        json={
            "name": "EcoHome Green Mortgage",
            "rate": "From 3.0% APR",
            "description": "Preferential mortgage for EPC A/B homes.",
            "min_amount": 50000,
            "max_amount": 500000,
            "term": "5-30 years",
        },
    )
    assert response.status_code == 201
    assert response.json()["name"] == "EcoHome Green Mortgage"

def test_read_product():
    response = client.get("/api/v1/products/1")
    assert response.status_code == 200
    assert "name" in response.json()

def test_update_product():
    response = client.patch(
        "/api/v1/products/1",
        json={"rate": "From 2.5% APR"},
    )
    assert response.status_code == 200
    assert response.json()["rate"] == "From 2.5% APR"

def test_delete_product():
    response = client.delete("/api/v1/products/1")
    assert response.status_code == 204
    assert response.content == b""