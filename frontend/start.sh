#!/bin/bash
set -e

echo "Starting frontend (standalone)..."

systemd-notify --ready

(
  while true; do
    if curl -sf http://localhost:3000/api/health >/dev/null; then
      systemd-notify WATCHDOG=1
    else
      echo "[WATCHDOG] Health check failed"
    fi
    sleep 10
  done
) &

exec /usr/local/bin/node .next/standalone/server.js
