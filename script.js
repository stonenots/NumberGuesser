const prizes      = GAME_CONFIG.prizes;
const winningNums = GAME_CONFIG.winningNumbers;
const maxPlayers  = GAME_CONFIG.maxPlayers;
const maxEntries  = GAME_CONFIG.maxEntries;
const minSets     = GAME_CONFIG.minSets;
const maxSets     = GAME_CONFIG.maxSets;

// State
let players        = []; // { name, entries: [{ number, digits, sets }] }
let activePlayer   = 0;
let selectedDigits = 2;

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: Prize table HTML
// ─────────────────────────────────────────────────────────────────────────────
function buildPrizeTableHTML() {
  const rows = prizes.map(p => {
    const wn = winningNums.find(w => w.prizeId === p.id);
    return `<tr>
      <td style="text-align:left">
        <span class="prize-badge" style="background:${p.color};">${p.digits}D</span>${p.name}
      </td>
      <td><span class="winning-num">${wn ? wn.number : '—'}</span></td>
      <td style="text-align:center">${p.digits}</td>
      <td class="pts-cell" style="text-align:right">${p.points.toLocaleString()}</td>
    </tr>`;
  }).join('');

  return `<table>
    <thead><tr>
      <th style="text-align:left">Prize</th>
      <th style="text-align:center">Winning #</th>
      <th style="text-align:center">Digits</th>
      <th style="text-align:right">Pts / Set</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN helpers
// ─────────────────────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const playerNameInput = document.getElementById('player-name-input');
const addPlayerBtn    = document.getElementById('add-player-btn');
const playerNameError = document.getElementById('player-name-error');
const playerListEl    = document.getElementById('player-list');
const startGameBtn    = document.getElementById('start-game-btn');

document.getElementById('prize-table-setup').innerHTML = buildPrizeTableHTML();

function renderPlayerList() {
  playerListEl.innerHTML = '';
  players.forEach((p, i) => {
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    chip.innerHTML = `<span>${p.name}</span>
      <button class="chip-remove" data-index="${i}" title="Remove">×</button>`;
    playerListEl.appendChild(chip);
  });

  playerListEl.querySelectorAll('.chip-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      players.splice(parseInt(btn.dataset.index), 1);
      renderPlayerList();
      startGameBtn.disabled = players.length === 0;
    });
  });

  startGameBtn.disabled = players.length === 0;
  addPlayerBtn.disabled = players.length >= maxPlayers;
}

function addPlayer() {
  const name = playerNameInput.value.trim();
  playerNameError.textContent = '';

  if (!name) { playerNameError.textContent = 'Enter a player name.'; return; }
  if (players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
    playerNameError.textContent = 'Name already added.'; return;
  }
  if (players.length >= maxPlayers) {
    playerNameError.textContent = `Max ${maxPlayers} players.`; return;
  }

  players.push({ name, entries: [] });
  playerNameInput.value = '';
  playerNameInput.focus();
  renderPlayerList();
}

addPlayerBtn.addEventListener('click', addPlayer);
playerNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') addPlayer(); });

startGameBtn.addEventListener('click', () => {
  activePlayer = 0;
  initEntryScreen();
  showScreen('screen-entry');
});

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const entrySubtitle = document.getElementById('entry-subtitle');
const playerTabsEl  = document.getElementById('player-tabs');
const guessInput    = document.getElementById('guess-input');
const setsInput     = document.getElementById('sets-input');
const addBtn        = document.getElementById('add-btn');
const clearBtn      = document.getElementById('clear-btn');
const checkBtn      = document.getElementById('check-btn');
const entryCountEl  = document.getElementById('entry-count');
const entryMaxEl    = document.getElementById('entry-max');
const inputErrorEl  = document.getElementById('input-error');
const entryThead    = document.getElementById('entry-thead');
const entryTbody    = document.getElementById('entry-tbody');
const entryEmpty    = document.getElementById('entry-empty');
const digitBtns     = document.querySelectorAll('.digit-btn');

document.getElementById('prize-table-entry').innerHTML = buildPrizeTableHTML();

function initEntryScreen() {
  selectedDigits = 2;
  guessInput.maxLength   = 2;
  guessInput.placeholder = 'XX';
  guessInput.value       = '';
  setsInput.value        = 1;
  inputErrorEl.textContent = '';
  entryMaxEl.textContent   = maxEntries;
  digitBtns.forEach(b => b.classList.toggle('active', b.dataset.digits === '2'));
  renderPlayerTabs();
  renderEntryTable();
}

function renderPlayerTabs() {
  playerTabsEl.innerHTML = '';
  players.forEach((p, i) => {
    const tab = document.createElement('button');
    tab.className = 'player-tab' + (i === activePlayer ? ' active' : '');
    tab.textContent = p.name;
    tab.addEventListener('click', () => switchPlayer(i));
    playerTabsEl.appendChild(tab);
  });

  entrySubtitle.textContent =
    `Player: ${players[activePlayer].name}  ·  add up to ${maxEntries} numbers`;
}

function switchPlayer(index) {
  activePlayer = index;
  selectedDigits = 2;
  guessInput.maxLength   = 2;
  guessInput.placeholder = 'XX';
  guessInput.value       = '';
  setsInput.value        = 1;
  inputErrorEl.textContent = '';
  digitBtns.forEach(b => b.classList.toggle('active', b.dataset.digits === '2'));
  renderPlayerTabs();
  renderEntryTable();
}

digitBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedDigits = parseInt(btn.dataset.digits);
    digitBtns.forEach(b => b.classList.toggle('active', b === btn));
    guessInput.maxLength   = selectedDigits;
    guessInput.placeholder = selectedDigits === 2 ? 'XX' : 'XXX';
    guessInput.value = '';
    inputErrorEl.textContent = '';
    guessInput.focus();
  });
});

function addEntry() {
  const val  = guessInput.value.trim();
  const sets = parseInt(setsInput.value);
  inputErrorEl.textContent = '';

  if (!/^\d+$/.test(val) || val.length !== selectedDigits) {
    inputErrorEl.textContent = `Enter exactly ${selectedDigits} digits.`;
    guessInput.focus(); return;
  }
  if (isNaN(sets) || sets < minSets || sets > maxSets) {
    inputErrorEl.textContent = `Sets must be between ${minSets} and ${maxSets}.`;
    setsInput.focus(); return;
  }

  const entries = players[activePlayer].entries;
  if (entries.length >= maxEntries) {
    inputErrorEl.textContent = `Max ${maxEntries} numbers reached.`; return;
  }

  entries.push({ number: val, digits: selectedDigits, sets });
  guessInput.value = '';
  setsInput.value  = 1;
  guessInput.focus();
  renderEntryTable();
}

function removeEntry(index) {
  players[activePlayer].entries.splice(index, 1);
  renderEntryTable();
}

function clearEntries() {
  players[activePlayer].entries = [];
  renderEntryTable();
}

function renderEntryTable() {
  const entries = players[activePlayer].entries;
  entryCountEl.textContent = entries.length;
  addBtn.disabled          = entries.length >= maxEntries;
  checkBtn.disabled        = players.every(p => p.entries.length === 0);

  if (entries.length === 0) {
    entryEmpty.style.display = 'block';
    entryThead.innerHTML     = '';
    entryTbody.innerHTML     = '';
    return;
  }

  entryEmpty.style.display = 'none';

  entryThead.innerHTML = `<tr>
    <th style="text-align:left">Number</th>
    <th style="text-align:center">Sets</th>
    <th style="text-align:right">Remove</th>
  </tr>`;

  entryTbody.innerHTML = '';
  entries.forEach((e, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="num-cell">${e.number}</td>
      <td class="sets-cell">×${e.sets}</td>
      <td style="text-align:right">
        <button class="remove-btn" data-index="${i}">×</button>
      </td>`;
    entryTbody.appendChild(tr);
  });

  entryTbody.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => removeEntry(parseInt(btn.dataset.index)));
  });
}

