import json
from pathlib import Path
from fastapi import APIRouter

try:
    from ..services.greenProductsService import get_available_green_products
except ImportError:
    from backend.services.greenProductsService import get_available_green_products

router = APIRouter(prefix="/green-products", tags=["Green Products"])


@router.get("", response_model=dict)
def get_green_products():
    products = get_available_green_products()
    return {
        "success": True,
        "count": len(products),
        "products": products,
    }
