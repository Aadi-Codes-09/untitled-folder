from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog
import logging

from app.core.config import get_settings
from app.database.session import init_db, close_db
from app.api.v1 import auth, conversation, documents

settings = get_settings()

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logging.basicConfig(
    format="%(message)s",
    level=getattr(logging, settings.LOG_LEVEL),
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="MediKiosk - AI-Powered Clinical History & Document Digitization API",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    structlog.get_logger().info(
        "request_started",
        method=request.method,
        url=str(request.url),
        client=request.client.host if request.client else None,
    )
    response = await call_next(request)
    structlog.get_logger().info(
        "request_completed",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
    )
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger = structlog.get_logger()
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        error=str(exc),
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(conversation.router, prefix=f"{settings.API_V1_PREFIX}/conversation", tags=["Conversation"])
app.include_router(documents.router, prefix=f"{settings.API_V1_PREFIX}/documents", tags=["Documents"])


@app.get("/health")
async def health_check():
    from app.database.session import engine
    from app.core.celery_app import celery_app
    import redis.asyncio as redis
    
    db_status = "healthy"
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
    except Exception:
        db_status = "unhealthy"

    redis_status = "healthy"
    try:
        r = redis.from_url(settings.REDIS_URL)
        await r.ping()
        await r.close()
    except Exception:
        redis_status = "unhealthy"

    celery_status = "healthy"
    try:
        inspect = celery_app.control.inspect()
        if not inspect.ping():
            celery_status = "unhealthy"
    except Exception:
        celery_status = "unhealthy"

    return {
        "status": "healthy" if all(s == "healthy" for s in [db_status, redis_status, celery_status]) else "degraded",
        "version": settings.APP_VERSION,
        "database": db_status,
        "redis": redis_status,
        "celery": celery_status,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "MediKiosk Backend API",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)