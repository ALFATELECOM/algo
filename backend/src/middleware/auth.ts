import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// JWT Authentication Middleware
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user'
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Invalid token',
      message: 'The provided token is invalid or expired'
    });
  }
};

// Admin Role Middleware
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

// Generate JWT Token
export const generateToken = (payload: { id: string; email: string; role?: string }): string => {
  const jwtSecret = process.env.JWT_SECRET || 'your-default-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  
  return jwt.sign(payload, jwtSecret, { expiresIn });
};

// Verify JWT Token
export const verifyToken = (token: string): any => {
  const jwtSecret = process.env.JWT_SECRET || 'your-default-secret-key';
  return jwt.verify(token, jwtSecret);
};

// Optional Authentication (doesn't fail if no token)
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-default-secret-key';
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'user'
      };
    } catch (error) {
      // Continue without user if token is invalid
      req.user = undefined;
    }
  }

  next();
};
