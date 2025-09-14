import React from 'react';

import { getApiBaseUrl } from '@utils/env';
import { createRequest } from '@api/core/createRequest';

const API_BASE_URL = getApiBaseUrl();

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      error: '',
      loading: false
    };
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ loading: true, error: '' });

    try {
      const response = await createRequest({
        url: `${API_BASE_URL}/api/auth/login`,
        method: 'POST',
        data: {
          email: this.state.email,
          password: this.state.password
        }
      });

      if (response) {
        localStorage.setItem('token', response.token);
        this.props.onLogin(response.user);
      }
    } catch (error) {
      this.setState({ error: error.message || 'Ошибка входа' });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    return (
      <div className="auth-container">
        <form onSubmit={this.handleSubmit} className="auth-form auth-form-login">
          <h2>Вход в систему</h2>
          {this.state.error && <div className="error-message">{this.state.error}</div>}
          <input
            type="email"
            placeholder="Email"
            value={this.state.email}
            onChange={(e) => this.setState({ email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={this.state.password}
            onChange={(e) => this.setState({ password: e.target.value })}
            required
          />
          <button type="submit" disabled={this.state.loading}>
            {this.state.loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    );
  }
}
