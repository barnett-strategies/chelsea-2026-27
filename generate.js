const fs = require('fs');

const fixtures = JSON.parse(fs.readFileSync('fixtures.json', 'utf8'));

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function slug(name){
  return name.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}
function fileFor(fx){
  const n = String(fx.gw).padStart(2,'0');
  return `gw${n}-${slug(fx.opponent)}.html`;
}
function prettyDate(iso){
  const [y,m,d] = iso.split('-').map(Number);
  return `${MONTHS[m-1]} ${d}, ${y}`;
}
function prettyDateShort(iso){
  const [y,m,d] = iso.split('-').map(Number);
  return `${MONTHS[m-1].slice(0,3)} ${d}`;
}

function head(title, description){
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta name="theme-color" content="#0B1526">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="wrap">`;
}
const FOOT_CLOSE = `</div>
</body>
</html>
`;

function topnav(fx){
  const prev = fx.gw > 1 ? fixtures.find(f=>f.gw===fx.gw-1) : null;
  const next = fx.gw < 38 ? fixtures.find(f=>f.gw===fx.gw+1) : null;
  return `<div class="topnav">
  <a href="index.html">&larr; Season schedule</a>
  <span class="crest">Matchweek ${fx.gw} / 38</span>
  ${next ? `<a href="${fileFor(next)}">Next: ${next.opponent} &rarr;</a>` : `<span></span>`}
</div>`;
}

function gamePage(fx){
  const vs = fx.homeAway === 'H' ? `Chelsea<span class="v">versus</span>${fx.opponent}` : `${fx.opponent}<span class="v">versus</span>Chelsea`;
  const where = fx.homeAway === 'H' ? `${fx.venue}, ${fx.venueCity}` : `${fx.venue}, ${fx.venueCity}`;
  const haWord = fx.homeAway === 'H' ? 'home' : 'away';
  const title = `${fx.homeAway==='H' ? 'Chelsea v '+fx.opponent : fx.opponent+' v Chelsea'} — Matchweek ${fx.gw} Briefing`;
  const desc = `Chelsea ${haWord} to ${fx.opponent} on ${prettyDate(fx.date)}. Kickoff time, US broadcast and odds, updated as they're confirmed.`;

  const kickBlock = fx.kickoffCT !== 'TBD'
    ? `<div class="kick">
        <div class="big"><span>Kickoff — Central time</span><b>${fx.kickoffCT}</b></div>
        <div class="alt"><span>Local, UK</span><b>${fx.kickoffUK}</b></div>
      </div>`
    : `<div class="kick tbd">
        <div class="big"><span>Kickoff time</span><b>Not yet announced</b></div>
        <div class="alt"><span>Confirmed date</span><b>${prettyDateShort(fx.date)}</b></div>
      </div>`;

  const broadcastRow = fx.broadcastUS
    ? `<div class="info-row"><dt>Channel</dt><dd><b>${fx.broadcastUS}</b><span class="yes">confirmed</span></dd></div>`
    : `<div class="info-row"><dt>Channel</dt><dd class="pending">Not yet announced. The Premier League gives at least five to six weeks' notice of UK broadcast picks, and NBC Sports assigns the US channel (NBC, USA Network, or Peacock-exclusive) on a similar timetable — check back closer to matchday.</dd></div>`;

  const oddsSection = fx.oddsChe
    ? `<div class="odds">
        <div class="odd che"><div class="team">Chelsea</div><div class="price">${fx.oddsChe}</div></div>
        <div class="odd"><div class="team">Draw</div><div class="price">${fx.oddsDraw}</div></div>
        <div class="odd"><div class="team">${fx.opponent}</div><div class="price">${fx.oddsOpp}</div></div>
      </div>
      <div class="bar" role="img" aria-label="Fair win probability"><i class="b-che" style="width:${fx.fairChe}%"></i><i class="b-drw" style="width:${fx.fairDraw}%"></i><i class="b-ful" style="width:${fx.fairOpp}%"></i></div>
      <p class="bar-key">Fair probability, margin removed: <b>Chelsea ~${fx.fairChe}%</b> · Draw ~${fx.fairDraw}% · ${fx.opponent} ~${fx.fairOpp}%</p>`
    : `<div class="tbd-block"><b>Odds not yet posted.</b><br>Mainstream books generally open markets on a match one to two weeks out. Check back as matchday approaches.</div>`;

  function xiList(xi){
    return `<div class="xi-list">${xi.map(p => `<div class="xi-row"><div class="xi-pos">${p.pos}</div><div class="xi-name">${p.name}${p.stat ? `<span class="xi-stat">${p.stat}</span>` : ''}</div></div>`).join('')}</div>`;
  }

  let lineupSection;
  if (fx.lineupStatus === 'confirmed' && fx.lineupXI && fx.lineupXI.length){
    lineupSection = `<div class="lineup-head"><span class="badge-confirmed">Confirmed</span><span style="font-family:'Roboto Mono',monospace;font-size:12px;color:var(--muted)">Official starting XI${fx.lineupConfirmedAt ? ` &middot; replaced the projection at ${fx.lineupConfirmedAt}` : ''}</span></div>
      ${xiList(fx.lineupXI)}
      ${fx.lineupNote ? `<div class="verdict">${fx.lineupNote}</div>` : ''}
      ${fx.lineupSource ? `<p class="lineup-source">Source: ${fx.lineupSource}</p>` : ''}`;
  } else if (fx.lineupStatus === 'projected' && fx.lineupXI && fx.lineupXI.length){
    lineupSection = `<div class="lineup-head"><span class="badge-projected">Projected</span><span style="font-family:'Roboto Mono',monospace;font-size:12px;color:var(--muted)">Not yet officially confirmed</span></div>
      <div class="lineup-caveat">This is a projection built from team news and press-conference hints — not the official lineup. It will be replaced automatically with the confirmed XI once the club announces it, typically 60&ndash;75 minutes before kickoff.</div>
      ${xiList(fx.lineupXI)}
      ${fx.lineupNote ? `<div class="verdict">${fx.lineupNote}</div>` : ''}
      ${fx.lineupSource ? `<p class="lineup-source">Basis: ${fx.lineupSource}</p>` : ''}`;
  } else {
    lineupSection = `<div class="tbd-block"><b>Lineup not yet projected.</b><br>Team news, injuries and Xabi Alonso's selection pattern will come into focus in the days before kickoff — this section will be filled in as matchday nears, then replaced with the confirmed XI shortly before kickoff.</div>`;
  }

  const notes = fx.notes ? `<div class="verdict">${fx.notes}</div>` : '';

  return head(title, desc) + `
${topnav(fx)}
<header class="hero">
  <p class="eyebrow">Premier League 2026/27 · Matchweek ${fx.gw}</p>
  <h1 class="fixture">${vs}</h1>
  <p class="subline">${where} · <strong>${prettyDate(fx.date)}${fx.day ? ' ('+fx.day+')' : ''}</strong> · Chelsea ${haWord}</p>
  ${kickBlock}
</header>

<section>
  <p class="kicker">Watching in the United States</p>
  <h2>Broadcast</h2>
  <dl class="info">
    ${broadcastRow}
    <div class="info-row"><dt>Streaming</dt><dd class="pending">Typically simulcast to Peacock only for NBC-branded games; USA Network games generally require a pay-TV login (YouTube TV, Hulu + Live TV, cable/satellite).</dd></div>
  </dl>
</section>

<section>
  <p class="kicker">The odds</p>
  <h2>Match odds</h2>
  ${oddsSection}
</section>

<section>
  <p class="kicker">The likely XI</p>
  <h2>Projected lineup</h2>
  ${lineupSection}
</section>

${notes ? `<section>${notes}</section>` : ''}

<footer>
  <b>Matchweek ${fx.gw} of 38.</b> ${fx.lastUpdated ? `This page last updated <b>${fx.lastUpdated}</b>.` : `No updates to this page yet &mdash; nothing beyond the fixture itself has been confirmed.`} Fixture per the Premier League's official 2026/27 release; subject to change for broadcast selection or cup involvement. Updated automatically as new information is confirmed.
</footer>
` + FOOT_CLOSE;
}

