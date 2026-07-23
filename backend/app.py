import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware

# Import route modules
from backend.routes.carbon_routes import router as carbon_router
from backend.routes.user_routes import router as user_router
from backend.routes.chat_routes import router as chat_router


app = FastAPI(
    title="Spring Boot Style FastAPI Application",
    description="An enterprise-ready backend mapping Spring Boot patterns to Python",
    version="1.0.0",
    docs_url="/swagger-ui",  # Customizing OpenAPI UI endpoints to feel like Springdoc
    redoc_url="/redoc"
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
app.include_router(chat_router)



@app.get("/actuator/health", tags=["Actuator"])
def health_check():
    return {"status": "UP"}


@app.get("/", tags=["Info"])
def root():
    return {
        "message": "ESG Advisor API",
        "version": "1.0.0",
        "docs": "/docs",
        "swagger": "/swagger-ui"
    }