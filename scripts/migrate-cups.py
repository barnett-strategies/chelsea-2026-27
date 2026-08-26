#!/usr/bin/env python3
"""One-time migration: add competition support, then insert the Luton cup tie."""
import json

P = "/Users/christopherbarnett/Projects/chelsea-2026-27/fixtures.json"
d = json.load(open(P))

# 1. Every existing fixture is Premier League.
for fx in d:
    fx.setdefault("competition", "Premier League")
    fx.setdefault("roundLabel", f"Matchweek {fx['gw']}")

# 2. Insert the Carabao Cup second round tie.
luton = {
    "gw": None,
    "competition": "Carabao Cup",
    "roundLabel": "Second Round",
    "slug": "eflcup-r2-luton-town",
    "date": "2026-08-27",
    "day": "Thursday",
    "opponent": "Luton Town",
    "homeAway": "H",
    "venue": "Stamford Bridge",
    "venueCity": "London",
    "kickoffUK": "19:30",
    "kickoffCT": "1:30 PM",
    "broadcastUS": None,
    "oddsChe": None, "oddsDraw": None, "oddsOpp": None,
    "fairChe": None, "fairDraw": None, "fairOpp": None,
    "lineupStatus": "unknown", "lineupXI": [], "lineupSource": None,
    "lineupNote": None, "lineupConfirmedAt": None,
    "lastUpdated": None, "lastBriefingSent": None,
    "notes": ("Xabi Alonso's first competitive home match as Chelsea manager. Luton are a "
              "League One side managed by former Arsenal midfielder Jack Wilshere, and arrive "
              "having won the EFL Trophy last season. Alonso's Wednesday press conference "
              "ruled out Caicedo and Palestra for this tie. Expect heavy rotation.")
}

if not any(f.get("slug") == luton["slug"] for f in d):
    d.append(luton)

d.sort(key=lambda f: f["date"])
json.dump(d, open(P, "w"), indent=2)
print(f"{len(d)} fixtures. Next three by date:")
for f in d[:3]:
    print(f"  {f['date']}  {f['competition']:15} {f['roundLabel']:15} vs {f['opponent']}")
