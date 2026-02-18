import rateLimit from 'express-rate-limit';

export const scoreLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 score submissions per minute
    message: { error: 'Too many scores submitted. Please wait.' }
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 10,
    message: { error: 'Too many login attempts.' }
});