#!/usr/bin/env bash
# AI-Powered Malicious File Forensics & Threat Reconstruction
# Frontend Startup Script for macOS (Apple Silicon M4)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "[!] Frontend node_modules not found. Installing..."
    npm install
fi

echo "[*] Starting Vite React Frontend on http://localhost:5173..."
npm run dev -- --host 0.0.0.0 --port 5173
