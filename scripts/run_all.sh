#!/usr/bin/env bash
# AI-Powered Malicious File Forensics & Threat Reconstruction
# Unified Startup Script for Local Demonstration
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

cleanup() {
    echo ""
    echo "[*] Shutting down services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo "=========================================================================="
echo "AI-POWERED MALICIOUS FILE FORENSICS & THREAT RECONSTRUCTION SYSTEM"
echo "SRM University Delhi-NCR, Sonipat - 2026-2027 Session"
echo "Running on Apple Silicon M4 (macOS ARM64)"
echo "=========================================================================="

# Start backend
bash scripts/run_backend.sh &
BACKEND_PID=$!

# Wait for backend to be ready
echo "[*] Waiting for backend to initialize..."
sleep 3

# Start frontend
bash scripts/run_frontend.sh &
FRONTEND_PID=$!

echo ""
echo "[✓] Services started successfully!"
echo "    • Frontend SOC Console: http://localhost:5173"
echo "    • Backend REST API:     http://localhost:8000"
echo "    • Interactive Swagger:  http://localhost:8000/docs"
echo "    • Press Ctrl+C to stop all services."
echo ""

wait
