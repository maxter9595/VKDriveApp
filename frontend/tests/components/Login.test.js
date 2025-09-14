import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('@api/core/createRequest', () => ({
  createRequest: jest.fn()
}));

describe('Login Component', () => {
  let LoginComponent;
  let mockOnLogin;

  beforeEach(async () => {
    mockOnLogin = jest.fn();
    const { default: Login } = await import('@components/auth/Login');
    LoginComponent = Login;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render login form', () => {
    render(<LoginComponent onLogin={mockOnLogin} />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const mockResponse = {
      token: 'test-token',
      user: { id: 1, email: 'test@example.com' }
    };

    const { createRequest } = await import('@api/core/createRequest');
    createRequest.mockResolvedValue(mockResponse);

    render(<LoginComponent onLogin={mockOnLogin} />);

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(createRequest).toHaveBeenCalledWith({
        url: expect.stringContaining('/api/auth/login'),
        method: 'POST',
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      });
      expect(mockOnLogin).toHaveBeenCalledWith(mockResponse.user);
    });
  });

  it('should display error message on login failure', async () => {
    const { createRequest } = await import('@api/core/createRequest');
    createRequest.mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginComponent onLogin={mockOnLogin} />);

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: 'wrongpassword' }
    });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    render(<LoginComponent onLogin={mockOnLogin} />);

    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    expect(screen.getByPlaceholderText('Email')).toBeInvalid();
    expect(screen.getByPlaceholderText('Пароль')).toBeInvalid();
  });
});
