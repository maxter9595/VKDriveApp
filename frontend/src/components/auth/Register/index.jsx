import React from 'react';

import { getApiBaseUrl } from '@utils/env';
import { createRequest } from '@api/core/createRequest';

const API_BASE_URL = getApiBaseUrl();

export default class Register extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      error: '',
      loading: false,
      validationErrors: {}
    };
  }

  validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-']{1,3000}$/;

    if (!this.state.firstName.trim()) {
      errors.firstName = 'Имя обязательно для заполнения';
    } else if (!nameRegex.test(this.state.firstName)) {
      errors.firstName = 'Имя должно содержать только буквы и быть от 1 до 3000 символов';
    }

    if (!this.state.lastName.trim()) {
      errors.lastName = 'Фамилия обязательна для заполнения';
    } else if (!nameRegex.test(this.state.lastName)) {
      errors.lastName = 'Фамилия должна содержать только буквы и быть от 1 до 3000 символов';
    }

    if (!this.state.email.trim()) {
      errors.email = 'Email обязателен для заполнения';
    } else if (!emailRegex.test(this.state.email)) {
      errors.email = 'Введите корректный email адрес';
    }

    if (!this.state.password) {
      errors.password = 'Пароль обязателен для заполнения';
    } else if (this.state.password.length < 8) {
      errors.password = 'Пароль должен содержать минимум 8 символов';
    } else if (!passwordRegex.test(this.state.password)) {
      errors.password = 'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы (@$!%*?&)';
    }

    if (!this.state.confirmPassword) {
      errors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (this.state.password !== this.state.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
    }

    this.setState({ validationErrors: errors });
    return Object.keys(errors).length === 0;
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!this.validateForm()) {
      return;
    }

    this.setState({ loading: true, error: '' });

    try {
      const response = await createRequest({
        url: `${API_BASE_URL}/api/auth/register`,
        method: 'POST',
        data: {
          email: this.state.email,
          password: this.state.password,
          firstName: this.state.firstName.trim(),
          lastName: this.state.lastName.trim()
        }
      });

      if (response) {
        localStorage.setItem('token', response.token);
        this.props.onRegister(response.user);
      }
    } catch (error) {
      try {
        const errorData = JSON.parse(error.message.replace('Ошибка HTTP: 400 . ', ''));
        if (errorData.validationErrors) {
          this.setState({ 
            validationErrors: errorData.validationErrors,
            error: errorData.error
          });
        } else {
          this.setState({ 
            error: errorData.error || error.message,
            validationErrors: {}
          });
        }
      } catch (parseError) {
        console.error('Error parsing error message:', parseError);
        this.setState({ 
          error: error.message || 'Ошибка регистрации',
          validationErrors: {}
        });
      }
    } finally {
      this.setState({ loading: false });
    }
  };

  handleInputChange = (field, value) => {
    this.setState({ 
      [field]: value,
      validationErrors: {
        ...this.state.validationErrors,
        [field]: ''
      }
    });
  };

  render() {
    const { validationErrors } = this.state;

    return (
      <div className="auth-container">
        <form onSubmit={this.handleSubmit} className="auth-form auth-form-register">
          <h2>Регистрация</h2>
          
          <div className="form-info">
            <p><strong>Порядок заполнения:</strong></p>
            <p className="password-requirements">
              Пароль должен содержать: минимум 8 символов, заглавные и строчные буквы, цифры и специальные символы (@$!%*?&)
              <br /><br />
              * – обязательные поля
            </p>
          </div>

          {this.state.error && <div className="error-message">{this.state.error}</div>}
          
          <div className="form-group">
            <input
              type="text"
              placeholder="Имя *"
              value={this.state.firstName}
              onChange={(e) => this.handleInputChange('firstName', e.target.value)}
              className={validationErrors.firstName ? 'error' : ''}
              required
            />
            {validationErrors.firstName && (
              <span className="field-error">{validationErrors.firstName}</span>
            )}
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="Фамилия *"
              value={this.state.lastName}
              onChange={(e) => this.handleInputChange('lastName', e.target.value)}
              className={validationErrors.lastName ? 'error' : ''}
              required
            />
            {validationErrors.lastName && (
              <span className="field-error">{validationErrors.lastName}</span>
            )}
          </div>

          <div className="form-group">
            <input
              type="email"
              placeholder="Email *"
              value={this.state.email}
              onChange={(e) => this.handleInputChange('email', e.target.value)}
              className={validationErrors.email ? 'error' : ''}
              required
            />
            {validationErrors.email && (
              <span className="field-error">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Пароль *"
              value={this.state.password}
              onChange={(e) => this.handleInputChange('password', e.target.value)}
              className={validationErrors.password ? 'error' : ''}
              required
            />
            {validationErrors.password && (
              <span className="field-error">{validationErrors.password}</span>
            )}
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Подтверждение пароля *"
              value={this.state.confirmPassword}
              onChange={(e) => this.handleInputChange('confirmPassword', e.target.value)}
              className={validationErrors.confirmPassword ? 'error' : ''}
              required
            />
            {validationErrors.confirmPassword && (
              <span className="field-error">{validationErrors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" disabled={this.state.loading} className="btn-primary">
            {this.state.loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    );
  }
}
