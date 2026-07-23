import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware

# Import route modules
from backend.routes.carbon_routes import router as carbon_router
from backend.routes.user_routes import router as user_router
from backend.routes.green_products_routes import router as green_products_router

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "green-financing-service"))

from app.api.v1.routes.products import router as products_router
from app.crud.product import compare_products as crud_compare_products


from contextlib import asynccontextmanager
from backend.services.carbon_services import get_carbon_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load and cache files into memory strictly on warm up / start up
    print("Warm up: Loading transaction data and MCC mappings into memory...")
    get_carbon_service()
    print("Warm up complete: Data files loaded into memory.")
    yield

app = FastAPI(
    title="Spring Boot Style FastAPI Application",
    description="An enterprise-ready backend mapping Spring Boot patterns to Python",
    version="1.0.0",
    docs_url="/swagger-ui",  # Customizing OpenAPI UI endpoints to feel like Springdoc
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(carbon_router)
app.include_router(user_router)
app.include_router(green_products_router)
app.include_router(green_products_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1/green-financing/products", tags=["Green Financing"])


# Compare products endpoint for Green Financing
@app.get("/api/v1/green-financing/compare", tags=["Green Financing"])
async def green_financing_compare():
    return await crud_compare_products()


@app.get("/actuator/health", tags=["Actuator"])
def health_check():
    return {"status": "UP"}


@app.get("/", tags=["Info"])
def root():
    return {
        "message": "DecaESG API",
        "version": "1.0.0",
        "docs": "/docs",
        "swagger": "/swagger-ui"
    }