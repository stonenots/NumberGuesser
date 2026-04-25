// ═══════════════════════════════════════════════════════════════════════════════
// NumberGuesser — script.js (clean rewrite)
// ═══════════════════════════════════════════════════════════════════════════════

const upperPrize = GAME_CONFIG.upperPrize;
const lowerPrize = GAME_CONFIG.lowerPrize;
const maxPlayers = GAME_CONFIG.maxPlayers;
const maxEntries = GAME_CONFIG.maxEntries;
const minSets    = GAME_CONFIG.minSets;
const maxSets    = GAME_CONFIG.maxSets;
const costPerSet = GAME_CONFIG.costPerSet || 1;

const PLAYER_COLORS = [
  { bg: 'rgba(233,69,96,0.18)',  border: '#e94560', text: '#e94560' },
  { bg: 'rgba(52,152,219,0.18)', border: '#3498db', text: '#3498db' },
  { bg: 'rgba(46,204,113,0.18)', border: '#2ecc71', text: '#2ecc71' },
  { bg: 'rgba(155,89,182,0.18)', border: '#9b59b6', text: '#9b59b6' },
  { bg: 'rgba(245,166,35,0.18)', border: '#f5a623', text: '#f5a623' },
  { bg: 'rgba(26,188,156,0.18)', border: '#1abc9c', text: '#1abc9c' },
  { bg: 'rgba(231,76,60,0.18)',  border: '#e74c3c', text: '#e74c3c' },
  { bg: 'rgba(52,73,94,0.35)',   border: '#7f8c8d', text: '#95a5a6' },
];
function pColor(i) { return PLAYER_COLORS[i % PLAYER_COLORS.length]; }
function allPrizes() { return [...upperPrize.prizes, ...lowerPrize.prizes]; }

// ── State ─────────────────────────────────────────────────────────────────────
let players        = [];  // { name, entries: [{ number, digits, sets, pool, swapOf? }] }
let pendingEntries = [];
let selectedDigits = 2;
let selectedPool   = 'both'; // current pool selection for single-mode input
let rawPool        = 'both'; // current pool selection for raw-mode input

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const playerNameInput = $('player-name-input');
const playerNameError = $('player-name-error');
const addPlayerBtn    = $('add-player-btn');
const playerListEl    = $('player-list');
const startGameBtn    = $('start-game-btn');
const prizeConfigBody = $('prize-config-body');
const prizeConfigErr  = $('prize-config-error');
const guessInput      = $('guess-input');
const setsInput       = $('sets-input');
const addBtn          = $('add-btn');
const clearBtn        = $('clear-btn');
const entryCountEl    = $('entry-count');
const entryMaxEl      = $('entry-max');
const inputErrorEl    = $('input-error');
const entryThead      = $('entry-thead');
const entryTbody      = $('entry-tbody');
const entryEmpty      = $('entry-empty');
const resultPanelsEl  = $('result-panels');
const leaderboardEl   = $('leaderboard');
const digitBtns       = document.querySelectorAll('.digit-btn');

