import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('@api/core/createRequest', () => ({
  createRequest: jest.fn()
}));

describe('Register Component', () => {
  let RegisterComponent;
  let mockOnRegister;

  beforeEach(async () => {
    mockOnRegister = jest.fn();
    const { default: Register } = await import('@components/auth/Register');
    RegisterComponent = Register;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render registration form with all fields', () => {
    render(<RegisterComponent onRegister={mockOnRegister} />);
    
    expect(screen.getByPlaceholderText('Имя *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Фамилия *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Подтверждение пароля *')).toBeInTheDocument();
  });

  it('should render registration form with all fields', () => {
    render(<RegisterComponent onRegister={mockOnRegister} />);
    
    expect(screen.getByPlaceholderText('Имя *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Фамилия *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Подтверждение пароля *')).toBeInTheDocument();
  });

  it('should validate name and surname format', async () => {
    render(<RegisterComponent onRegister={mockOnRegister} />);

    const nameInput = screen.getByPlaceholderText('Имя *');
    const surnameInput = screen.getByPlaceholderText('Фамилия *');
    const emailInput = screen.getByPlaceholderText('Email *');
    const passwordInput = screen.getByPlaceholderText('Пароль *');
    const confirmPasswordInput = screen.getByPlaceholderText('Подтверждение пароля *');

    fireEvent.change(nameInput, { target: { value: '12231' } });
    fireEvent.change(surnameInput, { target: { value: '13233' } });
    fireEvent.change(emailInput, { target: { value: 'max.t95@bk.ru' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });

    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    await waitFor(() => {
      expect(screen.getByText('Имя должно содержать только буквы и быть от 1 до 3000 символов'))
        .toBeInTheDocument();
      
      expect(screen.getByText('Фамилия должна содержать только буквы и быть от 1 до 3000 символов'))
        .toBeInTheDocument();
    });

    expect(nameInput).toHaveClass('error');
    expect(surnameInput).toHaveClass('error');
  });

  it('should validate email format', async () => {
    render(<RegisterComponent onRegister={mockOnRegister} />);

    fireEvent.change(screen.getByPlaceholderText('Имя *'), {
      target: { value: 'Maxim' }
    });
    fireEvent.change(screen.getByPlaceholderText('Фамилия *'), {
      target: { value: 'Terletskii' }
    });
    fireEvent.change(screen.getByPlaceholderText('Email *'), {
      target: { value: 'invalid-email@m' }
    });
    fireEvent.change(screen.getByPlaceholderText('Пароль *'), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByPlaceholderText('Подтверждение пароля *'), {
      target: { value: 'Password123!' }
    });

    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    await waitFor(() => {
      const errorElements = document.querySelectorAll('.field-error');
      const hasEmailError = Array.from(errorElements).some(el => 
        el.textContent.includes('корректный email') || 
        el.textContent.includes('Введите корректный email адрес')
      );
      expect(hasEmailError).toBe(true);
    });
  });

  it('should validate password confirmation', async () => {
    render(<RegisterComponent onRegister={mockOnRegister} />);

    fireEvent.change(screen.getByPlaceholderText('Имя *'), {
      target: { value: 'Maxim' }
    });
    fireEvent.change(screen.getByPlaceholderText('Фамилия *'), {
      target: { value: 'Terletskii' }
    });
    fireEvent.change(screen.getByPlaceholderText('Email *'), {
      target: { value: 'max.t95@bk.ru' }
    });
    fireEvent.change(screen.getByPlaceholderText('Пароль *'), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByPlaceholderText('Подтверждение пароля *'), {
      target: { value: 'Different123!' }
    });

    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    await waitFor(() => {
      const errorElements = document.querySelectorAll('.field-error');
      const hasConfirmPasswordError = Array.from(errorElements).some(el => 
        el.textContent.includes('Пароли не совпадают')
      );
      expect(hasConfirmPasswordError).toBe(true);
    });
  });

  it('should handle successful registration', async () => {
    const mockResponse = {
      token: 'test-token',
      user: { 
        id: 1, 
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
    };

    const { createRequest } = await import('@api/core/createRequest');
    createRequest.mockResolvedValue(mockResponse);

    render(<RegisterComponent onRegister={mockOnRegister} />);

    fireEvent.change(screen.getByPlaceholderText('Имя *'), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByPlaceholderText('Фамилия *'), {
      target: { value: 'User' }
    });
    fireEvent.change(screen.getByPlaceholderText('Email *'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Пароль *'), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByPlaceholderText('Подтверждение пароля *'), {
      target: { value: 'Password123!' }
    });

    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    await waitFor(() => {
      expect(createRequest).toHaveBeenCalledWith({
        url: expect.stringContaining('/api/auth/register'),
        method: 'POST',
        data: {
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        }
      });
      expect(mockOnRegister).toHaveBeenCalledWith(mockResponse.user);
    });
  });
});
