#!/usr/bin/env bash
# AI-Powered Malicious File Forensics & Threat Reconstruction
# Backend Startup Script for macOS (Apple Silicon M4)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

if [ ! -d ".venv" ]; then
    echo "[!] Virtual environment (.venv) not found. Creating..."
    python3 -m venv .venv
    source .venv/bin/activate
    python -m pip install --upgrade pip
    python -m pip install -r backend/requirements.txt
else
    source .venv/bin/activate
fi

echo "[*] Starting FastAPI Backend on http://127.0.0.1:8000..."
export PYTHONPATH=.
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
