import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function authRequired(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'Missing Authorization header' });
    const token = authHeader.split(' ')[1] || authHeader;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'PayrollJWTSecretKey');
        req.user = payload;
        return next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

export function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
        if (req.user.role !== role) return res.status(403).json({ success: false, message: 'Forbidden' });
        return next();
    };
}
