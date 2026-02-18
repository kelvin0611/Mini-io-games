import { prisma } from '../../config/db.js';

export const getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { username: true, totalXp: true, level: true, loadout: true, createdAt: true }
        });
        res.json(user);
    } catch (error) {
        next(error);
    }
};

export const updateLoadout = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        const newLoadout = { ...user.loadout, ...req.body };

        await prisma.user.update({
            where: { id: req.user.userId },
            data: { loadout: newLoadout }
        });
        
        res.json({ message: 'Loadout updated', loadout: newLoadout });
    } catch (error) {
        next(error);
    }
};