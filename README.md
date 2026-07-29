# Chelsea 2026/27 Season Briefing Site

38 matchweek pages + a homepage schedule, for the Chelsea FC 2026/27 Premier League season.
Built as a static site — drop the whole folder into Netlify, or connect this repo to Netlify
for continuous deployment.

## Structure

- `index.html` — homepage: full 38-game schedule, grouped by month, with an "up next" card.
- `gw01-fulham.html` … `gw38-brentford.html` — one page per matchweek.
- `styles.css` / `fonts.css` — shared design system (dark, Central-time-first, imperial units). Every page links these; don't duplicate CSS inline in a page.
- `fixtures.json` — the single source of truth for all 38 matches (date, venue, kickoff time, broadcast, odds, lineup-ready flag, notes).
- `generate.js` — regenerates `gw02...gw38` and `index.html` from `fixtures.json`. Run with `node generate.js`.

`gw01-fulham.html` is hand-authored (full narrative, odds, and projected XI table) and is **not**
overwritten by `generate.js` — it's excluded deliberately (see the `if (fx.gw === 1) continue`
line). If gw01 ever needs a refresh, edit it directly.

## How to update a match

1. Edit the relevant entry in `fixtures.json` (kickoff time, `broadcastUS`, odds, `lineupReady`, `notes`).
2. Run `node generate.js`.
3. Commit and push. If this repo is connected to Netlify, that's it — the site redeploys automatically.

## Text alerts

Carrier email-to-SMS gateways (tmomail.net and equivalents) were discontinued across all major
US carriers in late 2024/2025 — sending to `number@tmomail.net` no longer delivers, silently.
Real automated texting now needs an actual SMS API. **Twilio** is the standard choice: a phone
number costs about $1/month and each text is roughly $0.0079.

**One-time setup (not done yet):**
1. Create a free Twilio account, buy one phone number (~$1/mo).
2. Grab the Account SID and Auth Token from the Twilio console.
3. Give those two values to the scheduled task (see below) — same handling as the GitHub token:
   pasted into the task's own saved prompt, **never committed to this repo**, since this repo is
   public.

**Recipient phone numbers also do not belong in this repo** for the same reason — they're
configured only inside the scheduled task's private instructions in Cowork, not in `fixtures.json`
or anywhere else that gets pushed to GitHub.

**Alert behavior:** after each scheduled run (see below), if anything in `fixtures.json` actually
changed — a new broadcast channel, odds posted, a lineup switching from projected to confirmed —
send one short text (via the Twilio REST API, a plain HTTPS POST, no SDK needed) to each configured
recipient summarizing what changed and linking the updated page. If a run made no changes, send
no text at all — silence is expected on most runs.

## Scheduled task (Claude Cowork)

### Why this needs two runs a day, not one

Official Premier League starting lineups are announced roughly 60–75 minutes before kickoff —
not the morning of. Chelsea's kickoffs range from as early as 12:30pm UK (early Saturday slot) to
8:00pm UK (Monday/Friday Night Football). The UK is a consistent 6 hours ahead of US Central, so
in Central time that's a kickoff window of roughly **6:30 AM to 2:00 PM**, and lineup announcements
land anywhere from **~5:15 AM to ~12:45 PM Central** depending on the slot.

One fixed morning run can't catch both ends of that. So there are two scheduled runs:

| Run | Time (Central) | Catches confirmed lineups for |
|---|---|---|
| **Morning** | 8:00 AM | 12:30pm / 2:00pm / 3:00pm UK kickoffs (standard Saturday–Sunday slots) |
| **Midday**  | 1:00 PM  | 4:30pm / 5:30pm / 7:45pm / 8:00pm UK kickoffs (Super Sunday, Friday Night Football, Monday Night Football) |

Both runs use the *same* task prompt below — the prompt itself figures out what phase a match is
in and does the right thing. Set up two scheduled tasks (or one task scheduled twice daily, if
your Cowork setup supports that) pointing at the same prompt.

### The task prompt

