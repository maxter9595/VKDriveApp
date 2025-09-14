import React from 'react';

export default class CreateAdminForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      errors: {},
      loading: false
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
      errors.email = 'Email обязателен';
    } else if (!emailRegex.test(this.state.email)) {
      errors.email = 'Некорректный формат email';
    }

    if (!this.state.password) {
      errors.password = 'Пароль обязателен';
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

    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!this.validateForm()) {
      return;
    }

    this.setState({ loading: true });

    try {
      await this.props.onSubmit({
        email: this.state.email,
        password: this.state.password,
        firstName: this.state.firstName,
        lastName: this.state.lastName,
        role: 'admin'
      });
    } catch (error) {
      console.error('Error creating admin:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  handleInputChange = (field, value) => {
    this.setState({ 
      [field]: value,
      errors: {
        ...this.state.errors,
        [field]: ''
      }
    });
  };

  render() {
    const { errors, loading } = this.state;

    return (
      <form onSubmit={this.handleSubmit} className="create-admin-form">

        <div className="form-info">
          <p><strong>Порядок заполнения:</strong></p>
          <p className="password-requirements">
            Пароль должен содержать: минимум 8 символов, заглавные и строчные буквы, цифры и специальные символы (@$!%*?&)
          </p>
        </div>

        <div className="form-group">
          <label>Имя *</label>
          <input
            type="text"
            value={this.state.firstName}
            onChange={(e) => this.handleInputChange('firstName', e.target.value)}
            className={errors.firstName ? 'error' : ''}
          />
          {errors.firstName && <span className="error-text">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label>Фамилия *</label>
          <input
            type="text"
            value={this.state.lastName}
            onChange={(e) => this.handleInputChange('lastName', e.target.value)}
            className={errors.lastName ? 'error' : ''}
          />
          {errors.lastName && <span className="error-text">{errors.lastName}</span>}
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={this.state.email}
            onChange={(e) => this.handleInputChange('email', e.target.value)}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label>Пароль *</label>
          <input
            type="password"
            value={this.state.password}
            onChange={(e) => this.handleInputChange('password', e.target.value)}
            className={errors.password ? 'error' : ''}
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label>Подтверждение пароля *</label>
          <input
            type="password"
            value={this.state.confirmPassword}
            onChange={(e) => this.handleInputChange('confirmPassword', e.target.value)}
            className={errors.confirmPassword ? 'error' : ''}
          />
          {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Создание...' : 'Создать администратора'}
          </button>
          <button
            type="button"
            onClick={this.props.onCancel}
            className="btn btn-secondary"
          >
            Отмена
          </button>
        </div>
      </form>
    );
  }
}