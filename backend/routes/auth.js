import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { authenticateToken } from '../middleware/auth.js';
import { getConnection, decryptToken, encryptToken } from '../config/database.js';

const router = express.Router();

const validateRegistration = (email, password, firstName, lastName) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-']{2,50}$/;

  if (!firstName || !firstName.trim()) {
    errors.firstName = 'Имя обязательно для заполнения';
  } else if (!nameRegex.test(firstName)) {
    errors.firstName = 'Имя должно содержать только буквы и быть от 2 до 50 символов';
  }

  if (!lastName || !lastName.trim()) {
    errors.lastName = 'Фамилия обязательна для заполнения';
  } else if (!nameRegex.test(lastName)) {
    errors.lastName = 'Фамилия должна содержать только буквы и быть от 2 до 50 символов';
  }

  if (!email || !email.trim()) {
    errors.email = 'Email обязателен для заполнения';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Некорректный формат email';
  }

  if (!password) {
    errors.password = 'Пароль обязателен для заполнения';
  } else if (password.length < 8) {
    errors.password = 'Пароль должен содержать минимум 8 символов';
  } else if (!passwordRegex.test(password)) {
    errors.password = 'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы';
  }

  return errors;
};

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Имя и фамилия обязательны для заполнения'
      });
    }

    const validationErrors = validateRegistration(email, password, firstName, lastName);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ 
        error: 'Ошибка валидации',
        validationErrors 
      });
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
      'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, firstName.trim(), lastName.trim()]
    );

    const token = jwt.sign(
      { userId: result.insertId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await connection.execute(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [result.insertId, token, expiresAt]
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: 'Пользователь успешно создан',
      user: {
        id: result.insertId,
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'user'
      },
      token: token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const connection = getConnection();
    
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const sessionToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await connection.execute(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, sessionToken, expiresAt]
    );

    res.cookie('token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token: sessionToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const connection = getConnection();
      await connection.execute(
        'DELETE FROM sessions WHERE token = ?',
        [token]
      );
    }

    res.clearCookie('token');
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const connection = getConnection();
    
    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/tokens', authenticateToken, async (req, res) => {
  try {
    const { vkToken, yandexToken } = req.body;
    const userId = req.user.id;

    const encryptedVkToken = encryptToken(vkToken);
    const encryptedYandexToken = encryptToken(yandexToken);

    const connection = getConnection();
    await connection.execute(
      'UPDATE users SET vk_token = ?, yandex_token = ? WHERE id = ?',
      [encryptedVkToken, encryptedYandexToken, userId]
    );

    res.json({ message: 'Токены успешно сохранены' });
  } catch (error) {
    console.error('Token save error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tokens', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const connection = getConnection();
    const [users] = await connection.execute(
      'SELECT vk_token, yandex_token FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const decryptedVkToken = decryptToken(user.vk_token);
    const decryptedYandexToken = decryptToken(user.yandex_token);

    res.json({
      vkToken: decryptedVkToken,
      yandexToken: decryptedYandexToken
    });
  } catch (error) {
    console.error('Token fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