> Clone the GitHub repo [REPO_URL] (use the stored credential). Read `fixtures.json`. Find today's date.
>
> **Step 1 — is there anything to do?** Check whether any Chelsea Premier League match is
> happening in the next 4 days. If none, stop. Do nothing, don't commit.
>
> **Step 2 — general prep (4 days out down to the day before).** If the match is more than 0 days
> away (i.e. not today), web-search for that fixture and update whichever of these `fixtures.json`
> fields are still null/TBD: confirmed kickoff time (UK and US Central), the US broadcast channel
> (NBC, USA Network, or Peacock — use general web search, not support.claude.com), and match odds
> (Chelsea/draw/opponent, American format) from a mainstream sportsbook or odds aggregator. Also
> check for team news or a press-conference hint about the likely XI. If you find one, set
> `lineupStatus` to `"projected"`, fill `lineupXI` as a list of `{"pos": "...", "name": "...", "stat": "..."}`
> objects, and add a 1–2 sentence `lineupNote` explaining the basis (e.g. "Based on Alonso's
> pre-match press conference and this week's training reports"). Set `lineupSource` to whatever
> you based it on. This is a guess and must read like one — never present it as official.
>
> **Key stats — one per player, intelligently chosen.** For the `stat` field on each `lineupXI`
> entry, pick the two numbers that best tell that player's season so far, formatted like
> `"10 goals, 4 assists"` or `"9 clean sheets, 32 apps"` — always with the season and club labeled,
> e.g. `"2025–26, Chelsea"` or `"2025–26, Crystal Palace"` for a new signing's stats from their
> previous club. Rules:
>   - **Early season (Chelsea have played fewer than ~5 games this campaign):** use each player's
>     final 2025–26 stats — from Chelsea if they were already at the club, or from their previous
>     club if they're a new arrival (Lacroix, Palestra, Rogers, etc.). Always label which season and
>     club the numbers are from — never let a stat appear unlabeled or look like it's from the
>     current Chelsea campaign when it isn't.
>   - **Once Chelsea have played ~5 games this season:** switch each player over to their 2026–27
>     Chelsea stats so far, and update the label accordingly (e.g. `"2026–27, Chelsea"`). Do this
>     player-by-player as they individually cross a reasonable minutes/appearances threshold — don't
>     wait for the whole squad to hit game 5 if one player already has a clear current-season record.
>   - Pick stats that fit the position and the story: appearances for an injury-prone or new player,
>     goals/assists for attackers, clean sheets/tackles for defenders, save data for goalkeepers.
>     Two numbers max. If a player has no current-season minutes yet (unused new signing), it's fine
>     to keep last season's club stats even past the 5-game mark, clearly labeled.
>   - Never fabricate a number. If you can't verify a stat, leave `stat` blank rather than guess.
>
> **Step 3 — matchday itself: replace the guess with the real thing.** If the match is TODAY, your
> job changes. Actively search for the OFFICIALLY ANNOUNCED starting XI — search terms like
> "[opponent] Chelsea confirmed lineup" or "Chelsea starting XI [date]", and prioritize the club's
> own official account, the Premier League match centre, or a wire service (PA, Reuters) reporting
> the confirmed team sheet. Do not confuse a pundit's prediction with a confirmed lineup — only
> official team-sheet confirmations count.
>   - If you find the official confirmed XI: set `lineupStatus` to `"confirmed"`, replace `lineupXI`
>     with the real starting XI (carrying over each player's `stat` field from the projection where
>     the player is unchanged, or filling it fresh per the key-stats rules above for any surprise
>     inclusion), set `lineupSource` to where you got it (e.g. "Chelsea FC official account, 12:32 PM
>     CT"), and write a `lineupNote` flagging anything notable — especially if it differs from
>     whatever was previously projected (e.g. "Enzo Fernández starts ahead of the projected
>     Caicedo-only holding role" or "Confirms the back-three shape projected earlier this week").
>   - If it's today but too early for the official lineup yet (this run is more than ~2 hours before
>     kickoff), leave `lineupStatus` as `"projected"` and don't overwrite it with a guess about a guess —
>     the later run today should catch the real announcement instead.
>   - Never downgrade `lineupStatus` from `"confirmed"` back to `"projected"` — once it's confirmed,
>     leave it alone for the rest of the day.
>
> **General rules.** Only change fields that are currently null/TBD/projected-and-supersedable —
> never overwrite a field that's already confirmed, and never invent a number or a name you can't
> source. If nothing changed, make no changes and don't commit.
>
> If you changed anything, run `node generate.js`, then commit with a message like
> "GW[n] vs [opponent]: confirmed lineup" or "GW[n] vs [opponent]: broadcast + odds added" and
> push to the main branch.
>
> **Then send the alert.** If (and only if) you made a real change this run, send one short text
> to each configured recipient via the Twilio REST API (POST to
> `https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`, Basic Auth with the
> Account SID and Auth Token, body params `From`, `To`, `Body`). Keep the text under ~300
> characters: what changed, which match, and the page link (e.g.
> "Chelsea alerts: GW9 vs Man Utd — official lineup confirmed, Enzo starts. chelsea-fc-2026-27.netlify.app/gw09-manchester-united").
> If nothing changed this run, send no text.
>
> Give me a one-line summary of what you did (or "no updates this run").

Replace `[REPO_URL]` with this repo's URL, and make sure the task has a GitHub credential
(personal access token, fine-grained, scoped to just this repo with Contents: read/write) available
when it runs — without that it can't push.

## Design notes

- Central time is the primary kickoff display everywhere; UK time is secondary.
- All measurements in this project are imperial, not metric.
- Dark-native palette (`--bg`, `--panel`, `--text`, etc. in `styles.css`) — don't rely on
  `color-scheme` or `prefers-color-scheme` to invert it; every color is explicit so it reads
  correctly regardless of the device's system theme.
