# ============================================================
# CSCRS Production Docker Image
# ============================================================

FROM python:3.10-slim

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1

# Flush Python logs immediately
ENV PYTHONUNBUFFERED=1

# Prevent pip cache
ENV PIP_NO_CACHE_DIR=1

# Set working directory
WORKDIR /app

# ------------------------------------------------------------
# Install required Linux packages
# ------------------------------------------------------------

RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    libpq-dev \
    libglib2.0-0 \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------
# Copy dependency file first (Docker layer caching)
# ------------------------------------------------------------

COPY requirements-prod.txt .

# ------------------------------------------------------------
# Upgrade pip
# ------------------------------------------------------------

RUN pip install --upgrade pip

# ------------------------------------------------------------
# Install Python dependencies
# ------------------------------------------------------------

RUN pip install -r requirements-prod.txt

# ------------------------------------------------------------
# Copy application
# ------------------------------------------------------------

COPY . .

# ------------------------------------------------------------
# Create non-root user
# ------------------------------------------------------------

RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser

# ------------------------------------------------------------
# Create runtime folders
# ------------------------------------------------------------

RUN mkdir -p uploads logs && \
    chown -R appuser:appgroup /app

USER appuser

# ------------------------------------------------------------
# Expose FastAPI Port
# ------------------------------------------------------------

EXPOSE 8000

# ------------------------------------------------------------
# Health Check
# ------------------------------------------------------------

HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=30s \
            --retries=3 \
CMD curl -f http://localhost:8000/health || exit 1

# ------------------------------------------------------------
# Start FastAPI
# ------------------------------------------------------------

CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8000"]