// ═══════════════════════════════════════════════════════════════════════════════
// MODE SWITCHING
// ═══════════════════════════════════════════════════════════════════════════════
function showMode(mode) {
  $('right-setup').classList.toggle('hidden', mode !== 'setup');
  $('right-results').classList.toggle('hidden', mode !== 'results');
  $('prize-config-area').classList.toggle('hidden', mode !== 'setup');
  $('prize-ref-area').classList.toggle('hidden', mode === 'setup');
  $('player-setup-area').classList.toggle('hidden', mode !== 'setup');
  $('player-game-area').classList.toggle('hidden', mode === 'setup');
  $('start-area').classList.toggle('hidden', mode !== 'setup');
  $('section-leaderboard').classList.toggle('hidden', mode !== 'results');
  $('play-again-area').classList.toggle('hidden', mode !== 'results');
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRIZE CONFIG (left panel, setup mode)
// ═══════════════════════════════════════════════════════════════════════════════
function buildPrizeConfigRows() {
  prizeConfigBody.innerHTML = '';
  addRow(`<td colspan="4" class="section-divider">Upper Prize</td>`);
  addRow(`
    <td><div class="prize-name-cell"><span class="prize-badge" style="background:#FFD700;">3D</span>Winning Number</div></td>
    <td colspan="3"><input type="text" id="upper-number-input" value="${upperPrize.number}" maxlength="3" placeholder="000" class="wn-input" /></td>`);
  upperPrize.prizes.forEach((p, i) => addRow(`
    <td><div class="prize-name-cell"><span class="prize-badge" style="background:${p.color};">${p.digits}D</span>${p.name}</div></td>
    <td><small style="color:rgba(255,255,255,0.35)">${p.desc}</small></td>
    <td><input type="number" id="upper-pts-${i}" value="${p.points}" min="0" class="pts-input" /></td>
    <td>${p.digits === 3 ? `<input type="number" id="upper-swap-pts-${i}" value="${p.swapPoints || 0}" min="0" class="pts-input" />` : '<span style="color:rgba(255,255,255,0.2)">—</span>'}</td>`));
  addRow(`<td colspan="4" class="section-divider">Lower Prize</td>`);
  lowerPrize.prizes.forEach((p, i) => addRow(`
    <td><div class="prize-name-cell"><span class="prize-badge" style="background:${p.color};">${p.digits}D</span>${p.name}</div></td>
    <td><input type="text" id="lower-wn-${i}" value="${p.number}" maxlength="${p.digits}" placeholder="${'0'.repeat(p.digits)}" class="wn-input" /></td>
    <td><input type="number" id="lower-pts-${i}" value="${p.points}" min="0" class="pts-input" /></td>
    <td>${p.digits === 3 ? `<input type="number" id="lower-swap-pts-${i}" value="${p.swapPoints || 0}" min="0" class="pts-input" />` : '<span style="color:rgba(255,255,255,0.2)">—</span>'}</td>`));
  document.querySelectorAll('.wn-input').forEach(inp =>
    inp.addEventListener('input', e => { e.target.value = e.target.value.replace(/[^\d]/g, ''); }));
  function addRow(html) { const tr = document.createElement('tr'); tr.innerHTML = html; prizeConfigBody.appendChild(tr); }
}

function applyPrizeConfig() {
  prizeConfigErr.textContent = '';
  const upNum = $('upper-number-input').value.trim();
  if (!/^\d{3}$/.test(upNum)) { prizeConfigErr.textContent = 'Upper: must be 3 digits.'; return false; }
  upperPrize.number = upNum;
  for (let i = 0; i < upperPrize.prizes.length; i++) {
    const v = parseInt($(`upper-pts-${i}`).value);
    if (isNaN(v) || v < 0) { prizeConfigErr.textContent = `${upperPrize.prizes[i].name}: invalid pts.`; return false; }
    upperPrize.prizes[i].points = v;
    if (upperPrize.prizes[i].digits === 3) {
      const sv = parseInt($(`upper-swap-pts-${i}`).value);
      if (isNaN(sv) || sv < 0) { prizeConfigErr.textContent = `${upperPrize.prizes[i].name}: invalid swap pts.`; return false; }
      upperPrize.prizes[i].swapPoints = sv;
    }
  }
  for (let i = 0; i < lowerPrize.prizes.length; i++) {
    const p = lowerPrize.prizes[i];
    const wn = $(`lower-wn-${i}`).value.trim();
    const v  = parseInt($(`lower-pts-${i}`).value);
    if (wn.length !== p.digits || !/^\d+$/.test(wn)) { prizeConfigErr.textContent = `${p.name}: must be ${p.digits} digits.`; return false; }
    if (isNaN(v) || v < 0) { prizeConfigErr.textContent = `${p.name}: invalid pts.`; return false; }
    p.number = wn; p.points = v;
    if (p.digits === 3) {
      const sv = parseInt($(`lower-swap-pts-${i}`).value);
      if (isNaN(sv) || sv < 0) { prizeConfigErr.textContent = `${p.name}: invalid swap pts.`; return false; }
      p.swapPoints = sv;
    }
  }
  return true;
}

function buildPrizeTableHTML() {
  const uRows = upperPrize.prizes.map(p => `<tr>
    <td style="text-align:left"><span class="prize-badge" style="background:${p.color};">${p.digits}D</span>${p.name}</td>
    <td><span class="winning-num">${p.id === 'upper3' ? upperPrize.number : upperPrize.number.slice(-2)}</span></td>
    <td style="text-align:center">${p.digits}</td>
    <td class="pts-cell" style="text-align:right">${p.points.toLocaleString()}</td>
    <td class="pts-cell" style="text-align:right">${p.digits === 3 ? (p.swapPoints || 0).toLocaleString() : '—'}</td>
  </tr>`).join('');
  const lRows = lowerPrize.prizes.map(p => `<tr>
    <td style="text-align:left"><span class="prize-badge" style="background:${p.color};">${p.digits}D</span>${p.name}</td>
    <td><span class="winning-num">${p.number}</span></td>
    <td style="text-align:center">${p.digits}</td>
    <td class="pts-cell" style="text-align:right">${p.points.toLocaleString()}</td>
    <td class="pts-cell" style="text-align:right">${p.digits === 3 ? (p.swapPoints || 0).toLocaleString() : '—'}</td>
  </tr>`).join('');
  return `<table>
    <thead><tr><th style="text-align:left">Prize</th><th>Win #</th><th>Digits</th><th style="text-align:right">Pts/Set</th><th style="text-align:right">Swap Pts</th></tr></thead>
    <tbody>
      <tr><td colspan="5" class="section-divider">Upper Prize</td></tr>${uRows}
      <tr><td colspan="5" class="section-divider">Lower Prize</td></tr>${lRows}
    </tbody></table>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER LIST (left panel chips)
// ═══════════════════════════════════════════════════════════════════════════════
function renderPlayerList() {
  playerListEl.innerHTML = '';
  if (players.length === 0) {
    playerListEl.innerHTML = '<span class="player-list-empty">No players yet</span>';
  } else {
    players.forEach((p, i) => {
      const c = pColor(i);
      const chip = document.createElement('div');
      chip.className = 'player-chip';
      chip.style.cssText = `background:${c.bg};border-color:${c.border};color:${c.text};cursor:pointer;`;
      chip.innerHTML = `<span class="chip-name">${p.name}</span>
        <span class="chip-count">${p.entries.length} # · ${p.entries.reduce((s,e)=>s+e.sets,0)} sets</span>
        <button class="chip-remove" data-index="${i}">×</button>`;
      // Click chip name to edit
      chip.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip-remove')) return;
        openPlayerModal(i);
      });
      playerListEl.appendChild(chip);
    });
    playerListEl.querySelectorAll('.chip-remove').forEach(btn =>
      btn.addEventListener('click', (e) => { e.stopPropagation(); players.splice(+btn.dataset.index, 1); renderPlayerList(); refreshSetupStats(); }));
  }
  startGameBtn.disabled = players.length === 0;
  const badge = $('player-count-badge');
  if (players.length > 0) { badge.textContent = players.length; badge.classList.remove('hidden'); }
  else { badge.classList.add('hidden'); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PENDING ENTRIES (right panel — numbers for the player being added)
// ═══════════════════════════════════════════════════════════════════════════════
entryMaxEl.textContent = maxEntries;

function resetForm() {
  pendingEntries = [];
  playerNameInput.value = '';
  guessInput.value = '';
  setsInput.value = 1;
  inputErrorEl.textContent = '';
  playerNameError.textContent = '';
  selectedDigits = 2;
  selectedPool = 'both';
  rawPool = 'both';
  guessInput.maxLength = 2;
  guessInput.placeholder = 'XX';
  digitBtns.forEach(b => b.classList.toggle('active', b.dataset.digits === '2'));
  document.querySelectorAll('#prize-pool-selector .pool-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.pool === 'both'));
  document.querySelectorAll('#raw-pool-selector .pool-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.pool === 'both'));
  renderPending();
  playerNameInput.focus();
}

function renderPending() {
  entryCountEl.textContent = pendingEntries.length;
  addPlayerBtn.disabled = pendingEntries.length === 0 || players.length >= maxPlayers;
  if (pendingEntries.length === 0) {
    entryEmpty.style.display = 'block';
    entryThead.innerHTML = '';
    entryTbody.innerHTML = '';
    return;
  }
  entryEmpty.style.display = 'none';
  entryThead.innerHTML = `<tr><th style="text-align:left">Number</th><th style="text-align:center">Sets</th><th style="text-align:center">Pool</th><th style="text-align:right"></th></tr>`;
  entryTbody.innerHTML = '';
  pendingEntries.forEach((e, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="num-cell">${e.number}${e.swapOf ? ' <span class="swap-tag">swap</span>' : ''}</td>
      <td class="sets-cell">×${e.sets}</td>
      <td style="text-align:center"><span class="pool-badge pool-${e.pool || 'both'}">${(e.pool || 'both').toUpperCase()}</span></td>
      <td style="text-align:right"><button class="remove-btn" data-index="${i}">×</button></td>`;
    entryTbody.appendChild(tr);
  });
  entryTbody.querySelectorAll('.remove-btn').forEach(btn =>
    btn.addEventListener('click', () => { pendingEntries.splice(+btn.dataset.index, 1); renderPending(); }));
}

