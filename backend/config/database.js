import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

dotenv.config();

let connection;

export const initDatabase = async () => {
  try {
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'mysql',
        database: process.env.DB_NAME || 'vkdrive'
      });
      
      console.log('Connected to MySQL database');

    } catch (error) {
      if (error.code === 'ER_BAD_DB_ERROR') {
        console.log('Database not found, creating new database...');
        
        const tempConnection = await mysql.createConnection({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || 'mysql'
        });

        await tempConnection.execute(
          `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'vkdrive'}`
        );
        
        console.log('Database created successfully');
        
        connection = await mysql.createConnection({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || 'mysql',
          database: process.env.DB_NAME || 'vkdrive'
        });

        console.log('Connected to newly created database');
        
        await tempConnection.end();
      } else {
        throw error;
      }
    }

    await createTables();
    await createUsers();
    await cleanupExpiredSessions();
    
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

const createTables = async () => {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      vk_token VARCHAR(500) DEFAULT NULL,
      yandex_token VARCHAR(500) DEFAULT NULL,
      role ENUM('user', 'admin') DEFAULT 'user',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  const sessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token VARCHAR(500) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  try {
    await connection.execute(usersTable);
    await connection.execute(sessionsTable);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const createUsers = async () => {
  try {
    console.log('Running user initialization script...');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const sqlScriptPath = path.join(__dirname, '..', 'sql', 'init-users.sql');

    try {
      const sqlScript = await fs.readFile(sqlScriptPath, 'utf8');
      const queries = sqlScript.split(';').filter(query => query.trim());

      for (const query of queries) {
        try {
          await connection.query(query.trim());
        } catch (error) {
          console.warn('Warning executing query:', error.message);
        }
      }

      console.log('User initialization script completed successfully');

    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('User initialization script not found, skipping');
      } else {
        console.error('Error reading user initialization script:', error);
      }
    }

  } catch (error) {
    console.error('Error in user initialization:', error);
  }
};

const cleanupExpiredSessions = async () => {
  try {
    const result = await connection.execute(
      'DELETE FROM sessions WHERE expires_at < NOW()'
    );
    console.log(`Cleaned up ${result[0].affectedRows} expired sessions`);
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('Sessions table does not exist yet, skipping cleanup');
    } else {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
};

export const encryptToken = (token) => {
  if (!token) return null;
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
};

export const decryptToken = (encryptedToken) => {
  if (!encryptedToken) return null;
  
  try {
    const [ivHex, encrypted] = encryptedToken.split(':');
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    return null;
  }
};

export const getConnection = () => {
  if (!connection) {
    throw new Error('Database not initialized');
  }
  return connection;
};
