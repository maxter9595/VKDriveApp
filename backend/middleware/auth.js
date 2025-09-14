import jwt from 'jsonwebtoken';

import { getConnection } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    if (token.length > 100) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        const connection = getConnection();
        const [users] = await connection.execute(
          'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ?',
          [decoded.userId]
        );

        if (users.length === 0) {
          return res.status(401).json({ error: 'User not found' });
        }

        const user = users[0];
        
        if (!user.is_active) {
          return res.status(403).json({ error: 'Account is deactivated' });
        }

        req.user = user;
        return next();
      } catch (jwtError) {
        console.log('JWT verification failed, trying session token:', jwtError);
      }
    }

    const connection = getConnection();
    const [sessions] = await connection.execute(
      'SELECT user_id, expires_at FROM sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ?',
      [sessions[0].user_id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];
    
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
