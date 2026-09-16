from datetime import datetime, timedelta, timezone
import uuid
import hashlib
from jose import JWTError, jwt
import bcrypt
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("about", (), {"__version__": getattr(bcrypt, "__version__", "4.0.0")})
from passlib.context import CryptContext

from configs.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    SECRET_KEY,
)
from configs.config import REFRESH_TOKEN_EXPIRE_DAYS

# Password Hashing Context
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """
    Hash plain text password.
    """
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Verify password against stored hash.
    """
    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Generate JWT access token.
    """

    to_encode = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + (
            expires_delta
            if expires_delta
            else timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )
    )
    issued_at = datetime.now(
        timezone.utc,
    )

    jwt_id = str(
        uuid.uuid4(),
    )

    session_id = str(
        uuid.uuid4(),
    )

    to_encode.update(
        {
            "iat": issued_at,
            "exp": expire,
            "jti": jwt_id,
            "sid": session_id,
            "type": "access",
        }
    )

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_access_token(
    token: str,
) -> dict:
    """
    Decode and validate JWT.
    """

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        return payload

    except JWTError:

        return {}
    
    
def create_access_token_with_metadata(
    data: dict,
    expires_delta: timedelta | None = None,
) -> dict:
    """
    Generate JWT access token along with
    session metadata for audit logging.
    """

    to_encode = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + (
            expires_delta
            if expires_delta
            else timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES,
            )
        )
    )

    issued_at = datetime.now(
        timezone.utc,
    )

    jwt_id = str(
        uuid.uuid4(),
    )

    session_id = str(
        uuid.uuid4(),
    )

    to_encode.update(
        {
            "iat": issued_at,
            "exp": expire,
            "jti": jwt_id,
            "sid": session_id,
            "type": "access",
        }
    )

    access_token = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "access_token": access_token,
        "jwt_id": jwt_id,
        "session_id": session_id,
    }
def create_refresh_token(
    data: dict,
    session_id: str,
    expires_delta: timedelta | None = None,
) -> dict:
    """
    Generate JWT refresh token.
    """

    to_encode = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + (
            expires_delta
            if expires_delta
            else timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        )
    )

    issued_at = datetime.now(timezone.utc)

    jwt_id = str(uuid.uuid4())

    to_encode.update(
        {
            "iat": issued_at,
            "exp": expire,
            "jti": jwt_id,
            "sid": session_id,
            "type": "refresh",
        }
    )

    refresh_token = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "refresh_token": refresh_token,
        "jwt_id": jwt_id,
        "session_id": session_id,
    }
def hash_refresh_token(
    token: str,
) -> str:
    """
    Returns SHA-256 hash of refresh token.
    """

    return hashlib.sha256(
        token.encode("utf-8"),
    ).hexdigest()