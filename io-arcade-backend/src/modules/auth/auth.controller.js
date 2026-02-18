import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';

const generateToken = (res, user) => {
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

export const register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const hashedPassword = await argon2.hash(password);
        
        const user = await prisma.user.create({
            data: { email, username, password: hashedPassword }
        });

        generateToken(res, user);
        res.status(201).json({ message: 'Account created', user: { id: user.id, username: user.username } });
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Username or email already exists' });
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await argon2.verify(user.password, password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        generateToken(res, user);
        res.json({ message: 'Logged in successfully', user: { id: user.id, username: user.username } });
    } catch (error) {
        next(error);
    }
};

export const logout = (req, res) => {
    res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
    res.json({ message: 'Logged out' });
};
