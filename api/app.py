from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from utils.rate_limiter import limiter
from utils.logger import get_logger
from api.routes import router
from contextlib import asynccontextmanager
from pathlib import Path
from configs.config import FRONTEND_BASE_URL

logger = get_logger("cscrs")

@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("=" * 60)
    logger.info("CSCRS API starting...")

    try:

        Path("logs").mkdir(exist_ok=True)
        logger.info("Logs directory verified.")

        Path("uploads").mkdir(exist_ok=True)
        logger.info("Uploads directory verified.")

        logger.info("Application startup completed successfully.")

    except Exception:

        logger.exception("Application startup failed.")
        raise

    yield

    logger.info("Application shutdown initiated.")
    logger.info("CSCRS API stopped.")
    logger.info("=" * 60)

app = FastAPI(
    title="CSCRS API",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(
    request:Request,
    exc : RateLimitExceeded,
):
    logger.warning(
        "Rate limit exceeded | IP=%s | Method=%s | Path=%s | User-Agent=%s",
        request.client.host if request.client else "Unknown",
        request.method,
        request.url.path,
        request.headers.get("user-agent", "Unknown"),
    )

    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "message": (
                "Too many requests. "
                "Please try again later."
            ),
            "error_code": "RATE_LIMIT_EXCEEDED",
        },
    )

app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in FRONTEND_BASE_URL.split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = (
    "geolocation=(), microphone=(), camera=()"
    )
    return response
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)
app.include_router(router)