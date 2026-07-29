You are updating the Chelsea 2026/27 briefing site. Work in /Users/christopherbarnett/Projects/chelsea-2026-27

Start with: git pull

Read fixtures.json. Determine today's date.

## STEP 1 — ANYTHING TO DO?
Is any Chelsea Premier League match within the next 4 days? If no: stop immediately. No commit, no text, no changes.

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

## RULES
Only touch fields that are null, "TBD", or a supersedable projection. Never overwrite confirmed data. Never invent a number, name, or source. If you found nothing new, make no changes at all.

## STEP 4 — PUBLISH
If and only if something changed:
  node generate.js
  git add -A
  git commit -m "GW[n] vs [opponent]: [what changed]"
  git push

## STEP 5 — ALERT
If and only if you made a real change, run the alert script once per recipient:
  ./scripts/send-alert.sh "+13129618960" "MESSAGE"
  ./scripts/send-alert.sh "+18168764088" "MESSAGE"

MESSAGE must be under 300 characters: what changed, which match, and the page link.
Example: "Chelsea: GW9 vs Man Utd - lineup confirmed, Enzo starts. chelsea-fc-2026-27.netlify.app/gw09-manchester-united"

Do not include double quotes inside MESSAGE. If nothing changed, do not run the script.

## FINISH
Print one line: what you did, or "no updates this run".
