import time
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as cookflow_router
from app.core.config import settings
from app.core.logger import logger
from app.db.database import init_db


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    logger.info(
        f"Starting CookFlow FastAPI backend (groq_enabled={settings.has_valid_groq_key}, model='{settings.groq_model}')..."
    )
    await init_db()
    yield
    logger.info("Shutting down CookFlow FastAPI backend.")


def create_app() -> FastAPI:
    app = FastAPI(
        title="CookFlow API",
        version="1.1.0",
        description="High-performance async backend for CookFlow kitchen-friendly recipes & Groq AI.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:4173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def log_requests(request: Request, call_next) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms:.2f}ms)"
        )
        return response

    app.include_router(cookflow_router)
    return app


app = create_app()
