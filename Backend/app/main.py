"""FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import admin, auth, doctors, patients, sessions
from .services import report_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup.
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    description="Doctor-patient follow-up assistant backend.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(doctors.router)
app.include_router(patients.router)
app.include_router(sessions.router)


@app.get("/health", tags=["health"])
def health():
    return {
        "status": "ok",
        "environment": settings.environment,
        "llm_provider": settings.llm_provider,
        "llm_configured": report_service.provider_is_configured(),
    }
