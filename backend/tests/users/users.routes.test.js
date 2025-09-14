import { describe, it, expect, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

jest.mock('../../config/database.js', () => ({
  getConnection: jest.fn().mockReturnValue({
    execute: jest.fn()
  })
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/api/users', async (req, res) => {
  try {
    const { getConnection } = require('../../config/database.js');
    const connection = getConnection();
    
    const [users] = await connection.execute('SELECT id, email, first_name, last_name, role, is_active, created_at FROM users');
    
    const usersWithStringDates = users.map(user => ({
      ...user,
      created_at: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at
    }));
    
    res.json({
      users: usersWithStringDates,
      pagination: {
        page: 1,
        limit: 10,
        total: users.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;
  
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
  }
  
  try {
    const { getConnection } = require('../../config/database.js');
    const connection = getConnection();
    
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const [result] = await connection.execute(
      'INSERT INTO users (email, password, first_name, last_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName, role || 'user', true]
    );
    
    res.status(201).json({
      message: 'Пользователь создан успешно',
      user: {
        id: result.insertId,
        email,
        firstName,
        lastName,
        role: role || 'user',
        is_active: true
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

describe('Users API Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get users list', async () => {
    const mockDate = new Date('2023-01-01T00:00:00.000Z');
    const mockUsers = [
      { 
        id: 1, 
        email: 'user1@example.com', 
        first_name: 'User', 
        last_name: 'One', 
        role: 'user', 
        is_active: true, 
        created_at: mockDate
      }
    ];
    
    const { getConnection } = require('../../config/database.js');
    getConnection().execute.mockResolvedValueOnce([mockUsers]);
    
    const response = await request(app).get('/api/users');
    
    expect(response.status).toBe(200);
    expect(response.body.users[0].created_at).toBe(mockDate.toISOString());
    expect(response.body.pagination).toBeDefined();
  });

  it('should create new user successfully', async () => {
    const mockInsertResult = { insertId: 2 };
    
    const { getConnection } = require('../../config/database.js');
    getConnection().execute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([mockInsertResult]);
    
    const userData = {
      email: 'newuser@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
      role: 'user'
    };
    
    const response = await request(app)
      .post('/api/users')
      .send(userData);
    
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Пользователь создан успешно');
    expect(response.body.user.email).toBe(userData.email);
  });

  it('should return error for missing required fields', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Все поля обязательны для заполнения');
  });

  it('should return error for duplicate email', async () => {
    const existingUser = [{ id: 1 }];
    
    const { getConnection } = require('../../config/database.js');
    getConnection().execute.mockResolvedValueOnce([existingUser]);
    
    const userData = {
      email: 'existing@example.com',
      password: 'Password123!',
      firstName: 'Existing',
      lastName: 'User'
    };
    
    const response = await request(app)
      .post('/api/users')
      .send(userData);
    
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Пользователь с таким email уже существует');
  });

  it('should handle server errors', async () => {
    const { getConnection } = require('../../config/database.js');
    getConnection().execute.mockRejectedValueOnce(new Error('Database error'));
    
    const response = await request(app).get('/api/users');
    
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });
});
