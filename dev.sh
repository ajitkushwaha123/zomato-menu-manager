#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# dev.sh — starts all services for zomato-menu-manager
# Usage: ./dev.sh  OR  npm run dev:all
# ──────────────────────────────────────────────────────────────
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend"

# Colors
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
MAGENTA='\033[0;35m'
RESET='\033[0m'

log() { echo -e "${1}[${2}]${RESET} ${3}"; }

echo "🧹 Cleaning up any lingering processes on ports 3000, 8000..."
lsof -ti:3000,8000 | xargs kill -9 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true
rm -rf "$FRONTEND/.next/dev/lock" 2>/dev/null || true

PIDS=()

cleanup() {
  echo ""
  echo "🛑  Stopping all services..."
  for pid in "${PIDS[@]}"; do
    kill -TERM "$pid" 2>/dev/null || true
  done
  
  # Also aggressively kill any lingering processes by name just in case
  pkill -f "next-server" 2>/dev/null || true
  pkill -f "uvicorn" 2>/dev/null || true
  pkill -f "menu_worker" 2>/dev/null || true
  
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Next.js dev server
log "$CYAN" "NEXT" "Starting Next.js..."
(cd "$FRONTEND" && npm run next:dev) &
PIDS+=($!)

# 2. FastAPI backend (uvicorn)
log "$GREEN" "API" "Starting FastAPI backend on port 8000..."
(cd "$BACKEND" && /opt/homebrew/bin/uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) &
PIDS+=($!)

# 4. Python background worker (SQS poller)
log "$MAGENTA" "BG-WORKER" "Starting Python background worker..."
(cd "$BACKEND" && /opt/homebrew/bin/uv run python -m app.workers.menu_worker) &
PIDS+=($!)

echo ""
echo "✅  All services started:"
echo "   🌐  Next.js      → http://localhost:3000"
echo "   🐍  FastAPI      → http://localhost:8000"
echo "   ⚙️   Python Worker running"
echo ""
echo "   Press Ctrl+C to stop everything."
echo ""

# Wait for all background jobs
wait