// ---------------- Homepage ----------------
function homePage(){
  const played = fixtures.filter(f=>f.status==='played');
  const upcoming = fixtures.filter(f=>f.status!=='played');
  const next = upcoming[0];

  let rows = '';
  let lastMonthKey = '';
  for (const fx of fixtures){
    const [y,m] = fx.date.split('-').map(Number);
    const monthKey = `${MONTHS[m-1]} ${y}`;
    if (monthKey !== lastMonthKey){
      rows += `<div class="month-head">${monthKey}</div>`;
      lastMonthKey = monthKey;
    }
    const isGw1 = fx.gw === 1;
    const href = isGw1 ? 'gw01-fulham.html' : fileFor(fx);
    const haBadge = fx.homeAway === 'H' ? '<span class="ha h">H</span>' : '<span class="ha a">A</span>';
    const timeStr = fx.kickoffCT !== 'TBD' ? fx.kickoffCT + ' CT' : 'time TBD';
    rows += `<a class="gamerow" href="${href}">
      <div class="gwno">${fx.gw}</div>
      <div class="mid"><b>${haBadge}${fx.opponent}</b><span>${prettyDateShort(fx.date)}, ${y} · ${fx.venue}</span></div>
      <div class="side">${timeStr}</div>
    </a>`;
  }

  const nextHref = next.gw === 1 ? 'gw01-fulham.html' : fileFor(next);
  const nextBlock = next ? `<a class="nextup" href="${nextHref}">
    <div class="tag">Up next &middot; Matchweek ${next.gw}</div>
    <div class="match">${next.homeAway==='H' ? 'Chelsea vs '+next.opponent : next.opponent+' vs Chelsea'}</div>
    <div class="meta">${prettyDate(next.date)} · ${next.venue}, ${next.venueCity} ${next.kickoffCT!=='TBD' ? '· '+next.kickoffCT+' CT' : ''}</div>
    <div class="cta">Open full briefing &rarr;</div>
  </a>` : '';

  return head('Chelsea 2026/27 — Full Season Briefing', 'All 38 Chelsea Premier League fixtures for 2026/27: kickoff times in Central time, US broadcast info, odds and projected lineups, updated through the season.') + `
<header class="season-hero">
  <p class="crest">Premier League 2026/27</p>
  <h1>Chelsea<br>Season Briefing</h1>
  <p>All 38 matches. Kickoff times in Central time, US broadcast info, odds and the projected lineup — filled in and updated as each matchday approaches. Site last updated ${prettyDate(new Date().toISOString().slice(0,10))}; each match page shows its own last-updated date.</p>
  ${nextBlock}
</header>

<section style="margin-top:8px">
  <p class="kicker">The full schedule</p>
  <h2>38 matchweeks</h2>
  <div class="legend"><span><span class="ha h">H</span> Home — Stamford Bridge</span><span><span class="ha a">A</span> Away</span></div>
  <div class="gamelist" style="margin-top:18px">
    ${rows}
  </div>
</section>

<footer>
  <b>Site last updated ${prettyDate(new Date().toISOString().slice(0,10))}.</b> This date reflects the last time any match page changed, not a daily rebuild &mdash; individual match pages carry their own last-updated dates. Source: Chelsea FC and Premier League official fixture announcements. Fixtures subject to change for broadcast selection, weather, or cup-competition rescheduling. This site updates automatically as new information (kickoff times, US broadcaster, odds, and projected lineups) is confirmed closer to each match.
</footer>
` + FOOT_CLOSE;
}

// ---------------- Write files ----------------
for (const fx of fixtures){
  if (fx.gw === 1) continue; // gw1 is hand-built separately (gw01-fulham.html)
  fs.writeFileSync(fileFor(fx), gamePage(fx));
}
fs.writeFileSync('index.html', homePage());
console.log('Generated', fixtures.length - 1, 'template pages + index.html');
