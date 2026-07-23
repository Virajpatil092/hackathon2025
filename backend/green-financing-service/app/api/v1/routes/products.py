from typing import List

from fastapi import APIRouter, HTTPException
from app.api.v1.schemas.product import Product
from app.crud.product import (
    create_product,
    get_product,
    update_product,
    delete_product,
    list_products,
    compare_products,
    apply_product as crud_apply_product,
)
from app.api.v1.schemas.product import ProductCreate, ProductUpdate

router = APIRouter()


@router.post("/", response_model=Product)
async def create_new_product(product: ProductCreate):
    db_product = await create_product(product)
    return db_product


# List products (matches frontend GET /green-financing/products)
@router.get("/", response_model=List[Product])
async def read_products():
    return await list_products()


@router.get("/{product_id}", response_model=Product)
async def read_product(product_id: int):
    db_product = await get_product(product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product


@router.put("/{product_id}", response_model=Product)
async def update_existing_product(product_id: int, product: ProductUpdate):
    db_product = await update_product(product_id, product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product


@router.delete("/{product_id}", response_model=dict)
async def delete_existing_product(product_id: int):
    success = await delete_product(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"detail": "Product deleted successfully"}


# Compare products (matches frontend GET /green-financing/compare)
@router.get("/compare", response_model=dict)
async def compare_products_endpoint():
    return await compare_products()


# Apply for a product (matches frontend POST /green-financing/products/:id/apply)
@router.post("/{product_id}/apply", response_model=dict)
async def apply_product_endpoint(product_id: int):
    application_id = await crud_apply_product(product_id)
    if not application_id:
        raise HTTPException(status_code=400, detail="Application failed or product not found")
    return {"applicationId": application_id}