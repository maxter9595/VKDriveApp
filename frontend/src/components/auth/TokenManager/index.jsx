import React from 'react';

import { getApiBaseUrl } from '@utils/env';
import { createRequest } from '@api/core/createRequest';

const API_BASE_URL = getApiBaseUrl();

export default class TokenManager extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      vkToken: '',
      yandexToken: '',
      loading: false,
      message: '',
      error: ''
    };
  }

  async componentDidMount() {
    await this.loadTokens();
  }

  loadTokens = async () => {
    try {
      const response = await createRequest({
        url: `${API_BASE_URL}/api/auth/tokens`,
        method: 'GET'
      });

      if (response) {
        this.setState({
          vkToken: response.vkToken || '',
          yandexToken: response.yandexToken || ''
        });
        
        if (!response.vkToken && !response.yandexToken) {
          this.setState({ 
            message: '',
            error: 'Токены не найдены. Пожалуйста, введите их ниже.' 
          });
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки токенов:', error);
      if (error.message.includes('Требуется аутентификация')) {
        this.setState({ 
          error: 'Требуется авторизация. Пожалуйста, войдите снова.' 
        });
      }
    }
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ loading: true, error: '', message: '' });

    try {
      const response = await createRequest({
        url: `${API_BASE_URL}/api/auth/tokens`,
        method: 'POST',
        data: {
          vkToken: this.state.vkToken,
          yandexToken: this.state.yandexToken
        }
      });

      if (response) {
        this.setState({ 
          message: 'Токены успешно сохранены',
          error: '' 
        });
        
        localStorage.removeItem('VK_TOKEN');
        localStorage.removeItem('YANDEX_TOKEN');
      }
    } catch (error) {
      this.setState({ 
        error: error.message || 'Ошибка сохранения токенов',
        message: '' 
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { vkToken, yandexToken, loading, message, error } = this.state;

    return (
      <div className="token-manager">
        <h3>Управление токенами</h3>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={this.handleSubmit} className="token-form">
          <div className="form-group">
            <label htmlFor="vkToken">Токен VK:</label>
            <input
              type="password"
              id="vkToken"
              value={vkToken}
              onChange={(e) => this.setState({ vkToken: e.target.value })}
              placeholder="Введите токен VK"
            />
            <small>
              <a href="https://vk.com/dev/access_token" target="_blank" rel="noopener noreferrer">
                Как получить токен VK?
              </a>
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="yandexToken">Токен Яндекс.Диска:</label>
            <input
              type="password"
              id="yandexToken"
              value={yandexToken}
              onChange={(e) => this.setState({ yandexToken: e.target.value })}
              placeholder="Введите токен Яндекс.Диска"
            />
            <small>
              <a href="https://yandex.ru/dev/id/doc/dg/oauth/concepts/about.html" target="_blank" rel="noopener noreferrer">
                Как получить токен Яндекс.Диска?
              </a>
            </small>
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить токены'}
          </button>
        </form>
      </div>
    );
  }
}
