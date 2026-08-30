You are fetching the OFFICIAL starting XI for Chelsea's imminent match.
Work in /Users/christopherbarnett/Projects/chelsea-2026-27. Start with: git pull

## ABSOLUTE RULE — NO SPOILERS
Chris and Evan record matches and watch them hours or days later.
NEVER mention, record, or publish: scores, goals, goalscorers, results, who won,
red cards, or any in-match or post-match event. Not on the site, not in a text,
not in your summary. If a source headline contains a score, do not repeat it.
This site is a PRE-GAME information set only.

## STEP 1 — TIMING CHECK
Read fixtures.json. Find the match kicking off in roughly the next 70 minutes.
If its kickoff time has ALREADY PASSED, stop immediately: make no changes, send
no text, touch nothing. A match in progress or finished is frozen forever.

## STEP 2 — GET THE OFFICIAL XI
Search for the confirmed team sheet, e.g. "Chelsea confirmed lineup [opponent]".
Only official team sheets count: the club's own account, the Premier League match
centre, or a wire service. A pundit prediction is NOT confirmation.

If the XI is not published yet, do NOT set an in-process timer — the process
exits and the timer dies with it (this is exactly how the 30 Aug 2026 check
failed). There are TWO scheduled passes, at T-55 and T-40. If this is the T-55
pass and the sheet is not out, simply report that and stop; the T-40 pass will
catch it. Leave lineupStatus as "projected", change nothing, send no text.
Never guess an XI.

When found, in fixtures.json for that fixture:
- set lineupStatus to "confirmed"
- replace lineupXI with the real XI as [{"pos","name","stat"}] objects, carrying
  over each player's existing "stat" value where the player was already in the
  projection; fill any new player's stat per the key-stats rules in task-prompt.md
- set lineupConfirmedAt to the current time, e.g. "1:05 PM CT"
- set lineupSource to where you saw it
- set lastUpdated with date and time
- write a lineupNote flagging what differs from the projection (formation change,
  surprise inclusions, who dropped out). Tactical only — never results.

## STEP 3 — PUBLISH
Run: node generate.js

IMPORTANT TRAP: generate.js deliberately SKIPS matchweek 1 (`if (fx.gw === 1)
continue`) because gw01-fulham.html is hand-built. If the fixture is GW1, you
MUST hand-edit gw01-fulham.html yourself — generate.js will publish nothing.
Verify your change is actually in the .html file before committing.

Then: git add -A && git commit -m "GW[n] vs [opponent]: official XI confirmed" && git push

## STEP 4 — ALERT BOTH RECIPIENTS
Send to BOTH numbers, one call each:
  ./scripts/send-alert.sh "+13129618960" "MESSAGE"
  ./scripts/send-alert.sh "+18168764088" "MESSAGE"

MESSAGE: under 300 chars, no double quotes, NO SPOILERS. Cover what changed from
the projection and the link. Example:
"Chelsea: official XI in for GW2 v Brighton. Lavia starts, Caicedo benched, back
three confirmed. https://chelsea-fc-2026-27.netlify.app/gw02-brighton-and-hove-albion"

The script prints SMS_SENT or SMS_FAILED and returns an honest exit code.
Report exactly which recipients succeeded. Never claim a text was sent if the
script returned non-zero.

## FINISH
One line: what you published and whether both texts sent. No scores, ever.
