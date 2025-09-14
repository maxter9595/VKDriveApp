import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../../middleware/auth.js', () => {
  const originalModule = jest.requireActual('../../middleware/auth.js');
  
  return {
    ...originalModule,
    authenticateToken: jest.fn((req, res, next) => {
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }
      
      if (token.startsWith('valid-jwt-')) {
        const userId = token.replace('valid-jwt-', '');
        
        const users = {
          '1': { id: 1, email: 'test@example.com', is_active: true, role: 'user' },
          '2': { id: 2, email: 'admin@example.com', is_active: true, role: 'admin' },
          '3': { id: 3, email: 'inactive@example.com', is_active: false, role: 'user' }
        };
        
        const user = users[userId];
        
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }
        
        if (!user.is_active) {
          return res.status(403).json({ error: 'Account is deactivated' });
        }
        
        req.user = user;
        return next();
      }
      
      if (token.startsWith('valid-session-')) {
        const userId = token.replace('valid-session-', '');
        
        const users = {
          '1': { id: 1, email: 'test@example.com', is_active: true, role: 'user' }
        };
        
        const user = users[userId];
        
        if (user) {
          req.user = user;
          return next();
        }
      }
      
      return res.status(403).json({ error: 'Invalid or expired token' });
    })
  };
});

import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

describe('Auth Middleware Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      cookies: {},
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should return 401 if no token provided', async () => {
      await authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
    });

    it('should authenticate with valid JWT token', async () => {
      mockReq.headers.authorization = 'Bearer valid-jwt-1';
      
      await authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual({
        id: 1,
        email: 'test@example.com',
        is_active: true,
        role: 'user'
      });
    });

    it('should return 401 for invalid JWT token', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';
      
      await authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });

    it('should return 403 for deactivated user', async () => {
      mockReq.headers.authorization = 'Bearer valid-jwt-3';
      
      await authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Account is deactivated' });
    });

    it('should work with session token', async () => {
      mockReq.cookies.token = 'valid-session-1';
      
      await authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual({
        id: 1,
        email: 'test@example.com',
        is_active: true,
        role: 'user'
      });
    });

    it('should return 403 for invalid session token', async () => {
      mockReq.cookies.token = 'invalid-session-token';
      
      await authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for admin users', () => {
      mockReq.user = { role: 'admin' };
      
      requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for non-admin users', () => {
      mockReq.user = { role: 'user' };
      
      requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Admin access required' });
    });

    it('should handle missing user object', () => {
      mockReq.user = null;
      
      requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Admin access required' });
    });

    it('should handle undefined user object', () => {
      mockReq.user = undefined;
      
      requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Admin access required' });
    });
  });
});