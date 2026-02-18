// Simple progression curve: Level = floor(sqrt(XP / 100)) + 1
// 100 XP = Lv 2, 400 XP = Lv 3, 900 XP = Lv 4, etc.
export const calculateLevel = (totalXp) => {
    return Math.floor(Math.sqrt(totalXp / 100)) + 1;
};

export const calculateXpReward = (score, gameId) => {
    // Simple logic: 10% of Slice/Beat score = XP. Snek length * 5 = XP.
    if (gameId === 'snek-io') return score * 5;
    return Math.floor(score * 0.1);
};
