from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from app.db.session import get_db
from app.models.product import Product
from app.core.security import verify_token

def get_current_user(token: str = Depends(verify_token)):
    # Logic to retrieve the current user based on the token
    user = ...  # Implement user retrieval logic
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_product(db: Session, product_id: int):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

def get_db_session():
    db = get_db()
    try:
        yield db
    finally:
        db.close()