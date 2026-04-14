const GAME_CONFIG = {

  // ── Upper Prize ──────────────────────────────────────────────────────────
  // One 3-digit winning number.
  // A 3-digit guess wins "upper3" (exact match).
  // A 2-digit guess wins "upper2" if it matches the last 2 digits of the upper number.
  upperPrize: {
    number: '456',          // 3-digit winning number
    prizes: [
      { id: 'upper3', name: 'Upper Prize',      digits: 3, points: 100, color: '#FFD700', desc: '3-digit exact match' },
      { id: 'upper2', name: 'Upper Prize (2D)',  digits: 2, points: 60,  color: '#FFC107', desc: 'Last 2 digits of upper number' },
    ],
  },

  // ── Lower Prize ──────────────────────────────────────────────────────────
  // 5 winning numbers: 1 two-digit + 4 three-digit.
  // Each is matched exactly by the player's guess of the same digit length.
  lowerPrize: {
    prizes: [
      { id: 'lower3a', name: '1st Lower', digits: 3, number: '123', points: 100, color: '#C0C0C0' },
      { id: 'lower3b', name: '2nd Lower', digits: 3, number: '321', points: 100, color: '#CD7F32' },
      { id: 'lower3c', name: '3rd Lower', digits: 3, number: '789', points: 100, color: '#4CAF50' },
      { id: 'lower3d', name: '4th Lower', digits: 3, number: '987', points: 100,  color: '#2196F3' },
      { id: 'lower2a', name: '5th Lower', digits: 2, number: '56',  points: 60,  color: '#9E9E9E' },
    ],
  },

  // ── Limits ───────────────────────────────────────────────────────────────
  maxPlayers: 20,
  maxEntries: 100,
  minSets:    1,
  maxSets:    999,

  // Cost per set (deducted from winnings to calculate net profit)
  costPerSet: 1,
};
