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
# Long-lived auth token (outside the repo; repo is public).
[ -f "$HOME/.config/chelsea/env" ] && . "$HOME/.config/chelsea/env"

REPO="/Users/christopherbarnett/Projects/chelsea-2026-27"
cd "$REPO" || exit 1

OUT="$(claude -p 'Reply with exactly: AUTHOK' --allowedTools ""  < /dev/null 2>&1)"
RC=$?

if echo "$OUT" | grep -qi "OAuth session expired\|Not logged in\|Failed to authenticate\|Invalid API key"; then
  echo "AUTH_DEAD"
  "$REPO/scripts/send-alert.sh" "+13129618960" \
    "Chelsea site: the claude CLI auth token is dead (this is the Terminal CLI, NOT the Claude desktop app - the app can look fine while this is broken). Fix: run  claude setup-token  in Terminal, then send Claude the new token. No updates or texts until then." >/dev/null 2>&1
  exit 1
fi

if [ $RC -ne 0 ] || ! echo "$OUT" | grep -q "AUTHOK"; then
  echo "AUTH_UNCERTAIN (rc=$RC): $(echo "$OUT" | head -2)"
  exit 2
fi

echo "AUTH_OK"
exit 0
