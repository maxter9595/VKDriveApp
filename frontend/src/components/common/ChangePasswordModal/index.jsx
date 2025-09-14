import React from 'react';
import ReactDOM from 'react-dom';

export default class ChangePasswordModal extends React.Component {
  constructor(props) {
    super(props);
    this.container = document.createElement('div');
    this.state = {
      newPassword: '',
      confirmPassword: '',
      errors: {},
      loading: false
    };
  }

  componentDidMount() {
    document.body.appendChild(this.container);
  }

  componentWillUnmount() {
    document.body.removeChild(this.container);
  }

  validateForm = () => {
    const errors = {};
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!this.state.newPassword) {
      errors.newPassword = 'Пароль обязателен';
    } else if (this.state.newPassword.length < 8) {
      errors.newPassword = 'Пароль должен содержать минимум 8 символов';
    } else if (!passwordRegex.test(this.state.newPassword)) {
      errors.newPassword = 'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы';
    }

    if (!this.state.confirmPassword) {
      errors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (this.state.newPassword !== this.state.confirmPassword) {
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
      await this.props.onSubmit(this.state.newPassword);
      this.setState({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
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
    const { user, onCancel } = this.props;

    return ReactDOM.createPortal(
      <div className="modal-overlay active">
        <div className="modal active change-password-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Смена пароля для пользователя № {user.id}</h3>
              <button 
                className="modal-close"
                onClick={onCancel}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={this.handleSubmit} className="modal-form change-password-form">
              <div className="modal-body">
                <div className="password-requirements">
                  <p><strong>Требования к паролю:</strong></p>
                  <ul>
                    <li>Минимум 8 символов</li>
                    <li>Заглавные и строчные буквы</li>
                    <li>Цифры</li>
                    <li>Специальные символы (@$!%*?&)</li>
                  </ul>
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">Новый пароль *</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={this.state.newPassword}
                    onChange={(e) => this.handleInputChange('newPassword', e.target.value)}
                    className={errors.newPassword ? 'error' : ''}
                    placeholder="Введите новый пароль"
                  />
                  {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Подтверждение пароля *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={this.state.confirmPassword}
                    onChange={(e) => this.handleInputChange('confirmPassword', e.target.value)}
                    className={errors.confirmPassword ? 'error' : ''}
                    placeholder="Подтвердите новый пароль"
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Сохранение...' : 'Сохранить пароль'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>,
      this.container
    );
  }
}