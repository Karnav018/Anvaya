import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, close_db
from app.routers import auth, projects, blueprints, generate, debug
from app.config import settings
from app.middleware.rate_limit import setup_rate_limiting
from app.middleware.security_headers import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Anvaya API",
    description="Backend for Anvaya — Visual API Builder",
    version="1.0.0",
    lifespan=lifespan,
)

# Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Rate Limiting
limiter = setup_rate_limiting(app)

# CORS — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(blueprints.router)
app.include_router(generate.router)
app.include_router(debug.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "Anvaya API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
