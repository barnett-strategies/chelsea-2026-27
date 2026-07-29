#!/bin/bash
# run-update.sh — invoked by launchd twice daily. Runs Claude Code headlessly
# against task-prompt.md to update the Chelsea briefing site.

export PATH="/Users/christopherbarnett/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

REPO="/Users/christopherbarnett/Projects/chelsea-2026-27"
LOG="$REPO/scripts/update.log"

cd "$REPO" || exit 1

echo "" >> "$LOG"
echo "===== $(date '+%Y-%m-%d %H:%M:%S %Z') =====" >> "$LOG"

claude -p "$(cat "$REPO/scripts/task-prompt.md")" \
  --allowedTools "Bash,Read,Write,Edit,Glob,Grep,WebSearch,WebFetch" \
  < /dev/null >> "$LOG" 2>&1

echo "--- exit code: $? ---" >> "$LOG"
