// pitch.js — landscape US Letter pitch map, two pages:
//   page 1: goalkeeper on the LEFT  (attacking right)
//   page 2: goalkeeper on the RIGHT (attacking left)
// Each player shown as #  name  position, laid out by role.
// Positions are DERIVED from the pos codes in fixtures.json so this works for
// any formation without hand-placing anyone.

const DEPTH = {           // 0 = own goal line, 100 = opponent goal line
  GK: 8,
  RCB: 26, CB: 26, LCB: 26, SW: 20,
  RB: 24, LB: 24,
  RWB: 44, LWB: 44,
  DM: 32, CDM: 32,
  CM: 46, RM: 48, LM: 48,
  AM: 64, CAM: 64,
  RW: 70, LW: 70,
  SS: 74, CF: 80, ST: 81,
};
// width lane: 0 = top touchline, 100 = bottom touchline
const LANE = {
  GK: 50, SW: 50, CB: 50, DM: 50, CDM: 50, CM: 50, AM: 50, CAM: 50,
  SS: 50, CF: 50, ST: 50,
  // Attacking RIGHT (page 1): the player faces east, so their right hand points
  // SOUTH. Right-sided players therefore sit at the BOTTOM (high lane number),
  // left-sided at the TOP. The mirrored page inverts this automatically.
  RCB: 73, LCB: 27,
  RB: 86, LB: 14,
  RWB: 91, LWB: 9,
  RM: 82, LM: 18,
  RW: 86, LW: 14,
};

function layout(xi){
  const byPos = {};
  xi.forEach((p, i) => { (byPos[p.pos] = byPos[p.pos] || []).push({ ...p, i }); });
  const out = [];
  for (const [pos, group] of Object.entries(byPos)){
    const depth = DEPTH[pos] !== undefined ? DEPTH[pos] : 50;
    const lane  = LANE[pos]  !== undefined ? LANE[pos]  : 50;
    if (group.length === 1){
      out.push({ ...group[0], depth, lane });
    } else {
      // Two or more sharing a code (e.g. CM, CM) — spread them symmetrically.
      const spread = group.length === 2 ? 17 : 22;
      group.forEach((g, n) => {
        const offset = (n - (group.length - 1) / 2) * spread;
        out.push({ ...g, depth, lane: Math.max(6, Math.min(94, lane + offset)) });
      });
    }
  }
  return out;
}

module.exports = { layout };
