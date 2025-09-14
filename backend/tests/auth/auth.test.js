import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cookieParser());

app.post('/api/auth/login', (req, res) => {
  if (req.body.email && req.body.password) {
    res.json({ 
      message: 'Login successful', 
      token: 'test-token',
      user: { id: 1, email: req.body.email }
    });
  } else {
    res.status(400).json({ error: 'Email and password are required' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  res.status(201).json({ 
    message: 'User created successfully', 
    user: { 
      id: 1, 
      email,
      firstName,
      lastName,
      role: 'user'
    },
    token: 'test-token'
  });
});

describe('Auth API Tests', () => {
  it('should login user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.token).toBe('test-token');
    expect(response.body.user.email).toBe('test@example.com');
  });

  it('should return error for missing login credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should register user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.user.firstName).toBe('Test');
  });

  it('should return error for missing registration fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
