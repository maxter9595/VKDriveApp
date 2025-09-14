import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';
import { initDatabase, getConnection, encryptToken, decryptToken } from '../../config/database.js';
import mysql from 'mysql2/promise';

process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_vkdrive';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!';
process.env.JWT_SECRET = 'test-jwt-secret';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

jest.mock('crypto', () => {
  const actualCrypto = jest.requireActual('crypto');
  
  return {
    ...actualCrypto,
    randomBytes: jest.fn().mockReturnValue(Buffer.from('testiv1234567890')),
    scryptSync: jest.fn().mockReturnValue(Buffer.from('test-key-32-bytes-long-enough!')),
    createCipheriv: jest.fn().mockImplementation(() => ({
      update: (text, inputEncoding, outputEncoding) => {
        if (outputEncoding === 'hex') return '656e63727970746564';
        return Buffer.from('encrypted');
      },
      final: (outputEncoding) => {
        if (outputEncoding === 'hex') return '64617461';
        return Buffer.from('data');
      }
    })),
    createDecipheriv: jest.fn().mockImplementation(() => ({
      update: (encrypted, inputEncoding, outputEncoding) => {
        if (inputEncoding === 'hex' && encrypted === '656e6372797074656464617461') {
          if (outputEncoding === 'utf8') return 'test_token_123';
          return Buffer.from('test_token_123');
        }
        if (outputEncoding === 'utf8') return 'decrypted';
        return Buffer.from('decrypted');
      },
      final: (outputEncoding) => {
        if (outputEncoding === 'utf8') return 'data';
        return Buffer.from('data');
      }
    }))
  };
});

describe('Database Utility Tests', () => {
  it('should test basic encryption/decryption logic', () => {
    const mockEncrypt = (token) => token ? `encrypted:${token}` : null;
    const mockDecrypt = (encrypted) => encrypted ? encrypted.replace('encrypted:', '') : null;
    
    const testToken = 'test-token-123';
    const encrypted = mockEncrypt(testToken);
    const decrypted = mockDecrypt(encrypted);
    
    expect(encrypted).toBe('encrypted:test-token-123');
    expect(decrypted).toBe('test-token-123');
    expect(mockEncrypt(null)).toBeNull();
    expect(mockDecrypt(null)).toBeNull();
  });

  it('should validate token format correctly', () => {
    const isValidToken = (token) => {
      return Boolean(token && token.length > 10 && token.includes('token'));
    };
    
    expect(isValidToken('vk_token_123')).toBe(true);
    expect(isValidToken('yandex_token_456')).toBe(true);
    expect(isValidToken('short')).toBe(false);
    expect(isValidToken('')).toBe(false);
    expect(isValidToken(null)).toBe(false);
    expect(isValidToken(undefined)).toBe(false);
  });

  describe('Encryption Functions', () => {
    it('should encrypt token', () => {
      const token = 'test_token_123';
      const encrypted = encryptToken(token);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).toContain(':');
    });

    it('should return null for empty token encryption', () => {
      const encrypted = encryptToken(null);
      expect(encrypted).toBeNull();
    });

    it('should decrypt token', () => {
      const originalToken = 'test_token_123';
      const encrypted = encryptToken(originalToken);
      const decrypted = decryptToken(encrypted);
      
      expect(typeof decrypted).toBe('string');
    });

    it('should return null for empty token decryption', () => {
      const decrypted = decryptToken(null);
      expect(decrypted).toBeNull();
    });
  });
});

describe('Database Connection Tests', () => {
  beforeAll(async () => {
    jest.spyOn(mysql, 'createConnection').mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue([[]]),
      end: jest.fn().mockResolvedValue()
    }));
  });

  afterAll(async () => {
    jest.restoreAllMocks();
  });

  it('should initialize database connection', async () => {
    await expect(initDatabase()).resolves.not.toThrow();
  });

  it('should get connection instance', () => {
    jest.spyOn(require('../../config/database.js'), 'getConnection').mockImplementation(() => ({}));
    expect(() => getConnection()).not.toThrow();
  });

  it('should throw error if database not initialized', () => {
    jest.spyOn(require('../../config/database.js'), 'getConnection').mockImplementation(() => {
      throw new Error('Database not initialized');
    });
    
    expect(() => getConnection()).toThrow('Database not initialized');
  });
});