function addPendingEntry() {
  const val = guessInput.value.trim(), sets = parseInt(setsInput.value);
  const doSwap = $('swap-check').checked;
  inputErrorEl.textContent = '';
  if (!/^\d+$/.test(val) || val.length !== selectedDigits) { inputErrorEl.textContent = `Enter exactly ${selectedDigits} digits.`; return; }
  if (isNaN(sets) || sets < minSets || sets > maxSets) { inputErrorEl.textContent = `Sets: ${minSets}–${maxSets}.`; return; }

  if (doSwap) {
    const perms = allPermutations(val);
    let added = 0;
    perms.forEach(p => {
      if (pendingEntries.length >= maxEntries) return;
      pendingEntries.push({ number: p, digits: selectedDigits, sets, pool: selectedPool, swapOf: p !== val ? val : undefined });
      added++;
    });
    if (added === 0) { inputErrorEl.textContent = `Max ${maxEntries}.`; return; }
  } else {
    if (pendingEntries.length >= maxEntries) { inputErrorEl.textContent = `Max ${maxEntries}.`; return; }
    pendingEntries.push({ number: val, digits: selectedDigits, sets, pool: selectedPool });
  }

  guessInput.value = ''; setsInput.value = 1; guessInput.focus();
  renderPending();
}

function addPlayerWithEntries() {
  const name = playerNameInput.value.trim();
  playerNameError.textContent = '';
  if (!name) { playerNameError.textContent = 'Enter a name.'; return; }
  if (players.find(p => p.name.toLowerCase() === name.toLowerCase())) { playerNameError.textContent = 'Already added.'; return; }
  if (players.length >= maxPlayers) { playerNameError.textContent = `Max ${maxPlayers}.`; return; }
  if (pendingEntries.length === 0) { playerNameError.textContent = 'Add numbers first.'; return; }
  players.push({ name, entries: [...pendingEntries] });
  renderPlayerList();
  resetForm();
  refreshSetupStats();
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAW TEXT PARSER
// ═══════════════════════════════════════════════════════════════════════════════
function swapNumber(n) { return n.split('').reverse().join(''); }

// Generate all unique permutations of a number string
function allPermutations(num) {
  const chars = num.split('');
  if (chars.length === 2) {
    const perms = new Set([num, chars[1] + chars[0]]);
    return [...perms];
  }
  // 3-digit: generate all 6 permutations, deduplicate
  const perms = new Set();
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++)
        if (i !== j && j !== k && i !== k)
          perms.add(chars[i] + chars[j] + chars[k]);
  return [...perms];
}

