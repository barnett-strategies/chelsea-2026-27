#!/bin/bash
# send-alert.sh — sends a short iMessage via Messages.app (must run ON the Mac, Messages.app signed in)
#
# Usage:
#   ./send-alert.sh "+13129618960" "Chelsea alert: GW9 vs Man Utd — lineup confirmed."
#
# Requires:
#   - macOS, Messages.app open and signed into iMessage
#   - Automation permission granted the first time (System Settings > Privacy & Security >
#     Automation > [whatever app is running this: Terminal / Claude Desktop] > Messages, checked on)
#   - The recipient's number in E.164 format (e.g. +13129618960), no spaces or dashes

set -euo pipefail

NUMBER="$1"
MESSAGE="$2"

osascript <<EOF
tell application "Messages"
    set targetService to 1st service whose service type = iMessage
    set targetBuddy to buddy "${NUMBER}" of targetService
    send "${MESSAGE}" to targetBuddy
end tell
EOF
