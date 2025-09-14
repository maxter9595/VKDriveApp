import React from 'react';

import BaseModal from '../BaseModal';
import { Yandex } from '@api/services/integrations/Yandex';

export default class PreviewModal extends BaseModal {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
      loading: false
    };
    this.previewModalRef = React.createRef();
  }

  getUploadedFiles = async (callback) => {
    try {
      const token = await Yandex.getToken();
      if (!token) {
        if (callback) callback(null, new Error('Токен не найден'));
        return;
      }

      const response = await fetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent('VKDrive')}&limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `OAuth ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка получения файлов: ${response.status}`);
      }

      const data = await response.json();
      
      const imageFiles = data._embedded.items.filter(item => 
        item.type === 'file' && 
        (item.mime_type?.startsWith('image/') || item.media_type === 'image')
      );
      
      if (callback) callback({ items: imageFiles });
      
    } catch (error) {
      console.error('Ошибка получения файлов:', error);
      if (callback) callback(null, error);
    }
  }

  showImages = (data) => {
    if (data && data.items) {
      this.setState({ files: data.items });
    } else {
      this.setState({ files: [] });
    }
  }

  formatDate = (date) => {
    const formattedDate = new Date(date);
    const options = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    };
    return formattedDate.toLocaleString('ru-RU', options);
  }

  formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  handleDelete = async (file, button) => {
    if (!confirm('Вы уверены, что хотите удалить этот файл?')) {
      return;
    }

    const icon = button.querySelector('i');
    const originalClass = icon.className;
    icon.className = 'fas fa-spinner fa-spin';
    button.classList.add('disabled');

    try {
      const token = await Yandex.getToken();
      if (!token) {
        throw new Error('Токен не найден');
      }

      const response = await fetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(`VKDrive/${file.name}`)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `OAuth ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка удаления: ${response.status}`);
      }

      this.setState(prevState => ({
        files: prevState.files.filter(f => f.name !== file.name)
      }));

      alert('Файл успешно удален');

    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert(`Ошибка удаления файла: ${error.message}`);
    } finally {
      icon.className = originalClass;
      button.classList.remove('disabled');
    }
  }

  handleDownload = async (file) => {
    try {
      const token = await Yandex.getToken();
      if (!token) {
        throw new Error('Токен не найден');
      }

      const response = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(`VKDrive/${file.name}`)}`, {
        method: 'GET',
        headers: {
          'Authorization': `OAuth ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка получения ссылки: ${response.status}`);
      }

      const data = await response.json();
      if (data.href) {
        window.open(data.href, '_blank');
      } else {
        alert('Ссылка для скачивания недоступна');
      }
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      alert(`Ошибка скачивания файла: ${error.message}`);
    }
  }

  refreshFiles = () => {
    this.setState({ loading: true });
    
    Yandex.getUploadedFiles((data, error) => {
      this.setState({ loading: false });
      if (error) {
        alert('Ошибка получения файлов из Яндекс.Диска: ' + '"' + error + '"');
      } else if (data) {
        this.showImages(data);
      }
    });
  }

  open() {
    super.open();
    this.refreshFiles();
  }

  render() {
    const { files, loading } = this.state;

    return (
      <div ref={this.domElement} className="modal uploaded-previewer-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">Просмотр файлов</h3>
            <div className="modal-header-actions">
              <button className="modal-close" onClick={() => this.close()}>
                <i className="fas fa-times"></i>
              </button>
              <button 
                className="btn btn-secondary refresh-btn"
                onClick={this.refreshFiles}
                disabled={loading}
              >
                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
                Обновить
              </button>
            </div>
          </div>
          <div className="modal-body content">
            {loading ? (
              <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Загрузка файлов из папки VKDrive...</p>
              </div>
            ) : files.length > 0 ? (
              <div className="files-grid">
                {files.map((file, index) => (
                  <div key={index} className="file-card">
                    <div className="file-preview">
                      {file.preview ? (
                        <img src={file.preview} alt={file.name} />
                      ) : (
                        <div className="no-preview">
                          <i className="fas fa-file-image"></i>
                          <span>Нет превью</span>
                        </div>
                      )}
                    </div>
                    <div className="file-info">
                      <h4 title={file.name}>{file.name}</h4>
                      <p>Создано: {this.formatDate(file.created)}</p>
                      <p>Размер: {this.formatFileSize(file.size)}</p>
                      <p>Тип: {file.mime_type}</p>
                    </div>
                    <div className="file-actions">
                      <button 
                        className="btn btn-danger delete-btn"
                        onClick={(e) => this.handleDelete(file, e.currentTarget)}
                        title="Удалить файл"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                      <button 
                        className="btn btn-success download-btn"
                        onClick={() => this.handleDownload(file)}
                        title="Скачать файл"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-files-message">
                <i className="fas fa-folder-open"></i>
                <p>Нет загруженных файлов в папке VKDrive</p>
                <small>Файлы должны быть в формате JPEG или PNG</small>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
