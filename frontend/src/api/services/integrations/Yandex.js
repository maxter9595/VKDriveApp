import { getApiBaseUrl } from '@utils/env';

const API_BASE_URL = getApiBaseUrl();

export class Yandex {
  static HOST = 'https://cloud-api.yandex.net/v1/disk';
  static FOLDER = 'VKDrive';

  static async getToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/tokens`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
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
      
      if (data && data.yandexToken) {
        return data.yandexToken;
      } else {
        throw new Error('Токен Яндекс.Диска не найден в базе данных');
      }
    } catch (error) {
      console.error('Ошибка получения токена:', error);
      return null;
    }
  }

  static async createFolder(callback) {
    try {
      const token = await this.getToken();
      if (!token) {
        if (callback) callback(null, new Error('Токен не найден'));
        return;
      }

      this.checkFolderExists((exists, error) => {
        if (error) {
          console.error('Ошибка проверки папки:', error);
          this.createFolderRequest((createResult, createError) => {
            if (createError) {
              console.error('Ошибка создания папки:', createError);
              if (callback) callback(null, createError);
            } else {
              if (callback) callback({ success: true, created: true });
            }
          });
        } else if (exists) {
          if (callback) callback({ success: true, created: false });
        } else {
          this.createFolderRequest(callback);
        }
      });
    
    } catch (error) {
      console.error('Ошибка создания папки:', error);
      if (callback) callback(null, error);
    }
  }

  static checkFolderExists(callback) {
    this.getToken().then(token => {
      if (!token) {
        if (callback) callback(false, new Error('Токен не найден'));
        return;
      }

      fetch(`${this.HOST}/resources?path=${encodeURIComponent(this.FOLDER)}`, {
        method: 'GET',
        headers: {
          'Authorization': `OAuth ${token}`,
          'Accept': 'application/json'
        }
      })
      .then(response => {
        if (response.status === 200) {
          if (callback) callback(true);
        } else if (response.status === 404) {
          if (callback) callback(false);
        } else {
          throw new Error(`HTTP error: ${response.status}`);
        }
      })
      .catch(error => {
        console.error('Ошибка проверки папки:', error);
        if (callback) callback(false, error);
      });
    }).catch(error => {
      if (callback) callback(false, error);
    });
  }

  static createFolderRequest(callback) {
    this.getToken().then(token => {
      if (!token) {
        if (callback) callback(null, new Error('Токен не найден'));
        return;
      }

      fetch(`${this.HOST}/resources?path=${encodeURIComponent(this.FOLDER)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `OAuth ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(`Ошибка создания папки: ${response.status} - ${text}`);
          });
        }
        return response.json();
      })
      .then(result => {
        if (callback) callback(result);
      })
      .catch(error => {
        console.error('Ошибка создания папки:', error);
        if (callback) callback(null, error);
      });
    });
  }

  static getUploadUrl(path, callback) {
    this.getToken().then(token => {
      if (!token) {
        if (callback) callback(null, new Error('Токен не найден'));
        return;
      }
      
      fetch(`${this.HOST}/resources/upload?path=${encodeURIComponent(path)}&overwrite=true`, {
        method: 'GET',
        headers: {
          'Authorization': `OAuth ${token}`,
          'Accept': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Ошибка получения URL: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (callback) callback(data);
      })
      .catch(error => {
        console.error('Ошибка получения URL:', error);
        if (callback) callback(null, error);
      });
    });
  }

  static uploadFileFromUrl(fileName, vkUrl, callback) {
    this.createFolder((folderResult, folderError) => {
      if (folderError) {
        console.error('Ошибка создания папки:', folderError);
        if (callback) callback(null, folderError);
        return;
      }

      fetch(vkUrl, { method: 'HEAD' })
        .then(response => {
          const mimeType = response.headers.get('content-type') || 'image/jpeg';
          const cleanFileName = this.ensureImageExtension(fileName, mimeType);
          const path = `${this.FOLDER}/${cleanFileName}`;
          
          this.getUploadUrl(path, (uploadData, uploadError) => {
            if (uploadError) {
              console.error('Ошибка получения URL:', uploadError);
              if (callback) callback(null, uploadError);
              return;
            }

            if (uploadData && uploadData.href) {
              this.uploadToYandex(uploadData.href, vkUrl, cleanFileName, callback);
            } else if (callback) {
              callback(null, new Error('Не удалось получить URL для загрузки'));
            }
          });
        })
        .catch(error => {
          console.error('Ошибка получения информации о файле:', error);
          const cleanFileName = this.ensureImageExtension(fileName);
          const path = `${this.FOLDER}/${cleanFileName}`;
          
          this.getUploadUrl(path, (uploadData, uploadError) => {
            if (uploadError) {
              console.error('Ошибка получения URL:', uploadError);
              if (callback) callback(null, uploadError);
              return;
            }

            if (uploadData && uploadData.href) {
              this.uploadToYandex(uploadData.href, vkUrl, cleanFileName, callback);
            } else if (callback) {
              callback(null, new Error('Не удалось получить URL для загрузки'));
            }
          });
        });
    });
  }

  static ensureImageExtension(fileName, mimeType = 'image/jpeg') {
    if (fileName.toLowerCase().endsWith('.jpg') || 
        fileName.toLowerCase().endsWith('.jpeg') || 
        fileName.toLowerCase().endsWith('.png')) {
      return fileName;
    }
    
    if (mimeType === 'image/jpeg') {
      return `${fileName}.jpg`;
    } else if (mimeType === 'image/png') {
      return `${fileName}.png`;
    } else {
      return `${fileName}.jpg`;
    }
  }

  static uploadToYandex(uploadUrl, vkUrl, fileName, callback) {
    fetch(vkUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Ошибка загрузки файла с VK: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        return fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': blob.type,
          },
          body: blob
        });
      })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(`Ошибка загрузки на Яндекс.Диск: ${response.status} - ${text}`);
          });
        }
        return response;
      })
      .then(() => {
        if (callback) callback({ success: true, fileName: fileName });
      })
      .catch(error => {
        console.error('Ошибка загрузки:', error);
        if (callback) callback(null, error);
      });
  }

  static removeFile(path, callback) {
    this.getToken().then(token => {
      if (!token) {
        if (callback) callback(null, new Error('Токен не найден'));
        return;
      }

      const encodedPath = encodeURIComponent(path);
      
      fetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${encodedPath}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `OAuth ${token}`,
          'Accept': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Ошибка удаления: ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        if (callback) callback(result);
      })
      .catch(error => {
        console.error('Ошибка удаления:', error);
        if (callback) callback(null, error);
      });
    });
  }
  
  static getUploadedFiles(callback) {
    this.getToken().then(token => {
      if (!token) {
        if (callback) callback(null, new Error('Токен не найден'));
        return;
      }

      this.createFolder((folderResult, folderError) => {
        if (folderError) {
          console.error('Ошибка с папкой:', folderError);
          if (callback) callback(null, folderError);
          return;
        }

        fetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(this.FOLDER)}&limit=100`, {
          method: 'GET',
          headers: {
            'Authorization': `OAuth ${token}`,
            'Accept': 'application/json'
          }
        })
        .then(response => {
          if (response.status === 404) {
            return { _embedded: { items: [] } };
          } else if (!response.ok) {
            throw new Error(`Ошибка получения файлов: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const imageFiles = data._embedded?.items?.filter(item => 
            item.type === 'file' && 
            (item.mime_type?.startsWith('image/') || item.media_type === 'image')
          ) || [];
          
          if (callback) callback({ items: imageFiles });
        })
        .catch(error => {
          console.error('Ошибка получения файлов:', error);
          if (callback) callback(null, error);
        });
      });
    });
  }

  static downloadFileByUrl(url) {
    window.open(url, '_blank');
  }
}