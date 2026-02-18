import { prisma } from '../../config/db.js';

export const getDailyChallenges = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const now = new Date();

        // Find today's unexpired challenges
        let challenges = await prisma.challenge.findMany({
            where: { userId, type: 'daily', expiresAt: { gt: now } }
        });

        // If none exist, generate new ones (Mock generation)
        if (challenges.length === 0) {
            const tomorrow = new Date();
            tomorrow.setHours(24, 0, 0, 0);

            await prisma.challenge.createMany({
                data: [
                    { userId, desc: "Slice 300 fruits", target: 300, xpReward: 500, type: 'daily', expiresAt: tomorrow },
                    { userId, desc: "Play 5 rounds of Beat.io", target: 5, xpReward: 300, type: 'daily', expiresAt: tomorrow }
                ]
            });

            challenges = await prisma.challenge.findMany({ where: { userId, type: 'daily', expiresAt: { gt: now } } });
        }

        res.json(challenges);
    } catch (error) {
        next(error);
    }
};
