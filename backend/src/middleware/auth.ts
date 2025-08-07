import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getRow } from '../utils/database';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; userType: string };
    
    let user;
    if (decoded.userType === 'member') {
      user = await getRow('SELECT * FROM members WHERE id = ? AND is_active = 1', [decoded.userId]);
    } else {
      user = await getRow('SELECT * FROM users WHERE id = ? AND is_active = 1', [decoded.userId]);
    }
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Add userType and memberId to the user object
    user.userType = decoded.userType;
    if (decoded.userType === 'member') {
      user.memberId = user.id;
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    next();
  };
}; 