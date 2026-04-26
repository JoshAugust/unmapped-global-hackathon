#!/bin/bash
trap '' HUP TERM INT

ORCH_DIR="/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/unmapped-global-hackathon/orchestration"
LOG="$ORCH_DIR/watchdog.log"
PID_FILE="$ORCH_DIR/watchdog.pid"

echo $$ > "$PID_FILE"
echo "[$(date)] Watchdog started (PID $$)" >> "$LOG"

while true; do
  NOW=$(date +%s)
  STALE=0
  ALIVE=0

  for hb in "$ORCH_DIR"/agent_*/heartbeat.txt; do
    [ -f "$hb" ] || continue
    MTIME=$(stat -f %m "$hb" 2>/dev/null)
    AGE=$(( (NOW - MTIME) / 60 ))
    AGENT=$(dirname "$hb" | xargs basename)

    if [ "$AGE" -gt 20 ]; then
      echo "[$(date)] STALE: $AGENT (${AGE}m)" >> "$LOG"
      STALE=$((STALE + 1))
    else
      ALIVE=$((ALIVE + 1))
    fi
  done

  DONE=$(grep -c '^\- \[x\]' "$ORCH_DIR/TASK_QUEUE.md" 2>/dev/null || echo 0)
  TOTAL=35

  echo "[$(date)] Alive: $ALIVE | Stale: $STALE | Done: $DONE/$TOTAL" >> "$LOG"

  if [ -f "$ORCH_DIR/COMPLETE" ]; then
    echo "[$(date)] COMPLETE flag. Exiting." >> "$LOG"
    rm -f "$PID_FILE"
    exit 0
  fi

  sleep 120
done
