# Multi-stage Dockerfile for AI-Powered Forensics & Threat Reconstruction
# Compatible with macOS Apple Silicon (ARM64) and Linux x86_64

# Stage 1: Frontend Build
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend & Runtime
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for forensics and YARA
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libmagic1 \
    libyara-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source, rules, and scripts
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY yara_rules/ ./yara_rules/
COPY sample_data/ ./sample_data/
COPY scripts/ ./scripts/
COPY .env.example ./.env

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Ensure storage directories
RUN mkdir -p data/uploads data/quarantine reports/generated ml/artifacts

EXPOSE 8000

ENV PYTHONPATH=/app
ENV HOST=0.0.0.0
ENV PORT=8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
