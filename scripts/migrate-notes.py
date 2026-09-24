#!/usr/bin/env python3
"""
migrate-notes.py — one-time split of the append-only `notes` blob.

`notes` had become a running research diary (21k chars on GW4). Split into:
  notes        — short, stable fixture context only (what the tie IS)
  researchLog  — everything else, rendered in a collapsed <details> block
Also trims lineupSource to one citation line, methodology into the log.
"""
import json, re

P = "/Users/christopherbarnett/Projects/chelsea-2026-27/fixtures.json"
NOTES_CAP  = 420     # ~3 sentences
SOURCE_CAP = 240     # one citation line

def first_sentences(text, cap):
    """Take whole sentences up to cap chars."""
    out = ""
    for s in re.split(r'(?<=[.!?])\s+', text.strip()):
        if not s:
            continue
        if out and len(out) + 1 + len(s) > cap:
            break
        out = (out + " " + s).strip()
    return out

d = json.load(open(P))
for f in d:
    f.setdefault("researchLog", None)
    log_parts = []

    notes = (f.get("notes") or "").strip()
    if len(notes) > NOTES_CAP:
        keep = first_sentences(notes, NOTES_CAP)
        rest = notes[len(keep):].strip()
        f["notes"] = keep
        if rest:
            log_parts.append(rest)

    src = (f.get("lineupSource") or "").strip()
    if len(src) > SOURCE_CAP:
        keep = first_sentences(src, SOURCE_CAP)
        rest = src[len(keep):].strip()
        f["lineupSource"] = keep
        if rest:
            log_parts.append("Sourcing detail: " + rest)

    if log_parts:
        existing = (f.get("researchLog") or "").strip()
        f["researchLog"] = "\n\n".join(([existing] if existing else []) + log_parts)
        who = f"GW{f['gw']}" if f.get("gw") else f.get("roundLabel")
        print(f"  {who} v {f['opponent']:26} notes {len(f['notes']):>5}  "
              f"source {len(f.get('lineupSource') or ''):>4}  log {len(f['researchLog']):>6}")

json.dump(d, open(P, "w"), indent=2, ensure_ascii=False)
print(f"\nDone. {sum(1 for f in d if f.get('researchLog'))} fixtures now have a research log.")
