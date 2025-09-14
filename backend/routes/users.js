import express from 'express';
import bcrypt from 'bcryptjs';

import { getConnection } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', is_active } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    const connection = getConnection();
    
    let query = `
      SELECT id, email, first_name, last_name, role, is_active, created_at 
      FROM users 
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
    const params = [];
    const countParams = [];

    if (search) {
      query += ` AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR id = ?)`;
      countQuery += ` AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR id = ?)`;
      const searchParam = `%${search}%`;
      
      const isNumericSearch = !isNaN(search) && search.trim() !== '';
      
      params.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
      
      if (isNumericSearch) {
        params.push(parseInt(search));
        countParams.push(parseInt(search));
      } else {
        params.push(0);
        countParams.push(0);
      }
    }

    if (role) {
      query += ` AND role = ?`;
      countQuery += ` AND role = ?`;
      params.push(role);
      countParams.push(role);
    }

    if (is_active !== undefined) {
      query += ` AND is_active = ?`;
      countQuery += ` AND is_active = ?`;
      params.push(is_active === 'true');
      countParams.push(is_active === 'true');
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limitNum.toString(), offset.toString());

    const [users] = await connection.execute(query, params);
    const [countResult] = await connection.execute(countQuery, countParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limitNum);

    res.json({ 
      users, 
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'user' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
    }

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Неверная роль' });
    }

    const connection = getConnection();
    
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await connection.execute(
      'INSERT INTO users (email, password, first_name, last_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName, role, true]
    );

    res.status(201).json({
      message: 'Пользователь создан успешно',
      user: {
        id: result.insertId,
        email,
        firstName,
        lastName,
        role,
        is_active: true
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const connection = getConnection();
    await connection.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/active', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Invalid active status' });
    }

    const connection = getConnection();
    await connection.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [isActive, id]
    );

    if (!isActive) {
      await connection.execute(
        'DELETE FROM sessions WHERE user_id = ?',
        [id]
      );
    }

    res.json({ message: 'Active status updated successfully' });
  } catch (error) {
    console.error('Update active status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/sessions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const connection = getConnection();
    const [sessions] = await connection.execute(
      'SELECT id, token, expires_at, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC',
      [id]
    );
    
    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/sessions/:sessionId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const connection = getConnection();
    await connection.execute(
      'DELETE FROM sessions WHERE id = ?',
      [sessionId]
    );

    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const connection = getConnection();
    
    await connection.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
