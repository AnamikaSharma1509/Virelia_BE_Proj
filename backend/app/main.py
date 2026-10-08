import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api import (
    auth,
    patients,
    assessments,
    admin,
    admin_assessments,
    assignments,
    submissions,
    scenarios,
    videos,
    sessions,
    reports
)

app = FastAPI(
    title="Virelia API",
    description=(
        "Virelia is a guided confidence-building platform that supports students through structured assessments, "
        "immersive scenario videos, personal reflections, and progress tracking.\n\n"
        "DISCLAIMER: Virelia is a guided practice platform, not a medical diagnostic or treatment system."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers under /api/v1
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(patients.router, prefix=settings.API_V1_STR)
app.include_router(assessments.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(admin_assessments.router, prefix=settings.API_V1_STR)
app.include_router(assignments.router, prefix=settings.API_V1_STR)
app.include_router(submissions.router, prefix=settings.API_V1_STR)
app.include_router(scenarios.router, prefix=settings.API_V1_STR)
app.include_router(videos.router, prefix=settings.API_V1_STR)
app.include_router(sessions.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "tagline": "Practice. Perform. Grow.",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "healthy"
    }

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "app_env": settings.APP_ENV
    }
