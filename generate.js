const fs = require('fs');

const fixtures = JSON.parse(fs.readFileSync('fixtures.json', 'utf8'));

// Squad database — the ONLY source for the six descriptive lineup columns.
const squad = JSON.parse(fs.readFileSync('players.json', 'utf8')).players;
const missingPlayers = new Set();
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z ]/g, '').trim();
function playerByName(name){
  const n = norm(name);
  let hit = squad.find(p => norm(p.name) === n);
  if (hit) return hit;
  // surname fallback, e.g. "Emi Martinez" vs "Emiliano Martínez"
  const last = n.split(' ').slice(-1)[0];
  const cands = squad.filter(p => norm(p.name).split(' ').slice(-1)[0] === last);
  return cands.length === 1 ? cands[0] : null;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function slug(name){
  return name.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}
function fileFor(fx){
  if (fx.slug) return `${fx.slug}.html`;          // cup ties carry an explicit slug
  const n = String(fx.gw).padStart(2,'0');
  return `gw${n}-${slug(fx.opponent)}.html`;
}
// Date-ordered list drives prev/next nav, so cup ties sit in the right place.
function ordered(){
  return [...fixtures].sort((a,b)=> a.date.localeCompare(b.date));
}
function isPL(fx){ return (fx.competition || 'Premier League') === 'Premier League'; }
function compLabel(fx){
  return isPL(fx) ? `${fx.roundLabel || 'Matchweek '+fx.gw} / 38` : `${fx.competition} &middot; ${fx.roundLabel}`;
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
  const seq = ordered();
  const i = seq.findIndex(f => fileFor(f) === fileFor(fx));
  const next = i >= 0 && i < seq.length-1 ? seq[i+1] : null;
  return `<div class="topnav">
  <a href="index.html">&larr; Season schedule</a>
  <span class="crest">${compLabel(fx)}</span>
  ${next ? `<a href="${fileFor(next)}">Next: ${next.opponent} &rarr;</a>` : `<span></span>`}
</div>`;
}

function gamePage(fx){
  const vs = fx.homeAway === 'H' ? `Chelsea<span class="v">versus</span>${fx.opponent}` : `${fx.opponent}<span class="v">versus</span>Chelsea`;
  const where = fx.homeAway === 'H' ? `${fx.venue}, ${fx.venueCity}` : `${fx.venue}, ${fx.venueCity}`;
  const haWord = fx.homeAway === 'H' ? 'home' : 'away';
  const title = `${fx.homeAway==='H' ? 'Chelsea v '+fx.opponent : fx.opponent+' v Chelsea'} — ${isPL(fx) ? fx.roundLabel : fx.competition+' '+fx.roundLabel} Briefing`;
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

  // ---- THE canonical lineup table. Seven columns, identical on every page. ----
  function xiList(xi){
    const rows = xi.map(p => {
      const rec = playerByName(p.name);
      if (!rec) missingPlayers.add(p.name);
      const r = rec || {};
      const [statVal, statLabel] = String(r.stat || '').split('|');
      const dash = '&mdash;';
      return `      <tr>
        <td class="num">${r.number || '&ndash;'}<small>${p.pos || ''}</small></td>
        <td class="who"><b>${p.name}</b><span>${r.position || p.pos || ''}</span>${r.isNew ? '<span class="new">new signing</span>' : ''}</td>
        <td data-l="Country">${r.country || dash}</td>
        <td data-l="At Chelsea">${r.atChelsea || dash}</td>
        <td data-l="Previously">${r.previously || dash}</td>
        <td data-l="Playing style">${r.style || dash}</td>
        <td data-l="Key stats">${statVal ? `${statLabel ? `<span class="stat-season">${statLabel}</span>` : ''}${statVal}` : dash}</td>
      </tr>`;
    }).join('\n');

    return `<table>
    <thead>
      <tr>
        <th scope="col">No.</th>
        <th scope="col">Player / position</th>
        <th scope="col">From</th>
        <th scope="col">At Chelsea</th>
        <th scope="col">Previously</th>
        <th scope="col">Playing style</th>
        <th scope="col">Key stats</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>`;
  }

  let lineupSection;
  if (fx.lineupStatus === 'confirmed' && fx.lineupXI && fx.lineupXI.length){
    lineupSection = `<div class="lineup-head"><span class="badge-confirmed">Confirmed</span><span style="font-family:'Roboto Mono',monospace;font-size:12px;color:var(--muted)">Official starting XI${fx.lineupConfirmedAt ? ` &middot; replaced the projection at ${fx.lineupConfirmedAt}` : ''}</span></div>
      ${xiList(fx.lineupXI)}
      ${fx.lineupNote ? `<div class="verdict">${fx.lineupNote}</div>` : ''}
      ${fx.lineupSource ? `<p class="lineup-source">Source: ${fx.lineupSource}</p>` : ''}`;
  } else if (fx.lineupStatus === 'projected' && fx.lineupXI && fx.lineupXI.length){
    lineupSection = `<div class="lineup-head"><span class="badge-projected">Projected</span><span style="font-family:'Roboto Mono',monospace;font-size:12px;color:var(--muted)">Not yet officially confirmed</span></div>
      <div class="lineup-caveat">This is a projection built from team news and press-conference hints — not the official lineup. It will be replaced automatically with the confirmed XI once the club announces it, typically 60–75 minutes before kickoff.</div>
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
  <p class="eyebrow">${isPL(fx) ? `Premier League 2026/27 &middot; ${fx.roundLabel}` : `${fx.competition} 2026/27 &middot; ${fx.roundLabel}`}</p>
  <h1 class="fixture">${vs}</h1>
  <p class="subline">${where} · <strong>${prettyDate(fx.date)}${fx.day ? ' ('+fx.day+')' : ''}</strong> · Chelsea ${haWord}</p>
  ${kickBlock}
  <p class="stamp">${fx.lastUpdated ? `Last updated ${fx.lastUpdated}` : `Not yet updated &mdash; fixture only`}</p>
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
  <b>${isPL(fx) ? `${fx.roundLabel} of 38.` : `${fx.competition} &mdash; ${fx.roundLabel}.`}</b> ${fx.lastUpdated ? `This page last updated <b>${fx.lastUpdated}</b>.` : `No updates to this page yet &mdash; nothing beyond the fixture itself has been confirmed.`} ${isPL(fx) ? `Fixture per the Premier League's official 2026/27 release; subject to change for broadcast selection or cup involvement.` : `Cup fixture; subject to change for broadcast selection.`} Updated automatically as new information is confirmed.
</footer>
` + FOOT_CLOSE;
}

// ---------------- Homepage ----------------
function homePage(){
  let rows = '';
  let lastMonthKey = '';
  const todayISO = new Date().toISOString().slice(0,10);
  for (const fx of ordered()){
    const [y,m] = fx.date.split('-').map(Number);
    const monthKey = `${MONTHS[m-1]} ${y}`;
    if (monthKey !== lastMonthKey){
      rows += `<div class="month-head">${monthKey}</div>`;
      lastMonthKey = monthKey;
    }
    const href = fx.gw === 1 ? 'gw01-fulham.html' : fileFor(fx);
    const haBadge = fx.homeAway === 'H' ? '<span class="ha h">H</span>' : '<span class="ha a">A</span>';
    const timeStr = fx.kickoffCT !== 'TBD' ? fx.kickoffCT + ' CT' : 'time TBD';
    const marker = isPL(fx) ? String(fx.gw) : '<span class="cupmark">CUP</span>';
    const compTag = isPL(fx) ? '' : ` &middot; <span class="comptag">${fx.competition}, ${fx.roundLabel}</span>`;
    rows += `<a class="gamerow${isPL(fx) ? '' : ' cup'}" href="${href}">
      <div class="gwno">${marker}</div>
      <div class="mid"><b>${haBadge}${fx.opponent}</b><span>${prettyDateShort(fx.date)}, ${y} · ${fx.venue}${compTag}</span></div>
      <div class="side">${timeStr}</div>
    </a>`;
  }

  // "Up next" = first fixture whose date is today or later.
  const next = ordered().find(f => f.date >= todayISO) || ordered()[ordered().length-1];
  const nextHref = next.gw === 1 ? 'gw01-fulham.html' : fileFor(next);
  const nextBlock = next ? `<a class="nextup" href="${nextHref}">
    <div class="tag">Up next &middot; ${isPL(next) ? next.roundLabel : next.competition+' '+next.roundLabel}</div>
    <div class="match">${next.homeAway==='H' ? 'Chelsea vs '+next.opponent : next.opponent+' vs Chelsea'}</div>
    <div class="meta">${prettyDate(next.date)} · ${next.venue}, ${next.venueCity} ${next.kickoffCT!=='TBD' ? '· '+next.kickoffCT+' CT' : ''}</div>
    <div class="cta">Open full briefing &rarr;</div>
  </a>` : '';

  return head('Chelsea 2026/27 — Full Season Briefing', 'Every Chelsea fixture for 2026/27 across the Premier League, Carabao Cup and FA Cup: kickoff times in Central time, US broadcast info, odds and projected lineups.') + `
<header class="season-hero">
  <p class="crest">Chelsea FC 2026/27</p>
  <h1>Chelsea<br>Season Briefing</h1>
  <p>Every competitive match — Premier League, Carabao Cup and FA Cup. Kickoff times in Central time, US broadcast info, odds and the projected lineup, filled in as each matchday approaches. Site last updated ${prettyDate(new Date().toISOString().slice(0,10))}; each match page shows its own last-updated date.</p>
  ${nextBlock}
</header>

<section style="margin-top:8px">
  <p class="kicker">The full schedule</p>
  <h2>${fixtures.length} fixtures</h2>
  <div class="legend"><span><span class="ha h">H</span> Home — Stamford Bridge</span><span><span class="ha a">A</span> Away</span><span><span class="cupmark">CUP</span> Cup tie</span></div>
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
if (missingPlayers.size){
  console.log('\n*** WARNING: no players.json record for: ' + [...missingPlayers].join(', '));
  console.log('*** Those rows rendered with em dashes. Add them to players.json.\n');
}
