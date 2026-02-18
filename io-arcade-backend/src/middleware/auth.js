import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId: 123, username: "..." }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
};
