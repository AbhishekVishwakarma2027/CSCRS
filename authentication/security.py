from datetime import datetime, timedelta, timezone
import uuid
from jose import JWTError, jwt
from passlib.context import CryptContext

from configs.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    SECRET_KEY,
)

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