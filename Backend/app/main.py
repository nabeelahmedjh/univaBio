"""FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from . import schemas
from .routers import admin, auth, doctors, patients, sessions
from .services import report_service
from .services.pipeline import pipeline


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup.
    init_db()
    # Start the async pipeline workers and recover jobs stranded by a restart.
    await pipeline.start()
    pipeline.requeue_stuck()
    yield
    await pipeline.stop()


app = FastAPI(
    title=settings.app_name,
    description="Doctor-patient follow-up assistant backend.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    # Dev convenience: also allow any loopback origin (localhost / 127.0.0.1) on
    # any port, so multiple Vite instances (5173, 5174, ...) never break CORS.
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
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
        "pipeline_pending": pipeline.pending(),
    }


@app.post("/access-requests", response_model=schemas.AccessRequestOut, tags=["public"])
def access_request(body: schemas.AccessRequest):
    """Public 'request access' form. Not persisted yet; acknowledges receipt."""
    return schemas.AccessRequestOut(ok=True)
