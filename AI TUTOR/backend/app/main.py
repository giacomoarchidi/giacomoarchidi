from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.routers import (
    auth, users, lessons, availability, payments, assignments, files, feedback, reports, 
    tutor, parent, admin, health, video
)

# Create FastAPI app
app = FastAPI(
    title="Tutoring Platform API",
    description="API completa per piattaforma di tutoring online",
    version="0.1.0",
    docs_url="/docs" if settings.ENV == "dev" else None,
    redoc_url="/redoc" if settings.ENV == "dev" else None,
)

# Middleware personalizzato per CORS
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Max-Age"] = "3600"
    return response

# CORS middleware - Configurazione aggiornata
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporaneo: accetta tutte le origini
    allow_credentials=False,  # Deve essere False quando allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Trusted host middleware for production
if settings.ENV == "prod":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
    )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors"""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "type": "internal_error"
        }
    )

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(lessons.router, prefix="/api/lessons", tags=["lessons"])
app.include_router(availability.router, prefix="/api/availability", tags=["availability"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(tutor.router, prefix="/api/tutor", tags=["tutor"])
app.include_router(parent.router, prefix="/api/parent", tags=["parent"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(video.router, prefix="/api/video", tags=["video"])

# Root endpoint  
@app.get("/")
async def root():
    """Root endpoint - CORS Fixed"""
    return {
        "message": "Tutoring Platform API",
        "version": "0.1.0",
        "environment": settings.ENV,
        "docs": "/docs" if settings.ENV == "dev" else "disabled",
        "cors": "enabled"
    }
