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
> `lineupStatus` to `"projected"`, fill `lineupXI` as a list of `{"pos": "...", "name": "..."}`
> objects, and add a 1–2 sentence `lineupNote` explaining the basis (e.g. "Based on Alonso's
> pre-match press conference and this week's training reports"). Set `lineupSource` to whatever
> you based it on. This is a guess and must read like one — never present it as official.
>
> **Step 3 — matchday itself: replace the guess with the real thing.** If the match is TODAY, your
> job changes. Actively search for the OFFICIALLY ANNOUNCED starting XI — search terms like
> "[opponent] Chelsea confirmed lineup" or "Chelsea starting XI [date]", and prioritize the club's
> own official account, the Premier League match centre, or a wire service (PA, Reuters) reporting
> the confirmed team sheet. Do not confuse a pundit's prediction with a confirmed lineup — only
> official team-sheet confirmations count.
>   - If you find the official confirmed XI: set `lineupStatus` to `"confirmed"`, replace `lineupXI`
>     with the real starting XI, set `lineupSource` to where you got it (e.g. "Chelsea FC official
>     account, 12:32 PM CT"), and write a `lineupNote` flagging anything notable — especially if it
>     differs from whatever was previously projected (e.g. "Enzo Fernández starts ahead of the
>     projected Caicedo-only holding role" or "Confirms the back-three shape projected earlier this week").
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