addBtn.addEventListener('click', addEntry);
clearBtn.addEventListener('click', clearEntries);
guessInput.addEventListener('keydown', e => { if (e.key === 'Enter') addEntry(); });
guessInput.addEventListener('input',   e => { e.target.value = e.target.value.replace(/[^\d]/g, ''); });
setsInput.addEventListener('keydown',  e => { if (e.key === 'Enter') addEntry(); });

checkBtn.addEventListener('click', () => {
  buildResultsScreen();
  showScreen('screen-results');
});

// ─────────────────────────────────────────────────────────────────────────────
// PRIZE LOGIC
// ─────────────────────────────────────────────────────────────────────────────
function evaluateEntry(entry) {
  // Returns array of { prize, pts } for each prize tier
  return prizes.map(p => {
    const wn = winningNums.find(w => w.prizeId === p.id);
    if (!wn || wn.number.length !== entry.digits) return { prize: p, hit: false, pts: 0 };
    const hit = entry.number === wn.number;
    return { prize: p, hit, pts: hit ? p.points * entry.sets : 0 };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const resultTabsEl   = document.getElementById('result-tabs');
const resultPanelsEl = document.getElementById('result-panels');
const leaderboardEl  = document.getElementById('leaderboard');
const resultSubtitle = document.getElementById('results-subtitle');

function buildResultsScreen() {
  resultTabsEl.innerHTML   = '';
  resultPanelsEl.innerHTML = '';

  const playerScores = players.map((player, pi) => {
    // Build result panel
    const panel = document.createElement('div');
    panel.className = 'result-panel' + (pi === 0 ? ' active' : '');
    panel.id = `result-panel-${pi}`;

    const entries = player.entries;
    let playerTotal = 0;

    if (entries.length === 0) {
      panel.innerHTML = `<p style="color:rgba(255,255,255,0.35);padding:16px 0;font-size:0.85rem;">No numbers entered.</p>`;
    } else {
      // Prize column headers
      const prizeHeaders = prizes.map(p =>
        `<th style="text-align:center;color:${p.color};">${p.name}</th>`
      ).join('');

      let rows = '';
      entries.forEach(e => {
        const results  = evaluateEntry(e);
        const rowTotal = results.reduce((s, r) => s + r.pts, 0);
        playerTotal   += rowTotal;

        const prizeCells = results.map(r =>
          r.hit
            ? `<td class="match-cell hit">✓ +${r.pts.toLocaleString()}</td>`
            : `<td class="match-cell miss">✗</td>`
        ).join('');

        rows += `<tr class="${rowTotal > 0 ? 'row-won' : 'row-lost'}">
          <td class="num-cell">${e.number}</td>
          <td class="sets-cell" style="text-align:center;">×${e.sets}</td>
          ${prizeCells}
          <td class="total-cell ${rowTotal === 0 ? 'zero' : ''}">${rowTotal > 0 ? '+' + rowTotal.toLocaleString() : '—'}</td>
        </tr>`;
      });

      panel.innerHTML = `
        <div class="result-table-wrap">
          <table class="result-table">
            <thead><tr>
              <th style="text-align:left">Number</th>
              <th style="text-align:center">Sets</th>
              ${prizeHeaders}
              <th style="text-align:right">Total</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="player-total-bar">
          <span>${player.name}'s Total</span>
          <span class="score-val">${playerTotal.toLocaleString()} pts</span>
        </div>`;
    }

    resultPanelsEl.appendChild(panel);

    // Tab
    const tab = document.createElement('button');
    tab.className = 'player-tab' + (pi === 0 ? ' active' : '');
    tab.textContent = player.name;
    tab.addEventListener('click', () => switchResultTab(pi));
    resultTabsEl.appendChild(tab);

    return { name: player.name, score: playerTotal };
  });

  // Subtitle
  resultSubtitle.textContent = `${players.length} player${players.length !== 1 ? 's' : ''}`;

  // Leaderboard
  const sorted = [...playerScores].sort((a, b) => b.score - a.score);
  const rankClass = ['gold', 'silver', 'bronze'];

  leaderboardEl.innerHTML = `
    <div class="leaderboard-title">Leaderboard</div>
    ${sorted.map((p, i) => `
      <div class="lb-row">
        <div class="lb-rank ${rankClass[i] || ''}">${i + 1}</div>
        <div class="lb-name">${p.name}</div>
        <div class="lb-score">${p.score.toLocaleString()} pts</div>
      </div>`).join('')}
  `;
}

function switchResultTab(index) {
  document.querySelectorAll('#result-tabs .player-tab').forEach((t, i) =>
    t.classList.toggle('active', i === index));
  document.querySelectorAll('.result-panel').forEach((p, i) =>
    p.classList.toggle('active', i === index));
}

document.getElementById('play-again-btn').addEventListener('click', () => {
  players = [];
  renderPlayerList();
  showScreen('screen-setup');
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────
function exportResults() {
  const timestamp = new Date().toLocaleString();
  const sorted    = [...players]
    .map(p => ({ ...p, total: calcPlayerTotal(p) }))
    .sort((a, b) => b.total - a.total);

  const rankClass = ['gold', 'silver', 'bronze'];

  // ── Winning numbers reference ──
  const winTableRows = prizes.map(p => {
    const wn = winningNums.find(w => w.prizeId === p.id);
    return `<tr>
      <td><span class="badge" style="background:${p.color}">${p.digits}D</span> ${p.name}</td>
      <td class="mono">${wn ? wn.number : '—'}</td>
      <td>${p.digits}</td>
      <td class="pts">${p.points.toLocaleString()}</td>
    </tr>`;
  }).join('');

  // ── Per-player sections ──
  const playerSections = players.map(player => {
    const entries    = player.entries;
    const total      = calcPlayerTotal(player);

    if (entries.length === 0) {
      return `<section class="player-section">
        <h2>${esc(player.name)}</h2>
        <p class="empty">No numbers entered.</p>
      </section>`;
    }

    const prizeHeaders = prizes.map(p =>
      `<th style="color:${p.color}">${p.name}</th>`
    ).join('');

    const rows = entries.map(e => {
      const results  = evaluateEntry(e);
      const rowTotal = results.reduce((s, r) => s + r.pts, 0);
      const cells    = results.map(r =>
        r.hit
          ? `<td class="hit">✓ +${r.pts.toLocaleString()}</td>`
          : `<td class="miss">✗</td>`
      ).join('');

      return `<tr class="${rowTotal > 0 ? 'won' : 'lost'}">
        <td class="mono">${esc(e.number)}</td>
        <td class="center">×${e.sets}</td>
        ${cells}
        <td class="right ${rowTotal === 0 ? 'zero' : 'total-pts'}">${rowTotal > 0 ? '+' + rowTotal.toLocaleString() : '—'}</td>
      </tr>`;
    }).join('');

    return `<section class="player-section">
      <h2>${esc(player.name)}</h2>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Number</th><th>Sets</th>${prizeHeaders}<th class="right">Total</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="player-total">
        <span>${esc(player.name)}'s Total</span>
        <span class="score">${total.toLocaleString()} pts</span>
      </div>
    </section>`;
  }).join('');

  // ── Leaderboard ──
  const lbRows = sorted.map((p, i) => `
    <tr>
      <td><span class="rank ${rankClass[i] || ''}">${i + 1}</span></td>
      <td>${esc(p.name)}</td>
      <td class="pts">${p.total.toLocaleString()}</td>
    </tr>`).join('');

  // ── Full HTML page ──
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NumberGuesser — Results</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
      font-family: 'Segoe UI', sans-serif;
      color: #fff;
      padding: 30px 16px;
      min-height: 100vh;
    }
    .page { max-width: 820px; margin: 0 auto; }
    h1 {
      font-size: 2rem; font-weight: 700; margin-bottom: 4px;
      background: linear-gradient(90deg, #e94560, #f5a623);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .meta { color: rgba(255,255,255,0.4); font-size: 0.82rem; margin-bottom: 28px; }

    /* Sections */
    .section-title {
      font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;
      color: rgba(255,255,255,0.35); font-weight: 600;
      margin-bottom: 10px; margin-top: 28px;
    }

    /* Prize reference */
    .prize-ref {
      background: rgba(255,255,255,0.04);
      border-radius: 12px; overflow: hidden; margin-bottom: 28px;
    }
    .prize-ref table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .prize-ref th {
      padding: 8px 12px; background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.4); font-size: 0.7rem;
      text-transform: uppercase; letter-spacing: 0.5px; text-align: left;
    }
    .prize-ref td { padding: 8px 12px; border-top: 1px solid rgba(255,255,255,0.05); }
    .badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 5px;
      font-size: 0.6rem; font-weight: 700; color: #000;
      margin-right: 6px; vertical-align: middle;
    }
    .mono { font-weight: 700; letter-spacing: 3px; }
    .pts  { color: #f5a623; font-weight: 700; }

    /* Player sections */
    .player-section {
      background: rgba(255,255,255,0.04);
      border-radius: 14px; padding: 20px; margin-bottom: 20px;
    }
    .player-section h2 {
      font-size: 1.1rem; font-weight: 700; margin-bottom: 14px;
      color: #fff;
    }
    .empty { color: rgba(255,255,255,0.3); font-size: 0.85rem; }

    .table-wrap { overflow-x: auto; border-radius: 10px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    thead th {
      padding: 8px 10px; background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.4); font-size: 0.7rem;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    tbody td {
      padding: 8px 10px; border-top: 1px solid rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.8);
    }
    tr.won td { background: rgba(46,204,113,0.07); }
    tr.lost td { opacity: 0.35; }
    .hit  { color: #2ecc71; font-weight: 700; text-align: center; }
    .miss { color: rgba(255,255,255,0.15); text-align: center; }
    .center { text-align: center; }
    .right  { text-align: right; }
    .total-pts { color: #2ecc71; font-weight: 700; }
    .zero      { color: rgba(255,255,255,0.2); }

    .player-total {
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(255,255,255,0.05); border-radius: 10px;
      padding: 12px 16px; font-weight: 700; font-size: 0.9rem;
    }
    .player-total .score { color: #f5a623; font-size: 1.1rem; }

    /* Leaderboard */
    .leaderboard {
      background: rgba(255,255,255,0.04);
      border-radius: 14px; overflow: hidden; margin-bottom: 28px;
    }
    .lb-head {
      padding: 10px 16px; background: rgba(255,255,255,0.07);
      font-size: 0.7rem; text-transform: uppercase;
      letter-spacing: 1px; color: rgba(255,255,255,0.4); font-weight: 600;
    }
    .leaderboard table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .leaderboard td { padding: 10px 16px; border-top: 1px solid rgba(255,255,255,0.05); }
    .rank {
      display: inline-flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 50%;
      font-size: 0.75rem; font-weight: 700;
      background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5);
    }
    .rank.gold   { background: #FFD700; color: #000; }
    .rank.silver { background: #C0C0C0; color: #000; }
    .rank.bronze { background: #CD7F32; color: #000; }

    @media print {
      body { background: #fff; color: #000; padding: 10px; }
      h1 { -webkit-text-fill-color: #e94560; }
      .player-section, .prize-ref, .leaderboard { border: 1px solid #ddd; }
    }
  </style>
</head>
<body>
  <div class="page">
    <h1>NumberGuesser — Results</h1>
    <p class="meta">Generated: ${timestamp} · ${players.length} player${players.length !== 1 ? 's' : ''}</p>

    <p class="section-title">Winning Numbers</p>
    <div class="prize-ref">
      <table>
        <thead><tr><th>Prize</th><th>Winning #</th><th>Digits</th><th>Pts / Set</th></tr></thead>
        <tbody>${winTableRows}</tbody>
      </table>
    </div>

    <p class="section-title">Leaderboard</p>
    <div class="leaderboard">
      <div class="lb-head">Rankings</div>
      <table><tbody>${lbRows}</tbody></table>
    </div>

    <p class="section-title">Player Details</p>
    ${playerSections}
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

function calcPlayerTotal(player) {
  return player.entries.reduce((sum, e) => {
    const results = evaluateEntry(e);
    return sum + results.reduce((s, r) => s + r.pts, 0);
  }, 0);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.getElementById('export-btn').addEventListener('click', exportResults);

// ─────────────────────────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────────────────────────
showScreen('screen-setup');
