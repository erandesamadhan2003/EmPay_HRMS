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
        const userRole = String(req.user.role || '').toLowerCase();
        const allowedRole = String(role || '').toLowerCase();
        if (userRole !== allowedRole) return res.status(403).json({ success: false, message: 'Forbidden' });
        return next();
    };
}

export function requireRoles(...roles) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const userRole = String(req.user.role || '').toLowerCase();
        const allowedRoles = roles.map(r => String(r).toLowerCase());
        if (!allowedRoles.includes(userRole)) return res.status(403).json({ success: false, message: 'Forbidden' });
        return next();
    };
}
