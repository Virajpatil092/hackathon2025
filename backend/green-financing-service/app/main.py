from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routes import products
from app.crud.product import compare_products as crud_compare_products

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this as needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(products.router, prefix="/api/v1/products", tags=["products"])
# Expose same endpoints under the frontend-expected prefix
app.include_router(products.router, prefix="/green-financing/products", tags=["green-financing"])


# Frontend expects compare under /green-financing/compare
@app.get("/green-financing/compare")
async def green_financing_compare():
    return await crud_compare_products()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Green Financing Service API"}