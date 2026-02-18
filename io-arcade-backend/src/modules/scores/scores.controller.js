import { prisma } from '../../config/db.js';
import { calculateLevel, calculateXpReward } from '../../utils/levelSystem.js';

export const submitScore = async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const { score, duration } = req.body;
        const userId = req.user.userId;

        // 1. Save Score
        await prisma.score.create({
            data: { userId, gameId, score, duration }
        });

        // 2. Calculate XP & Level progression
        const xpEarned = calculateXpReward(score, gameId);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        const newTotalXp = user.totalXp + xpEarned;
        const newLevel = calculateLevel(newTotalXp);
        const levelUp = newLevel > user.level;

        await prisma.user.update({
            where: { id: userId },
            data: { totalXp: newTotalXp, level: newLevel }
        });

        // 3. Check if it's a personal best
        const bestScore = await prisma.score.findFirst({
            where: { userId, gameId },
            orderBy: { score: 'desc' }
        });
        const isNewBest = bestScore.score === score;

        res.json({ isNewBest, xpEarned, levelUp, currentXp: newTotalXp, level: newLevel });
    } catch (error) {
        next(error);
    }
};

export const getLeaderboard = async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const topScores = await prisma.score.findMany({
            where: { gameId },
            orderBy: { score: 'desc' },
            take: 100,
            include: { user: { select: { username: true } } }
        });

        const leaderboard = topScores.map((entry, index) => ({
            rank: index + 1,
            username: entry.user.username,
            score: entry.score,
            date: entry.createdAt
        }));

        res.json({ game: gameId, leaderboard });
    } catch (error) {
        next(error);
    }
};