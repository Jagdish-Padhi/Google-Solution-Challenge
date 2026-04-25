FROM python:3.11-slim

# Install system dependencies for OpenCV and other ML libraries
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    libsm6 \
    libxext6 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Environment variables
ENV PYTHONUNBUFFERED=1

# Production command (uses dynamic $PORT for Render/Heroku)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
