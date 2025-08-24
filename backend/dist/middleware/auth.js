"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.verifyToken = exports.generateToken = exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({
            error: 'Access token required',
            message: 'Please provide a valid access token'
        });
    }
    try {
        const jwtSecret = process.env.JWT_SECRET || 'your-default-secret-key';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role || 'user'
        };
        next();
    }
    catch (error) {
        return res.status(403).json({
            error: 'Invalid token',
            message: 'The provided token is invalid or expired'
        });
    }
};
exports.authenticateToken = authenticateToken;
// Admin Role Middleware
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
        });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Admin access required',
            message: 'This action requires admin privileges'
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;
// Generate JWT Token
const generateToken = (payload) => {
    const jwtSecret = process.env.JWT_SECRET || 'your-default-secret-key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    return jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn });
};
exports.generateToken = generateToken;
// Verify JWT Token
const verifyToken = (token) => {
    const jwtSecret = process.env.JWT_SECRET || 'your-default-secret-key';
    return jsonwebtoken_1.default.verify(token, jwtSecret);
};
exports.verifyToken = verifyToken;
// Optional Authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            const jwtSecret = process.env.JWT_SECRET || 'your-default-secret-key';
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role || 'user'
            };
        }
        catch (error) {
            // Continue without user if token is invalid
            req.user = undefined;
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map