#!/bin/bash
# check-token.sh — warns before the GitHub token expires.
# The Aug 2026 outage happened because a 30-day token died silently and every
# push failed with no alert. `git ls-remote` is NOT a valid check: this repo is
# public, so it reads anonymously and succeeds even with a dead token.
# The only real test is an AUTHENTICATED API call.

export PATH="/Users/christopherbarnett/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
REPO="/Users/christopherbarnett/Projects/chelsea-2026-27"
cd "$REPO" || exit 1

TOK=$(git remote get-url origin | sed -E 's#https://([^@]+)@.*#\1#')
[ -z "$TOK" ] && { echo "TOKEN_MISSING"; exit 1; }

HDRS=$(curl -s -I -H "Authorization: token $TOK" \
       https://api.github.com/repos/barnett-strategies/chelsea-2026-27)
CODE=$(printf '%s' "$HDRS" | head -1 | awk '{print $2}')

if [ "$CODE" != "200" ]; then
  echo "TOKEN_DEAD (HTTP $CODE)"
  "$REPO/scripts/send-alert.sh" "+13129618960" \
    "Chelsea site: the GitHub token is DEAD (HTTP $CODE). Nothing can publish until it is replaced. Settings > Developer settings > Fine-grained tokens." >/dev/null 2>&1
  exit 1
fi

EXP=$(printf '%s' "$HDRS" | grep -i 'github-authentication-token-expiration' | cut -d' ' -f2)
if [ -n "$EXP" ]; then
  EXP_S=$(date -j -f "%Y-%m-%d" "$EXP" "+%s" 2>/dev/null)
  NOW_S=$(date "+%s")
  if [ -n "$EXP_S" ]; then
    DAYS=$(( (EXP_S - NOW_S) / 86400 ))
    echo "TOKEN_OK expires $EXP ($DAYS days)"
    if [ "$DAYS" -le 14 ]; then
      "$REPO/scripts/send-alert.sh" "+13129618960" \
        "Chelsea site: GitHub token expires in $DAYS days ($EXP). Replace it before it dies or matchday updates stop publishing." >/dev/null 2>&1
    fi
    exit 0
  fi
fi
echo "TOKEN_OK (no expiry header)"
