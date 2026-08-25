#!/bin/bash
# run-update.sh MODE   (MODE = prep | lineup)
# Invoked by launchd. Waits for network (the Mac sleeps and wakes with DNS not
# ready, which caused repeated ENOTFOUND failures), retries on transient API
# errors, and reports an HONEST exit code.

export PATH="/Users/christopherbarnett/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

MODE="${1:-prep}"
REPO="/Users/christopherbarnett/Projects/chelsea-2026-27"
LOG="$REPO/scripts/update.log"
cd "$REPO" || exit 1

case "$MODE" in
  prep)   PROMPT="$REPO/scripts/task-prompt.md" ;;
  lineup) PROMPT="$REPO/scripts/lineup-prompt.md" ;;
  *) echo "unknown mode: $MODE" >&2; exit 2 ;;
esac

log() { echo "$@" >> "$LOG"; }

log ""
log "===== $(date '+%Y-%m-%d %H:%M:%S %Z') [$MODE] ====="

# Wait up to 3 minutes for DNS/network after a wake.
for i in $(seq 1 18); do
  if ping -c1 -t2 api.anthropic.com >/dev/null 2>&1 || nc -z -G2 api.anthropic.com 443 >/dev/null 2>&1; then
    break
  fi
  sleep 10
done

# Run Claude, retrying on transient failures (529 overloaded, ENOTFOUND, sleep).
ATTEMPTS=3
RC=1
for n in $(seq 1 $ATTEMPTS); do
  OUT="$(claude -p "$(cat "$PROMPT")" \
        --allowedTools "Bash,Read,Write,Edit,Glob,Grep,WebSearch,WebFetch" \
        < /dev/null 2>&1)"
  RC=$?

  if [ $RC -eq 0 ] && ! echo "$OUT" | grep -qiE "API Error|Overloaded|ENOTFOUND|went to sleep"; then
    log "$OUT"
    log "--- attempt $n: OK ---"
    break
  fi

  log "--- attempt $n FAILED (rc=$RC) ---"
  log "$OUT"
  RC=1
  [ "$n" -lt "$ATTEMPTS" ] && sleep 90
done

if [ $RC -ne 0 ]; then
  log "!!! ALL $ATTEMPTS ATTEMPTS FAILED — no update published, no alert sent."
  # Tell us it broke rather than failing silently.
  "$REPO/scripts/send-alert.sh" "+13129618960" \
    "Chelsea site: $MODE run failed after $ATTEMPTS tries. Nothing published. Check scripts/update.log." >/dev/null 2>&1
fi

log "--- final exit: $RC ---"
exit $RC
