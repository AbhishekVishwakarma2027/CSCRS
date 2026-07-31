from slowapi import Limiter
from fastapi import Request
from jose import jwt
from configs.config import (
    SECRET_KEY,
    ALGORITHM,
    REDIS_URL,
)


def get_client_ip(request: Request) -> str:
    """Return client IP address."""
    if request.client:
        return request.client.host
    return "unknown"


def get_email(request: Request) -> str | None:
    """
    Placeholder for email-based rate limiting.

    Email cannot be safely extracted here because the request body
    has not yet been parsed by FastAPI.
    It will be used later via decorators on auth endpoints.
    """
    return None


def get_user_id(request: Request) -> str | None:
    """
    Extract authenticated user id from JWT.
    """

    auth = request.headers.get("Authorization")

    if not auth or not auth.startswith("Bearer "):
        return None

    token = auth.split(" ", 1)[1]

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id:
            return f"user:{user_id}"

    except Exception:
        pass

    return None


def smart_rate_limit_key(request: Request) -> str:
    """
    Priority:

    1. Authenticated User
    2. Client IP
    """

    user = get_user_id(request)

    if user:
        return user

    return f"ip:{get_client_ip(request)}"


limiter = Limiter(
    key_func=smart_rate_limit_key,
    default_limits=[],
    storage_uri=REDIS_URL,
)