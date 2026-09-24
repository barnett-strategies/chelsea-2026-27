#!/bin/bash
# check-auth.sh — catches a dying Claude Code session BEFORE a matchday.
#
# On 12 Sep 2026 the OAuth session expired and every run failed for four days.
# The GitHub token check already exists; this is the same idea for the CLI login.
#
# The lesson from `git ls-remote` passing against a dead token: a check that
# cannot fail is not a check. So this makes a REAL round-trip through the CLI
# and inspects the answer, rather than just confirming the binary exists.

export PATH="/Users/christopherbarnett/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
REPO="/Users/christopherbarnett/Projects/chelsea-2026-27"
cd "$REPO" || exit 1

OUT="$(claude -p 'Reply with exactly: AUTHOK' --allowedTools "" < /dev/null 2>&1)"
RC=$?

if echo "$OUT" | grep -qi "OAuth session expired\|Not logged in\|Failed to authenticate\|Invalid API key"; then
  echo "AUTH_DEAD"
  "$REPO/scripts/send-alert.sh" "+13129618960" \
    "Chelsea site: Claude Code is LOGGED OUT. Automated runs cannot publish until you run: claude  then /login. Nothing will update or text until then." >/dev/null 2>&1
  exit 1
fi

if [ $RC -ne 0 ] || ! echo "$OUT" | grep -q "AUTHOK"; then
  echo "AUTH_UNCERTAIN (rc=$RC): $(echo "$OUT" | head -2)"
  exit 2
fi

echo "AUTH_OK"
exit 0
