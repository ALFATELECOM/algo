"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const zerodhaService_1 = __importDefault(require("../services/zerodhaService"));
const router = express_1.default.Router();
const zerodhaService = new zerodhaService_1.default();
const users = new Map();
// Validation rules
const registerValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
];
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password required')
];
// Register user
router.post('/register', registerValidation, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const { email, password } = req.body;
        // Check if user already exists
        const existingUser = Array.from(users.values()).find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists',
                message: 'An account with this email already exists'
            });
        }
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        // Create user
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newUser = {
            id: userId,
            email,
            password: hashedPassword,
            role: 'user',
            createdAt: new Date().toISOString(),
            zerodhaConnected: false
        };
        users.set(userId, newUser);
        // Generate token
        const token = (0, auth_1.generateToken)({
            id: userId,
            email,
            role: 'user'
        });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: userId,
                email,
                role: 'user',
                createdAt: newUser.createdAt
            },
            token,
            expiresIn: '24h'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Registration failed',
            message: error.message
        });
    }
});
// Login user
router.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const { email, password } = req.body;
        // Find user
        const user = Array.from(users.values()).find(user => user.email === email);
        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }
        // Generate token
        const token = (0, auth_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role
        });
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                zerodhaConnected: user.zerodhaConnected
            },
            token,
            expiresIn: '24h'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Login failed',
            message: error.message
        });
    }
});
// Get user profile
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const user = users.get(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User profile not found'
            });
        }
        // Get Zerodha profile if connected
        let zerodhaProfile = null;
        if (zerodhaService.isLoggedIn()) {
            try {
                zerodhaProfile = await zerodhaService.getProfile();
            }
            catch (error) {
                console.error('Failed to get Zerodha profile:', error);
            }
        }
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                zerodhaConnected: user.zerodhaConnected
            },
            zerodhaProfile,
            session: zerodhaService.getSession(),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to get profile',
            message: error.message
        });
    }
});
// Zerodha login URL
router.get('/zerodha/login-url', auth_1.authenticateToken, (req, res) => {
    try {
        const loginUrl = zerodhaService.getLoginUrl();
        res.json({
            loginUrl,
            message: 'Redirect user to this URL for Zerodha authentication',
            instructions: [
                '1. Redirect user to the login URL',
                '2. User will login to Zerodha',
                '3. Zerodha will redirect back with request_token',
                '4. Send request_token to /auth/zerodha/callback endpoint'
            ]
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to generate login URL',
            message: error.message
        });
    }
});
// Zerodha callback
router.post('/zerodha/callback', auth_1.authenticateToken, async (req, res) => {
    try {
        const { request_token } = req.body;
        if (!request_token) {
            return res.status(400).json({
                error: 'Missing request token',
                message: 'Request token is required for Zerodha authentication'
            });
        }
        // Generate session with Zerodha
        const session = await zerodhaService.generateSession(request_token);
        // Update user's Zerodha connection status
        const userId = req.user?.id;
        const user = users.get(userId);
        if (user) {
            user.zerodhaConnected = true;
            users.set(userId, user);
        }
        res.json({
            success: true,
            message: 'Zerodha connected successfully',
            session: {
                userId: session.userId,
                loginTime: session.loginTime
            },
            zerodhaConnected: true
        });
    }
    catch (error) {
        res.status(400).json({
            error: 'Zerodha authentication failed',
            message: error.message
        });
    }
});
// Zerodha logout
router.post('/zerodha/logout', auth_1.authenticateToken, (req, res) => {
    try {
        zerodhaService.logout();
        // Update user's Zerodha connection status
        const userId = req.user?.id;
        const user = users.get(userId);
        if (user) {
            user.zerodhaConnected = false;
            users.set(userId, user);
        }
        res.json({
            success: true,
            message: 'Zerodha disconnected successfully',
            zerodhaConnected: false
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to disconnect Zerodha',
            message: error.message
        });
    }
});
// Change password
router.post('/change-password', auth_1.authenticateToken, [
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password required'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    (0, express_validator_1.body)('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const { currentPassword, newPassword } = req.body;
        const userId = req.user?.id;
        const user = users.get(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
        }
        // Verify current password
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid current password',
                message: 'Current password is incorrect'
            });
        }
        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
        // Update password
        user.password = hashedPassword;
        users.set(userId, user);
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to change password',
            message: error.message
        });
    }
});
// Logout
router.post('/logout', auth_1.authenticateToken, (req, res) => {
    try {
        // In a real app, you might want to blacklist the token
        // For now, we'll just return success
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Logout failed',
            message: error.message
        });
    }
});
// Get all users (admin only)
router.get('/users', auth_1.authenticateToken, (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                error: 'Admin access required',
                message: 'This action requires admin privileges'
            });
        }
        const allUsers = Array.from(users.values()).map(user => ({
            id: user.id,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            zerodhaConnected: user.zerodhaConnected
        }));
        res.json({
            users: allUsers,
            count: allUsers.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to get users',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map