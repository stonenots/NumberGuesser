const GAME_CONFIG = {
  // 6 winning numbers — one per prize tier
  winningNumbers: [
    { prizeId: '3-digit-1st', number: '456' },
    { prizeId: '3-digit-2nd', number: '654' },
    { prizeId: '2-digit-1st', number: '56'  },
    { prizeId: '2-digit-2nd', number: '65'  },
    { prizeId: '3-digit-3rd', number: '123' },
    { prizeId: '2-digit-3rd', number: '12'  },
  ],

  // Prize tiers — id must match winningNumbers prizeId
  prizes: [
    { id: '3-digit-1st', name: '1st Prize', digits: 3, points: 10000, color: '#FFD700' },
    { id: '3-digit-2nd', name: '2nd Prize', digits: 3, points: 5000,  color: '#C0C0C0' },
    { id: '2-digit-1st', name: '3rd Prize', digits: 2, points: 2000,  color: '#CD7F32' },
    { id: '2-digit-2nd', name: '4th Prize', digits: 2, points: 500,   color: '#4CAF50' },
    { id: '3-digit-3rd', name: '5th Prize', digits: 3, points: 100,   color: '#2196F3' },
    { id: '2-digit-3rd', name: '6th Prize', digits: 2, points: 10,    color: '#9E9E9E' },
  ],

  // Limits
  maxPlayers:  20,
  maxEntries:  100,
  minSets:     1,
  maxSets:     999,
};
