You are updating the Chelsea 2026/27 briefing site (PREP run — match info and
projected lineup, a couple of days out).
Work in /Users/christopherbarnett/Projects/chelsea-2026-27

Start with: git pull

## ABSOLUTE RULE — NO SPOILERS
Chris and Evan record matches and watch them hours or days later.
NEVER mention, record, or publish: scores, goals, goalscorers, results, who won,
red cards, or any in-match or post-match event. Not on the site, not in a text,
not in your summary. If a source headline contains a score, do not repeat it.
This site is a PRE-GAME information set only.

## ALWAYS: RE-ARM THE OFFICIAL-XI CHECK
Before anything else, run:
  python3 scripts/schedule-lineup-check.py
This reads kickoff times and schedules the T-70 official-XI job. Run it every
time, even if nothing else changes — it is what makes matchday alerts fire.

Read fixtures.json. Determine today's date.

## STEP 1 — ANYTHING TO DO?
Is any Chelsea Premier League match within the next 4 days? If no: stop (you have
already re-armed the check above). No commit, no text, no other changes.

NEVER touch a fixture whose kickoff time has already passed. Past matches are
frozen as previews permanently.

## STEP 2 — PREP (match is 1-4 days away)
Web-search that fixture. Fill ONLY fields still null or "TBD":
- confirmed kickoff time (kickoffUK and kickoffCT)
- broadcastUS: the US channel (NBC, USA Network, or Peacock)
- odds: oddsChe / oddsDraw / oddsOpp in American format from a mainstream sportsbook, plus fairChe / fairDraw / fairOpp as de-vigged integer percentages
- if team news or a press conference suggests an XI: set lineupStatus to "projected", fill lineupXI as a list of {"pos","name","stat"} objects, add a 1-2 sentence lineupNote explaining the basis, set lineupSource. This is a guess and must read like one.

## KEY STATS (the "stat" field on each player)
Two numbers that tell that player's season, labeled with season and club.
Format: "10 goals, 4 assists" or "9 clean sheets, 32 apps"

- Until Chelsea have played ~5 games this season: use 2025-26 final stats, from the player's PREVIOUS club if they are a new signing, always labeled (e.g. "2025-26, Aston Villa").
- After Chelsea have played ~5 games: switch that player to 2026-27 Chelsea stats and relabel. Do this player by player as each accumulates meaningful minutes, not all at once.
- Fit the position: appearances for injury-prone or new players, goals+assists for attackers, clean sheets/tackles for defenders, saves/clean sheets for goalkeepers.
- Never fabricate a number. Leave stat blank if you cannot verify it.

## STEP 3 — MATCHDAY (match is TODAY)
Search for the OFFICIALLY ANNOUNCED starting XI. Search terms like "Chelsea confirmed lineup [opponent]" or "Chelsea starting XI [date]".
Only official team sheets count: the club's own account, the Premier League match centre, or a wire service (PA, Reuters). A pundit's prediction is NOT confirmation.

- If found: set lineupStatus to "confirmed", replace lineupXI with the real starting XI (carry over the stat field for players who were already in the projection, fill fresh per the key-stats rules for any surprise inclusion), set lineupSource including the time you saw it, and write a lineupNote flagging anything notable — especially where it differs from the earlier projection.
- If it is today but more than ~2 hours before kickoff, it is too early: leave lineupStatus as "projected" and do not guess.
- NEVER downgrade lineupStatus from "confirmed" back to "projected".

## TIMESTAMPS (do this whenever you change a fixture)
- Set that fixture's lastUpdated to a readable date, e.g. "August 22, 2026". If you changed something meaningful on a matchday, include the time: "August 24, 2026, 1:05 PM CT".
- When you set lineupStatus to "confirmed", ALSO set lineupConfirmedAt to the time you replaced the projection, e.g. "1:05 PM CT". This makes the projected-to-official handoff visible on the page.
- Only stamp fixtures you actually changed. Leave every other fixture's lastUpdated alone.

## RULES
Only touch fields that are null, "TBD", or a supersedable projection. Never overwrite confirmed data. Never invent a number, name, or source. If you found nothing new, make no changes at all.

## STEP 4 — PUBLISH
If something changed:
  node generate.js
  git add -A
  git commit -m "GW[n] vs [opponent]: [what changed]"
  git push

IMPORTANT TRAP: generate.js deliberately SKIPS matchweek 1 (`if (fx.gw === 1)
continue`) because gw01-fulham.html is hand-built. For GW1 you MUST hand-edit
that .html yourself and verify the change landed before committing.

## STEP 5 — THE BRIEFING TEXT
Send a briefing text when the match is 2 OR 3 DAYS AWAY — every time, whether or
not anything changed. This is the guaranteed pre-match briefing, not a
change-notification. Send once per match, not on both days: if lastBriefingSent
for this fixture is already set, skip it.

Contents: opponent, home/away, kickoff in Central time, US channel, odds, and the
headline of the projected XI. Under 300 chars, no double quotes, NO SPOILERS.
Example:
"Chelsea briefing: Sat v Brighton (H), 9am CT on USA. Chelsea -140. Projected XI
has Lavia alongside Caicedo, Palmer + Rogers behind Joao Pedro.
chelsea-fc-2026-27.netlify.app/gw02-brighton-and-hove-albion"

Send to BOTH:
  ./scripts/send-alert.sh "+13129618960" "MESSAGE"
  ./scripts/send-alert.sh "+18168764088" "MESSAGE"

Then set lastBriefingSent on that fixture to today's date and commit it.

The script prints SMS_SENT or SMS_FAILED and returns an honest exit code. Report
exactly which recipients succeeded. NEVER claim a text was sent if the script
returned non-zero — a previous version of this system silently failed for weeks.

## FINISH
One line: what you did and whether both texts sent, or "no updates this run".
No scores, ever.
