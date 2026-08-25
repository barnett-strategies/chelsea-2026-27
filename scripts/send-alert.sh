#!/bin/bash
# send-alert.sh — sends an iMessage via Messages.app.
# Hardened for launchd: launches Messages first (the -1712 AppleEvent timeout
# happens when Messages is closed and the implicit launch hangs), uses a long
# explicit timeout, retries once, and returns an HONEST exit code.
#
# Usage: ./send-alert.sh "+13129618960" "message text"

NUMBER="$1"
MESSAGE="$2"

if [ -z "$NUMBER" ] || [ -z "$MESSAGE" ]; then
  echo "send-alert: missing number or message" >&2
  exit 2
fi

# 1. Make sure Messages is actually up before we try to talk to it.
if ! pgrep -x Messages >/dev/null 2>&1; then
  open -g -a Messages 2>/dev/null
  for i in $(seq 1 20); do
    pgrep -x Messages >/dev/null 2>&1 && break
    sleep 1
  done
  sleep 3   # let it finish connecting to iMessage
fi

# 2. Send, with an explicit generous timeout. Retry once on failure.
send_once() {
  osascript <<EOF 2>&1
with timeout of 120 seconds
  tell application "Messages"
    set targetService to 1st account whose service type = iMessage
    set targetBuddy to participant "${NUMBER}" of targetService
    send "${MESSAGE}" to targetBuddy
  end tell
end timeout
EOF
}

OUT="$(send_once)"
RC=$?

if [ $RC -ne 0 ]; then
  echo "send-alert: attempt 1 failed for ${NUMBER}: ${OUT}" >&2
  sleep 5
  OUT="$(send_once)"
  RC=$?
fi

if [ $RC -ne 0 ]; then
  echo "SMS_FAILED ${NUMBER}: ${OUT}" >&2
  exit 1
fi

echo "SMS_SENT ${NUMBER}"
exit 0
