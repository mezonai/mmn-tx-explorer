#!/bin/bash
set -e

echo "Starting frontend (standalone)..."

APP_PORT="${PORT:-3000}"
HEALTH_URL="http://127.0.0.1:${APP_PORT}/api/health"

/usr/local/bin/node .next/standalone/server.js &
APP_PID=$!
for _ in $(seq 1 30); do
  if curl -fsS --max-time 2 "${HEALTH_URL}" >/dev/null; then
    systemd-notify --ready
    echo "[READY] Service is ready"
    break
  fi

  if ! kill -0 "${APP_PID}" 2>/dev/null; then
    wait "${APP_PID}"
    exit $?
  fi

  sleep 1
done

while true; do
  if ! kill -0 "$APP_PID" 2>/dev/null; then
    echo "[WATCHDOG] process died"
    exit 1
  fi

  if curl -sf "${HEALTH_URL}" >/dev/null; then
    systemd-notify WATCHDOG=1
  else
    echo "[WATCHDOG] health failed"
    exit 1
  fi

  sleep 1
done
