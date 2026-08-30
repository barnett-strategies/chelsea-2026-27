#!/usr/bin/env python3
"""
schedule-lineup-check.py

Reads fixtures.json, finds upcoming matches with a known kickoff time, and
creates a one-off launchd job at KICKOFF MINUS 70 MINUTES to fetch the official
starting XI. Official Premier League team sheets drop at T-75, so T-70 lands
5 minutes after they are published.

Schedules anything kicking off in the next 48 hours, so early kickoffs
(12:30 UK = 6:30am Central, T-70 = 5:20am) are scheduled the day before rather
than relying on a morning run that would already be too late.
"""
import json, os, re, subprocess, sys
from datetime import datetime, timedelta

REPO = "/Users/christopherbarnett/Projects/chelsea-2026-27"
AGENTS = os.path.expanduser("~/Library/LaunchAgents")
LABEL = "com.barnett.chelsea-lineup"

def parse_kickoff(fx):
    """Return datetime of kickoff in local (Central) time, or None."""
    ct = (fx.get("kickoffCT") or "").strip()
    if not ct or ct.upper() == "TBD":
        return None
    m = re.match(r"^(\d{1,2}):(\d{2})\s*([AP])\.?M\.?$", ct, re.I)
    if not m:
        return None
    hh, mm, ap = int(m.group(1)), int(m.group(2)), m.group(3).upper()
    if ap == "P" and hh != 12: hh += 12
    if ap == "A" and hh == 12: hh = 0
    try:
        d = datetime.strptime(fx["date"], "%Y-%m-%d")
    except Exception:
        return None
    return d.replace(hour=hh, minute=mm)

PLIST = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>{label}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>{repo}/scripts/run-update.sh</string>
        <string>lineup</string>
    </array>
    <key>StartCalendarInterval</key>
    <array>
{entries}
    </array>
    <key>RunAtLoad</key><false/>
    <key>StandardErrorPath</key><string>{repo}/scripts/launchd-error.log</string>
</dict>
</plist>
"""

def main():
    fixtures = json.load(open(os.path.join(REPO, "fixtures.json")))
    now = datetime.now()
    horizon = now + timedelta(hours=48)
    scheduled = []

    for fx in fixtures:
        ko = parse_kickoff(fx)
        if not ko:
            continue
        # Two passes. Official team sheets are published 60-75 min before kickoff,
        # and the exact moment varies by match: on 30 Aug 2026 the sheet landed at
        # T-60, so a single T-70 check ran 10 minutes early, found nothing, and the
        # in-process retry died with the process. T-55 clears both the 75- and
        # 60-minute cases; T-40 is the safety net for a late sheet.
        for offset in (55, 40):
            check_at = ko - timedelta(minutes=offset)
            if now < check_at <= horizon:
                scheduled.append((fx, ko, check_at, offset))

    path = os.path.join(AGENTS, LABEL + ".plist")

    if not scheduled:
        # No match imminent — tear down any stale job so it can't misfire.
        if os.path.exists(path):
            subprocess.run(["launchctl", "unload", path],
                           capture_output=True)
            os.remove(path)
            print("No match within 48h — removed stale lineup job.")
        else:
            print("No match within 48h — nothing to schedule.")
        return

    entries = "\n".join(
        f"""        <dict>
            <key>Month</key><integer>{c.month}</integer>
            <key>Day</key><integer>{c.day}</integer>
            <key>Hour</key><integer>{c.hour}</integer>
            <key>Minute</key><integer>{c.minute}</integer>
        </dict>""" for _, _, c, _ in scheduled)

    with open(path, "w") as f:
        f.write(PLIST.format(label=LABEL, repo=REPO, entries=entries))

    subprocess.run(["launchctl", "unload", path], capture_output=True)
    r = subprocess.run(["launchctl", "load", path], capture_output=True, text=True)
    if r.returncode != 0:
        print("launchctl load FAILED:", r.stderr.strip())
        sys.exit(1)

    fx, ko, _, _ = scheduled[0]
    label = (f"GW{fx['gw']}" if fx.get("gw")
             else f"{fx.get('competition','Cup')} {fx.get('roundLabel','')}".strip())
    print(f"Scheduled official-XI checks for {label} vs {fx['opponent']}")
    print(f"  kickoff : {ko:%a %b %d %I:%M %p} CT")
    for _, _, c, off in scheduled:
        print(f"  check   : {c:%a %b %d %I:%M %p} CT  (T-{off})")

if __name__ == "__main__":
    main()
