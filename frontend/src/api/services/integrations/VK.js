import { getApiBaseUrl } from '@utils/env';

const API_BASE_URL = getApiBaseUrl();

export class VK {
  static lastCallback;

  static async getToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/tokens`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return null;
        }
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.vkToken) {
        return data.vkToken;
      } else {
        throw new Error('Токен не найден в базе данных');
      }
    } catch (error) {
      console.error('Ошибка получения токена:', error);
      return null;
    }
  }
  
  static async get(id = '', callback) {
    this.lastCallback = callback;
    
    try {
      const ACCESS_TOKEN = await this.getToken();
      if (!ACCESS_TOKEN) {
        alert('Токен VK не найден. Пожалуйста, введите токены в настройках.');
        return;
      }

      let script = document.createElement('script');
      script.src = `https://api.vk.com/method/photos.get?owner_id=${id}&album_id=profile&access_token=${ACCESS_TOKEN}&v=5.199&callback=VK.processData`;

      document.body.appendChild(script);
    } catch (error) {
      alert(`Ошибка получения токена: ${error.message}`);
    }
  }

  static processData(result) {
    document.body.lastChild.remove();

    if (result.error) {
      alert(`Ошибка ответа на запрос VK: "${result.error.error_msg}"`);

    } else {
      const imageList = result.response.items;

      if (imageList.length > 0) {
        const imageSizeRange = ['s', 'm', 'x', 'o', 'p', 'q', 'r', 'y', 'z', 'w'];
        const maxSizeImagesUrls = [];

        imageList.forEach(image => {
          image.sizes.sort((a, b) => imageSizeRange.indexOf(b.type) - imageSizeRange.indexOf(a.type));
          maxSizeImagesUrls.push(image.sizes[0].url);
        });

        this.lastCallback(maxSizeImagesUrls);
        this.lastCallback = () => {};
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.VK = {
    processData: (result) => VK.processData(result)
  };
}