function parseRawText(text) {
  const lines = text.split('\n'), parsed = [], errors = [];
  lines.forEach((raw, li) => {
    const line = raw.trim(); if (!line) return;
    // Normalize: collapse spaces around = * x ×, then replace = with space
    const normalized = line
      .replace(/\s*=\s*/g, '=')
      .replace(/\s*[*×]\s*/g, '*')
      .replace(/\s*[xX]\s*/g, 'x')
      .replace(/=/g, ' ');
    const tok = normalized.split(/\s+/);
    if (tok.length < 2) { errors.push(`Line ${li+1}: need NUMBER SETS`); return; }
    const num = tok[0], setExpr = tok[1];
    if (!/^\d{2,3}$/.test(num)) { errors.push(`Line ${li+1}: "${num}" invalid`); return; }
    const digits = num.length;
    // Support both x and * as swap separator
    const sm = setExpr.match(/^(\d+)[x*](\d+)$/i), pm = setExpr.match(/^(\d+)$/);
    if (sm) {
      const s1 = +sm[1], s2 = +sm[2];
      if (s1 < minSets || s1 > maxSets || s2 < minSets || s2 > maxSets) { errors.push(`Line ${li+1}: sets out of range`); return; }
      // First entry gets s1, all swap permutations get s2
      const perms = allPermutations(num);
      parsed.push({ number: num, digits, sets: s1 });
      perms.forEach(p => {
        if (p !== num) parsed.push({ number: p, digits, sets: s2, swapOf: num });
      });
    } else if (pm) {
      const s = +pm[1];
      if (s < minSets || s > maxSets) { errors.push(`Line ${li+1}: sets out of range`); return; }
      parsed.push({ number: num, digits, sets: s });
    } else { errors.push(`Line ${li+1}: "${setExpr}" invalid`); }
  });
  return { parsed, errors };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRIZE LOGIC
// ═══════════════════════════════════════════════════════════════════════════════
function evaluateEntry(entry, pool) {
  pool = pool || entry.pool || 'both';
  const isSwap = !!entry.swapOf;
  const results = [];
  // Upper prizes — only if pool is 'upper' or 'both'
  upperPrize.prizes.forEach(p => {
    if (pool === 'lower') { results.push({ prize: p, hit: false, pts: 0 }); return; }
    let hit = false;
    if (p.id === 'upper3' && entry.digits === 3) hit = entry.number === upperPrize.number;
    else if (p.id === 'upper2' && entry.digits === 2) hit = entry.number === upperPrize.number.slice(-2);
    const ptsPerSet = (hit && isSwap && p.digits === 3 && p.swapPoints != null) ? p.swapPoints : p.points;
    results.push({ prize: p, hit, pts: hit ? ptsPerSet * entry.sets : 0 });
  });
  // Lower prizes — only if pool is 'lower' or 'both'
  lowerPrize.prizes.forEach(p => {
    if (pool === 'upper') { results.push({ prize: p, hit: false, pts: 0 }); return; }
    const hit = entry.digits === p.digits && entry.number === p.number;
    const ptsPerSet = (hit && isSwap && p.digits === 3 && p.swapPoints != null) ? p.swapPoints : p.points;
    results.push({ prize: p, hit, pts: hit ? ptsPerSet * entry.sets : 0 });
  });
  return results;
}

function calcPlayerTotal(player) {
  return player.entries.reduce((sum, e) => sum + evaluateEntry(e).reduce((s, r) => s + r.pts, 0), 0);
}

function calcPlayerSets(player) {
  return player.entries.reduce((sum, e) => sum + e.sets, 0);
}

function calcPlayerCost(player) {
  return calcPlayerSets(player) * costPerSet;
}

function calcPlayerNet(player) {
  return calcPlayerTotal(player) - calcPlayerCost(player);
}

// ═══════════════════════════════════════════════════════════════════════════════
// NUMBER STATS TABLE
// ═══════════════════════════════════════════════════════════════════════════════
function buildNumberStats(targetId) {
  const el = $(targetId || 'number-stats');
  if (!el) return;

  // Collect winning numbers for highlight
  const winSet = new Set();
  upperPrize.prizes.forEach(p => {
    if (p.id === 'upper3') winSet.add(upperPrize.number);
    if (p.id === 'upper2') winSet.add(upperPrize.number.slice(-2));
  });
  lowerPrize.prizes.forEach(p => winSet.add(p.number));

  // Aggregate: number → { totalSets, players: [{name, sets, colorIdx}] }
  const map = {};
  players.forEach((player, pi) => {
    player.entries.forEach(e => {
      if (!map[e.number]) map[e.number] = { number: e.number, digits: e.digits, totalSets: 0, playerCount: 0, players: [] };
      map[e.number].totalSets += e.sets;
      // Check if this player already has an entry for this number
      const existing = map[e.number].players.find(p => p.name === player.name);
      if (existing) {
        existing.sets += e.sets;
      } else {
        map[e.number].players.push({ name: player.name, sets: e.sets, ci: pi });
        map[e.number].playerCount++;
      }
    });
  });

  const entries = Object.values(map).sort((a, b) => b.totalSets - a.totalSets);

  if (entries.length === 0) {
    el.innerHTML = '';
    return;
  }

  const totalSets = entries.reduce((s, e) => s + e.totalSets, 0);
  const totalCost = totalSets * costPerSet;

  const rows = entries.map(e => {
    const isWin = winSet.has(e.number);
    const c = pColor(0); // default
    const playerCells = e.players.map(p => {
      const pc = pColor(p.ci);
      return `<span style="color:${pc.text};margin-right:6px;">${p.name}: <strong>${p.sets}</strong></span>`;
    }).join('');

    return `<tr class="${isWin ? 'stat-row-win' : ''}">
      <td class="num-cell">${e.number}</td>
      <td class="sets-cell">×${e.totalSets}</td>
      <td style="text-align:center">${e.playerCount}</td>
      <td class="stat-players-cell">${playerCells}</td>
      <td style="text-align:center">${isWin ? '<span class="stat-winner-badge">★ WIN</span>' : '—'}</td>
    </tr>`;
  }).join('');

  el.innerHTML = `
    <div class="stats-title">Number Summary — ${entries.length} unique · ${totalSets} total sets · cost: ${totalCost.toLocaleString()}</div>
    <div class="stats-table-wrap">
      <table class="stats-table">
        <thead><tr>
          <th style="text-align:left">Number</th>
          <th style="text-align:center">Total Sets</th>
          <th style="text-align:center">Players</th>
          <th style="text-align:left">Detail</th>
          <th style="text-align:center">Winner</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// Refresh stats in setup mode
function refreshSetupStats() {
  buildNumberStats('number-stats');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function buildResultsScreen() {
  resultPanelsEl.innerHTML = '';
  const uH = upperPrize.prizes.map(p => `<th style="text-align:center;color:${p.color};">${p.name}</th>`).join('');
  const lH = lowerPrize.prizes.map(p => `<th style="text-align:center;color:${p.color};">${p.name}</th>`).join('');

  const scores = players.map((player, pi) => {
    const c = pColor(pi);
    const block = document.createElement('div');
    block.className = 'result-player-block';
    block.style.borderColor = c.border;
    let total = 0, tableHTML = '';

    if (player.entries.length === 0) {
      tableHTML = '<p class="no-entries">No numbers entered.</p>';
    } else {
      let rows = '';
      player.entries.forEach(e => {
        const res = evaluateEntry(e);
        const rt  = res.reduce((s, r) => s + r.pts, 0);
        total += rt;
        const cells = res.map(r => r.hit
          ? `<td class="match-cell hit">✓ +${r.pts.toLocaleString()}</td>`
          : `<td class="match-cell miss">✗</td>`).join('');
        rows += `<tr class="${rt > 0 ? 'row-won' : 'row-lost'}">
          <td class="num-cell">${e.number}${e.swapOf ? ' <span class="swap-tag">swap</span>' : ''}</td>
          <td class="sets-cell" style="text-align:center">×${e.sets}</td>
          <td style="text-align:center"><span class="pool-badge pool-${e.pool || 'both'}">${(e.pool || 'both').toUpperCase()}</span></td>
          ${cells}
          <td class="total-cell ${rt === 0 ? 'zero' : ''}">${rt > 0 ? '+' + rt.toLocaleString() : '—'}</td>
        </tr>`;
      });
      tableHTML = `<div class="result-table-wrap"><table class="result-table">
        <thead><tr>
          <th rowspan="2" style="text-align:left">Number</th>
          <th rowspan="2" style="text-align:center">Sets</th>
          <th rowspan="2" style="text-align:center">Pool</th>
          <th colspan="${upperPrize.prizes.length}" class="group-header upper-group">Upper</th>
          <th colspan="${lowerPrize.prizes.length}" class="group-header lower-group">Lower</th>
          <th rowspan="2" style="text-align:right">Total</th>
        </tr><tr>${uH}${lH}</tr></thead>
        <tbody>${rows}</tbody></table></div>`;
    }

    const totalSets = player.entries.reduce((s, e) => s + e.sets, 0);
    const cost = totalSets * costPerSet;
    const net  = total - cost;

    block.innerHTML = `
      <div class="result-player-header" style="background:${c.bg};border-bottom:1px solid ${c.border}20;" data-player="${pi}">
        <div class="result-player-name" style="color:${c.text};">
          <span class="result-player-dot" style="background:${c.border};"></span>${player.name}
          <span class="edit-hint">✎ click to edit</span>
        </div>
        <div class="result-player-total" style="color:${c.text};">${net >= 0 ? '+' : ''}${net.toLocaleString()}</div>
      </div>
      <div class="result-player-body">
        ${tableHTML}
        <div class="result-summary-row">
          <div class="summary-item"><span class="summary-label">Sets</span><span class="summary-value">${totalSets.toLocaleString()}</span></div>
          <div class="summary-item"><span class="summary-label">Cost</span><span class="summary-value cost">−${cost.toLocaleString()}</span></div>
          <div class="summary-item"><span class="summary-label">Winnings</span><span class="summary-value win">+${total.toLocaleString()}</span></div>
          <div class="summary-item"><span class="summary-label">Net</span><span class="summary-value ${net >= 0 ? 'profit' : 'loss'}">${net >= 0 ? '+' : ''}${net.toLocaleString()}</span></div>
        </div>
      </div>`;
    resultPanelsEl.appendChild(block);
    return { name: player.name, score: total, net, totalSets, cost, color: c };
  });

  // Leaderboard (sorted by net)
  const sorted = [...scores].sort((a, b) => b.net - a.net);
  const rc = ['gold', 'silver', 'bronze'];
  leaderboardEl.innerHTML = `<div class="leaderboard-title">Rankings</div>
    ${sorted.map((p, i) => `<div class="lb-row" style="border-left:3px solid ${p.color.border};">
      <div class="lb-rank ${rc[i] || ''}">${i + 1}</div>
      <div class="lb-name">${p.name}</div>
      <div class="lb-detail">${p.totalSets} sets · −${p.cost.toLocaleString()} cost · +${p.score.toLocaleString()} win</div>
      <div class="lb-score ${p.net >= 0 ? '' : 'lb-loss'}" style="color:${p.net >= 0 ? p.color.text : '#e74c3c'};">${p.net >= 0 ? '+' : ''}${p.net.toLocaleString()}</div>
    </div>`).join('')}`;

  // Bind click-to-edit on player headers
  resultPanelsEl.querySelectorAll('.result-player-header[data-player]').forEach(hdr => {
    hdr.addEventListener('click', () => openPlayerModal(+hdr.dataset.player));
  });

  // Build number stats
  buildNumberStats('number-stats-results');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function exportResults() {
  const ts = new Date().toLocaleString();
  const sortedPlayers = [...players].map((p, pi) => {
    const total = calcPlayerTotal(p);
    const totalSets = calcPlayerSets(p);
    const cost = calcPlayerCost(p);
    const net = total - cost;
    return { ...p, total, totalSets, cost, net, ci: pi };
  }).sort((a, b) => b.net - a.net);
  const rc = ['gold', 'silver', 'bronze'];

  const winRows = upperPrize.prizes.map(p => `<tr><td>Upper</td><td><span class="badge" style="background:${p.color}">${p.digits}D</span>${p.name}</td><td class="mono">${p.id==='upper3'?upperPrize.number:upperPrize.number.slice(-2)}</td><td class="pts">${p.points.toLocaleString()}</td><td class="pts">${p.digits===3?(p.swapPoints||0).toLocaleString():'—'}</td></tr>`).join('')
    + lowerPrize.prizes.map(p => `<tr><td>Lower</td><td><span class="badge" style="background:${p.color}">${p.digits}D</span>${p.name}</td><td class="mono">${p.number}</td><td class="pts">${p.points.toLocaleString()}</td><td class="pts">${p.digits===3?(p.swapPoints||0).toLocaleString():'—'}</td></tr>`).join('');

  const uH = upperPrize.prizes.map(p => `<th style="color:${p.color}">${p.name}</th>`).join('');
  const lH = lowerPrize.prizes.map(p => `<th style="color:${p.color}">${p.name}</th>`).join('');

  const playerSections = players.map((player, pi) => {
    const total = calcPlayerTotal(player);
    const totalSets = calcPlayerSets(player);
    const cost = calcPlayerCost(player);
    const net = total - cost;
    const c = pColor(pi);

    if (!player.entries.length) return `<section class="player-section" style="border-left:4px solid ${c.border}"><h2 style="color:${c.text}">${esc(player.name)}</h2><p class="empty">No numbers.</p></section>`;

    const rows = player.entries.map(e => {
      const res = evaluateEntry(e), rt = res.reduce((s,r)=>s+r.pts,0);
      const poolLabel = (e.pool || 'both').toUpperCase();
      const cells = res.map(r => r.hit ? `<td class="hit">✓ +${r.pts.toLocaleString()}</td>` : `<td class="miss">✗</td>`).join('');
      return `<tr class="${rt>0?'won':'lost'}">
        <td class="mono">${esc(e.number)}${e.swapOf?' <em>swap</em>':''}</td>
        <td class="center">×${e.sets}</td>
        <td class="center"><span class="pool-tag pool-${e.pool||'both'}">${poolLabel}</span></td>
        ${cells}
        <td class="right ${rt===0?'zero':'total-pts'}">${rt>0?'+'+rt.toLocaleString():'—'}</td>
      </tr>`;
    }).join('');

    return `<section class="player-section" style="border-left:4px solid ${c.border}">
      <h2 style="color:${c.text}">${esc(player.name)}</h2>
      <div class="table-wrap"><table>
        <thead><tr>
          <th rowspan="2">Number</th><th rowspan="2">Sets</th><th rowspan="2">Pool</th>
          <th colspan="${upperPrize.prizes.length}" class="grp-up">Upper</th>
          <th colspan="${lowerPrize.prizes.length}" class="grp-lo">Lower</th>
          <th rowspan="2" class="right">Total</th>
        </tr><tr>${uH}${lH}</tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <div class="summary-bar">
        <div class="sum-item"><span class="sum-label">Sets</span><span>${totalSets.toLocaleString()}</span></div>
        <div class="sum-item"><span class="sum-label">Cost</span><span class="cost">−${cost.toLocaleString()}</span></div>
        <div class="sum-item"><span class="sum-label">Winnings</span><span class="win">+${total.toLocaleString()}</span></div>
        <div class="sum-item"><span class="sum-label">Net</span><span class="${net>=0?'profit':'loss'}">${net>=0?'+':''}${net.toLocaleString()}</span></div>
      </div>
    </section>`;
  }).join('');

  const lbRows = sortedPlayers.map((p,i) => `<tr>
    <td><span class="rank ${rc[i]||''}">${i+1}</span></td>
    <td>${esc(p.name)}</td>
    <td class="center">${p.totalSets.toLocaleString()}</td>
    <td class="cost">−${p.cost.toLocaleString()}</td>
    <td class="win">+${p.total.toLocaleString()}</td>
    <td class="${p.net>=0?'profit':'loss'}" style="font-weight:700">${p.net>=0?'+':''}${p.net.toLocaleString()}</td>
  </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>NumberGuesser Results</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);font-family:'Segoe UI',sans-serif;color:#fff;padding:30px 16px;min-height:100vh}
.page{max-width:1000px;margin:0 auto}
h1{font-size:2rem;font-weight:700;margin-bottom:4px;background:linear-gradient(90deg,#e94560,#f5a623);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.meta{color:rgba(255,255,255,.4);font-size:.82rem;margin-bottom:28px}
.section-title{font-size:.7rem;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.35);font-weight:600;margin:24px 0 10px}
.prize-ref{background:rgba(255,255,255,.04);border-radius:12px;overflow:hidden;margin-bottom:24px}
.prize-ref table,.leaderboard table,table{width:100%;border-collapse:collapse;font-size:.8rem}
th{padding:8px 10px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.4);font-size:.7rem;text-transform:uppercase;letter-spacing:.5px}
td{padding:8px 10px;border-top:1px solid rgba(255,255,255,.05);color:rgba(255,255,255,.8)}
.badge{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:5px;font-size:.6rem;font-weight:700;color:#000;margin-right:6px;vertical-align:middle}
.mono{font-weight:700;letter-spacing:3px}.pts{color:#f5a623;font-weight:700}
.grp-up{background:rgba(255,215,0,.1);color:#FFD700!important}
.grp-lo{background:rgba(192,192,192,.08);color:#C0C0C0!important}
.player-section{background:rgba(255,255,255,.04);border-radius:14px;padding:20px;margin-bottom:20px}
.player-section h2{font-size:1.1rem;font-weight:700;margin-bottom:14px}
.empty{color:rgba(255,255,255,.3);font-size:.85rem}
.table-wrap{overflow-x:auto;border-radius:10px;margin-bottom:12px}
tr.won td{background:rgba(46,204,113,.07)}tr.lost td{opacity:.35}
.hit{color:#2ecc71;font-weight:700;text-align:center}.miss{color:rgba(255,255,255,.15);text-align:center}
.center{text-align:center}.right{text-align:right}
.total-pts{color:#2ecc71;font-weight:700}.zero{color:rgba(255,255,255,.2)}
.cost{color:#e74c3c;font-weight:600}.win{color:#2ecc71;font-weight:600}
.profit{color:#2ecc71;font-weight:700}.loss{color:#e74c3c;font-weight:700}
.pool-tag{display:inline-block;font-size:.6rem;font-weight:700;border-radius:3px;padding:1px 5px;text-transform:uppercase}
.pool-both{background:rgba(245,166,35,.15);color:#f5a623}
.pool-upper{background:rgba(255,215,0,.2);color:#FFD700}
.pool-lower{background:rgba(192,192,192,.15);color:#C0C0C0}
.summary-bar{display:flex;flex-wrap:wrap;gap:16px;background:rgba(255,255,255,.04);border-radius:10px;padding:12px 16px;margin-top:8px}
.sum-item{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:60px}
.sum-label{font-size:.6rem;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.35)}
.sum-item span:last-child{font-size:.95rem;font-weight:700;color:rgba(255,255,255,.7)}
.sum-item .cost{color:#e74c3c}.sum-item .win{color:#2ecc71}.sum-item .profit{color:#2ecc71}.sum-item .loss{color:#e74c3c}
.leaderboard{background:rgba(255,255,255,.04);border-radius:14px;overflow:hidden;margin-bottom:28px}
.lb-head{padding:10px 16px;background:rgba(255,255,255,.07);font-size:.7rem;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.4);font-weight:600}
.rank{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;font-size:.75rem;font-weight:700;background:rgba(255,255,255,.08);color:rgba(255,255,255,.5)}
.rank.gold{background:#FFD700;color:#000}.rank.silver{background:#C0C0C0;color:#000}.rank.bronze{background:#CD7F32;color:#000}
@media print{body{background:#fff;color:#000;padding:10px}h1{-webkit-text-fill-color:#e94560}.player-section,.prize-ref,.leaderboard{border:1px solid #ddd}.cost{color:#c0392b}.win,.profit{color:#27ae60}.loss{color:#c0392b}}
</style></head>
<body><div class="page">
<h1>NumberGuesser — Results</h1>
<p class="meta">Generated: ${ts} · ${players.length} player${players.length!==1?'s':''} · Cost/set: ${costPerSet}</p>
<p class="section-title">Winning Numbers</p>
<div class="prize-ref"><table><thead><tr><th>Session</th><th>Prize</th><th>Win #</th><th>Pts/Set</th></tr></thead><tbody>${winRows}</tbody></table></div>
<p class="section-title">Leaderboard</p>
<div class="leaderboard"><div class="lb-head">Rankings (sorted by net)</div><table>
  <thead><tr><th>#</th><th>Player</th><th>Sets</th><th>Cost</th><th>Winnings</th><th>Net</th></tr></thead>
  <tbody>${lbRows}</tbody>
</table></div>
<p class="section-title">Player Details</p>${playerSections}
</div></body></html>`;
  window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════════

// Single entry
addBtn.addEventListener('click', addPendingEntry);
guessInput.addEventListener('keydown', e => { if (e.key === 'Enter') addPendingEntry(); });
guessInput.addEventListener('input', e => { e.target.value = e.target.value.replace(/[^\d]/g, ''); });
setsInput.addEventListener('keydown', e => { if (e.key === 'Enter') addPendingEntry(); });
clearBtn.addEventListener('click', () => { pendingEntries = []; renderPending(); });

// Digit selector
digitBtns.forEach(btn => btn.addEventListener('click', () => {
  selectedDigits = +btn.dataset.digits;
  digitBtns.forEach(b => b.classList.toggle('active', b === btn));
  guessInput.maxLength = selectedDigits;
  guessInput.placeholder = selectedDigits === 2 ? 'XX' : 'XXX';
  guessInput.value = '';
  guessInput.focus();
}));

// Prize pool selector (single mode)
document.querySelectorAll('#prize-pool-selector .pool-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    selectedPool = btn.dataset.pool;
    document.querySelectorAll('#prize-pool-selector .pool-btn').forEach(b =>
      b.classList.toggle('active', b === btn));
  }));

// Prize pool selector (raw mode)
document.querySelectorAll('#raw-pool-selector .pool-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    rawPool = btn.dataset.pool;
    document.querySelectorAll('#raw-pool-selector .pool-btn').forEach(b =>
      b.classList.toggle('active', b === btn));
  }));

// Mode toggle
$('mode-single').addEventListener('click', () => {
  $('mode-single').classList.add('active'); $('mode-raw').classList.remove('active');
  $('input-single').classList.remove('hidden'); $('input-raw').classList.add('hidden');
});
$('mode-raw').addEventListener('click', () => {
  $('mode-raw').classList.add('active'); $('mode-single').classList.remove('active');
  $('input-raw').classList.remove('hidden'); $('input-single').classList.add('hidden');
});

// Raw text add
$('raw-add-btn').addEventListener('click', () => {
  inputErrorEl.textContent = ''; inputErrorEl.style.color = '';
  const text = $('raw-input').value;
  if (!text.trim()) { inputErrorEl.textContent = 'Paste or type numbers above.'; return; }
  const { parsed, errors } = parseRawText(text);
  if (!parsed.length && errors.length) { inputErrorEl.style.color = '#e74c3c'; inputErrorEl.textContent = errors[0]; return; }
  let added = 0, limitHit = false;
  for (const item of parsed) {
    if (pendingEntries.length >= maxEntries) { limitHit = true; break; }
    item.pool = rawPool;
    pendingEntries.push(item); added++;
  }
  if (added) { $('raw-input').value = ''; renderPending(); }
  let msg = `Added ${added} entr${added !== 1 ? 'ies' : 'y'}.`;
  if (errors.length) msg += ` ${errors.length} skipped.`;
  if (limitHit) msg += ' Limit reached.';
  inputErrorEl.style.color = added ? '#2ecc71' : '#e74c3c';
  inputErrorEl.textContent = msg;
  setTimeout(() => { inputErrorEl.textContent = ''; inputErrorEl.style.color = ''; }, 3500);
});

// Add player
addPlayerBtn.addEventListener('click', addPlayerWithEntries);
playerNameInput.addEventListener('keydown', e => { if (e.key === 'Enter' && pendingEntries.length) addPlayerWithEntries(); });

// Check results
startGameBtn.addEventListener('click', () => {
  if (!applyPrizeConfig()) return;
  if (!players.length) return;
  $('prize-table-entry').innerHTML = buildPrizeTableHTML();
  buildResultsScreen();
  showMode('results');
});

// Play again
$('play-again-btn').addEventListener('click', () => {
  players = []; pendingEntries = [];
  buildPrizeConfigRows(); renderPlayerList(); resetForm();
  // Clear stats and results
  $('number-stats').innerHTML = '';
  $('number-stats-results').innerHTML = '';
  $('result-panels').innerHTML = '';
  $('leaderboard').innerHTML = '';
  showMode('setup');
});

// Export
$('export-btn-results').addEventListener('click', exportResults);

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER EDIT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
let modalPlayerIndex = -1;
let modalEntries = [];
let modalDigits = 2;
let modalPool = 'both';
let modalRawPool = 'both';

const modal           = $('player-modal');
const modalTitle      = $('modal-title');
const modalNameInput  = $('modal-name-input');
const modalNameError  = $('modal-name-error');
const modalGuessInput = $('modal-guess-input');
const modalSetsInput  = $('modal-sets-input');
const modalAddBtn     = $('modal-add-btn');
const modalClearBtn   = $('modal-clear-btn');
const modalEntryCount = $('modal-entry-count');
const modalEntryThead = $('modal-entry-thead');
const modalEntryTbody = $('modal-entry-tbody');
const modalEntryEmpty = $('modal-entry-empty');
const modalInputError = $('modal-input-error');
const modalDigitBtns  = document.querySelectorAll('.modal-digit-btn');

function openPlayerModal(playerIndex) {
  modalPlayerIndex = playerIndex;
  const player = players[playerIndex];
  const c = pColor(playerIndex);
  modalTitle.textContent = `Edit: ${player.name}`;
  modalTitle.style.color = c.text;
  modalNameInput.value = player.name;
  modalNameError.textContent = '';
  modalInputError.textContent = '';
  modalEntries = player.entries.map(e => ({ ...e }));
  modalPool = 'both';
  modalRawPool = 'both';
  modalDigits = 2;
  modalGuessInput.value = '';
  modalSetsInput.value = 1;
  modalGuessInput.maxLength = 2;
  modalGuessInput.placeholder = 'XX';
  modalDigitBtns.forEach(b => b.classList.toggle('active', b.dataset.digits === '2'));
  document.querySelectorAll('#modal-pool-selector .pool-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.pool === 'both'));
  document.querySelectorAll('#modal-raw-pool-selector .pool-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.pool === 'both'));
  $('modal-mode-single').classList.add('active');
  $('modal-mode-raw').classList.remove('active');
  $('modal-input-single').classList.remove('hidden');
  $('modal-input-raw').classList.add('hidden');
  renderModalEntries();
  modal.classList.remove('hidden');
}

function closeModal() { modal.classList.add('hidden'); }

function renderModalEntries() {
  modalEntryCount.textContent = modalEntries.length;
  if (modalEntries.length === 0) {
    modalEntryEmpty.style.display = 'block';
    modalEntryThead.innerHTML = '';
    modalEntryTbody.innerHTML = '';
    return;
  }
  modalEntryEmpty.style.display = 'none';
  modalEntryThead.innerHTML = `<tr><th style="text-align:left">Number</th><th style="text-align:center">Sets</th><th style="text-align:center">Pool</th><th style="text-align:right"></th></tr>`;
  modalEntryTbody.innerHTML = '';
  modalEntries.forEach((e, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="num-cell">${e.number}${e.swapOf ? ' <span class="swap-tag">swap</span>' : ''}</td>
      <td class="sets-cell">×${e.sets}</td>
      <td style="text-align:center"><span class="pool-badge pool-${e.pool || 'both'}">${(e.pool || 'both').toUpperCase()}</span></td>
      <td style="text-align:right"><button class="remove-btn" data-index="${i}">×</button></td>`;
    modalEntryTbody.appendChild(tr);
  });
  modalEntryTbody.querySelectorAll('.remove-btn').forEach(btn =>
    btn.addEventListener('click', () => { modalEntries.splice(+btn.dataset.index, 1); renderModalEntries(); }));
}

function addModalEntry() {
  const val = modalGuessInput.value.trim(), sets = parseInt(modalSetsInput.value);
  const doSwap = $('modal-swap-check').checked;
  modalInputError.textContent = '';
  if (!/^\d+$/.test(val) || val.length !== modalDigits) { modalInputError.textContent = `Enter exactly ${modalDigits} digits.`; return; }
  if (isNaN(sets) || sets < minSets || sets > maxSets) { modalInputError.textContent = `Sets: ${minSets}–${maxSets}.`; return; }

  if (doSwap) {
    const perms = allPermutations(val);
    let added = 0;
    perms.forEach(p => {
      if (modalEntries.length >= maxEntries) return;
      modalEntries.push({ number: p, digits: modalDigits, sets, pool: modalPool, swapOf: p !== val ? val : undefined });
      added++;
    });
    if (added === 0) { modalInputError.textContent = `Max ${maxEntries}.`; return; }
  } else {
    if (modalEntries.length >= maxEntries) { modalInputError.textContent = `Max ${maxEntries}.`; return; }
    modalEntries.push({ number: val, digits: modalDigits, sets, pool: modalPool });
  }

  modalGuessInput.value = ''; modalSetsInput.value = 1; modalGuessInput.focus();
  renderModalEntries();
}

function saveModal() {
  const name = modalNameInput.value.trim();
  modalNameError.textContent = '';
  if (!name) { modalNameError.textContent = 'Enter a name.'; return; }
  const dup = players.find((p, i) => i !== modalPlayerIndex && p.name.toLowerCase() === name.toLowerCase());
  if (dup) { modalNameError.textContent = 'Name already used.'; return; }
  players[modalPlayerIndex].name = name;
  players[modalPlayerIndex].entries = [...modalEntries];
  closeModal();
  // Refresh — works in both setup and results mode
  renderPlayerList();
  refreshSetupStats();
  if (!$('right-results').classList.contains('hidden')) {
    buildResultsScreen();
  }
}

// Modal events
$('modal-close').addEventListener('click', closeModal);
$('modal-cancel').addEventListener('click', closeModal);
$('modal-save').addEventListener('click', saveModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

modalAddBtn.addEventListener('click', addModalEntry);
modalGuessInput.addEventListener('keydown', e => { if (e.key === 'Enter') addModalEntry(); });
modalGuessInput.addEventListener('input', e => { e.target.value = e.target.value.replace(/[^\d]/g, ''); });
modalSetsInput.addEventListener('keydown', e => { if (e.key === 'Enter') addModalEntry(); });
modalClearBtn.addEventListener('click', () => { modalEntries = []; renderModalEntries(); });

modalDigitBtns.forEach(btn => btn.addEventListener('click', () => {
  modalDigits = +btn.dataset.digits;
  modalDigitBtns.forEach(b => b.classList.toggle('active', b === btn));
  modalGuessInput.maxLength = modalDigits;
  modalGuessInput.placeholder = modalDigits === 2 ? 'XX' : 'XXX';
  modalGuessInput.value = '';
  modalGuessInput.focus();
}));

$('modal-mode-single').addEventListener('click', () => {
  $('modal-mode-single').classList.add('active'); $('modal-mode-raw').classList.remove('active');
  $('modal-input-single').classList.remove('hidden'); $('modal-input-raw').classList.add('hidden');
});
$('modal-mode-raw').addEventListener('click', () => {
  $('modal-mode-raw').classList.add('active'); $('modal-mode-single').classList.remove('active');
  $('modal-input-raw').classList.remove('hidden'); $('modal-input-single').classList.add('hidden');
});

// Modal pool selector (single)
document.querySelectorAll('#modal-pool-selector .pool-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    modalPool = btn.dataset.pool;
    document.querySelectorAll('#modal-pool-selector .pool-btn').forEach(b =>
      b.classList.toggle('active', b === btn));
  }));

// Modal pool selector (raw)
document.querySelectorAll('#modal-raw-pool-selector .pool-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    modalRawPool = btn.dataset.pool;
    document.querySelectorAll('#modal-raw-pool-selector .pool-btn').forEach(b =>
      b.classList.toggle('active', b === btn));
  }));

$('modal-raw-add-btn').addEventListener('click', () => {
  modalInputError.textContent = ''; modalInputError.style.color = '';
  const text = $('modal-raw-input').value;
  if (!text.trim()) { modalInputError.textContent = 'Paste or type numbers.'; return; }
  const { parsed, errors } = parseRawText(text);
  if (!parsed.length && errors.length) { modalInputError.style.color = '#e74c3c'; modalInputError.textContent = errors[0]; return; }
  let added = 0;
  for (const item of parsed) {
    if (modalEntries.length >= maxEntries) break;
    item.pool = modalRawPool;
    modalEntries.push(item); added++;
  }
  if (added) { $('modal-raw-input').value = ''; renderModalEntries(); }
  modalInputError.style.color = added ? '#2ecc71' : '#e74c3c';
  modalInputError.textContent = `Added ${added}.`;
  setTimeout(() => { modalInputError.textContent = ''; modalInputError.style.color = ''; }, 2500);
});

// ═══════════════════════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════════════════════

// Warn before leaving if there's any data
window.addEventListener('beforeunload', (e) => {
  if (players.length > 0 || pendingEntries.length > 0) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Collapsible prize panel
const prizesToggle  = $('prizes-toggle');
const prizesArrow   = $('prizes-arrow');
const prizesContent = $('prizes-content');

prizesToggle.addEventListener('click', () => {
  const collapsed = prizesContent.classList.toggle('collapsed');
  prizesArrow.classList.toggle('collapsed', collapsed);
});

buildPrizeConfigRows();
renderPlayerList();
renderPending();
showMode('setup');
