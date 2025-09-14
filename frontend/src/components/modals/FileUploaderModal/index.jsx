import BaseModal from '../BaseModal';
import { Yandex } from '@api/services/integrations/Yandex';

class FileUploaderModal extends BaseModal {
  constructor(props) {
    super(props);
    this.state = {
      images: [],
      loading: false,
      uploadComplete: false,
      uploadingSingleFile: false
    };
  }

  showImages = (images) => {
    this.setState({ 
      images: [...images].reverse(),
      uploadComplete: false
    });
    this.open();
  }

  sendAllImages = () => {
    const { images } = this.state;
    this.setState({ loading: true, uploadComplete: false }, () => {
      this.uploadFilesSequentially(images, 0, () => {
        this.setState({ 
          loading: false,
          uploadComplete: true
        });
      });
    });
  }

  uploadFilesSequentially = (images, index, completeCallback) => {
    if (index >= images.length) {
      if (completeCallback) completeCallback();
      return;
    }

    this.sendImage(images[index], () => {
      setTimeout(() => {
        this.uploadFilesSequentially(images, index + 1, completeCallback);
      }, 500);
    });
  }

  sendImage = (imageUrl, callback) => {
    this.setState({ uploadingSingleFile: true });

    const timestamp = new Date().getTime();
    const defaultName = `photo_${timestamp}`;
    
    Yandex.uploadFileFromUrl(defaultName, imageUrl, (result, error) => {
      if (error) {
        console.error('Ошибка загрузки:', error);
        
        let errorMessage = error.message;
        if (errorMessage.includes('409')) {
          errorMessage = 'Файл с таким именем уже существует. Измените имя файла.';
        } else if (errorMessage.includes('404')) {
          errorMessage = 'Папка не существует. Попробуйте снова.';
        } else if (errorMessage.includes('400')) {
          errorMessage = 'Неверный запрос. Проверьте параметры.';
        }
        alert(`Ошибка отправки фотографии в хранилище Яндекс.Диска: "${errorMessage}"`);
      } else {
        this.setState(prevState => ({
          images: prevState.images.filter(img => img !== imageUrl)
        }));

        if (this.state.images.length === 1) {
          this.setState({ uploadComplete: true });
        } else if (this.state.images.length === 0) {
          this.close();
        }
      }
      
      this.setState({ uploadingSingleFile: false });
      if (callback) callback();
    });
  }

  handleInputClick = (e) => {
    e.target.classList.remove('error');
  }

  handleClose = () => {
    if (!this.state.loading && !this.state.uploadingSingleFile) {
      this.close();
    }
  }

  render() {
    const { images, loading, uploadComplete, uploadingSingleFile } = this.state;

    return (
      <div ref={this.domElement} className="modal file-uploader-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">Загрузка файлов</h3>
          </div>
          <div className="modal-body content">
            {uploadComplete && images.length === 0 && (
              <div className="upload-success-message">
                <div className="success-icon">✓</div>
                <p>Загрузка файлов завершена!</p>
              </div>
            )}

            <div className="upload-preview-grid">
              {images.map((image, index) => (
                <div key={index} className="image-preview-container">
                  <img src={image} alt={`Preview ${index}`} />
                  <div className="ui action input">
                    <input 
                      type="text" 
                      placeholder="Имя файла" 
                      defaultValue={`photo_${new Date().getTime()}_${index}`}
                      onClick={this.handleInputClick}
                    />
                    <button 
                      className="ui button" 
                      onClick={() => this.sendImage(image)}
                      disabled={loading}
                    >
                      <i className="upload icon"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button 
              className={`btn btn-secondary ${loading || uploadingSingleFile ? 'disabled' : ''}`} 
              disabled={loading || uploadingSingleFile}
              onClick={this.handleClose}
            >
              {loading || uploadingSingleFile ? (
                <div className="custom-spinner" />
              ) : (
                'Закрыть'
              )}
            </button>
            <button 
              className={`btn btn-primary send-all ${loading || uploadingSingleFile ? 'disabled' : ''}`}
              onClick={this.sendAllImages}
              disabled={loading || uploadingSingleFile || images.length === 0}
            >
              {loading ? (
                <>
                  Загрузка...
                </>
              ) : (
                'Отправить все файлы'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default FileUploaderModal;
