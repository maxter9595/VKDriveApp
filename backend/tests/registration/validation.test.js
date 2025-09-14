import { describe, it, expect } from '@jest/globals';

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

describe('Validation Tests', () => {
  describe('Registration Validation', () => {
    it('should validate correct registration data', () => {
      const errors = validateRegistration(
        'test@example.com',
        'Password123!',
        'John',
        'Doe'
      );
      
      expect(errors).toEqual({});
    });

    it('should detect missing firstName', () => {
      const errors = validateRegistration(
        'test@example.com',
        'Password123!',
        '',
        'Doe'
      );
      
      expect(errors.firstName).toBe('Имя обязательно для заполнения');
    });

    it('should detect invalid email format', () => {
      const errors = validateRegistration(
        'invalid-email',
        'Password123!',
        'John',
        'Doe'
      );
      
      expect(errors.email).toBe('Некорректный формат email');
    });

    it('should detect weak password', () => {
      const errors = validateRegistration(
        'test@example.com',
        'weak',
        'John',
        'Doe'
      );
      
      expect(errors.password).toBe('Пароль должен содержать минимум 8 символов');
    });

    it('should detect password without special characters', () => {
      const errors = validateRegistration(
        'test@example.com',
        'Password123',
        'John',
        'Doe'
      );
      
      expect(errors.password).toContain('специальные символы');
    });

    it('should detect invalid firstName characters', () => {
      const errors = validateRegistration(
        'test@example.com',
        'Password123!',
        'John123',
        'Doe'
      );
      
      expect(errors.firstName).toContain('только буквы');
    });
  });
});