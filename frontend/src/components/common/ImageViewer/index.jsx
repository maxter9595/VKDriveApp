import React from 'react';

export default class ImageViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      images: [],
      selectedImages: new Set(),
      previewImage: 'https://yugcleaning.ru/wp-content/themes/consultix/images/no-image-found-360x250.png',
      failedImages: new Set()
    };
  }

  clear = () => {
    this.setState({ 
      images: [], 
      selectedImages: new Set(),
      previewImage: 'https://yugcleaning.ru/wp-content/themes/consultix/images/no-image-found-360x250.png',
      failedImages: new Set()
    });
  }

  drawImages = (newImages) => {
    this.setState(prevState => ({
      images: [...prevState.images, ...newImages]
    }));
  }

  handleImageError = (index) => {
    this.setState(prevState => {
      const failedImages = new Set(prevState.failedImages);
      failedImages.add(index);
      return { failedImages };
    });
  }

  handleImageClick = (imageUrl, index) => {
    if (this.state.failedImages.has(index)) return;
    
    this.setState(prevState => {
      const selectedImages = new Set(prevState.selectedImages);
      if (selectedImages.has(index)) {
        selectedImages.delete(index);
      } else {
        selectedImages.add(index);
      }
      return { selectedImages };
    });
  }

  handleDoubleClick = (imageUrl, index) => {
    if (this.state.failedImages.has(index)) return;
    this.setState({ previewImage: imageUrl });
  }

  handleSelectAll = () => {
    const { images, selectedImages, failedImages } = this.state;
    
    const validIndices = images.map((_, index) => index)
      .filter(index => !failedImages.has(index));
    
    const allValidSelected = validIndices.every(index => selectedImages.has(index));
    
    this.setState({
      selectedImages: allValidSelected ? 
        new Set() : 
        new Set(validIndices)
    });
  }

  handleShowUploaded = () => {
    this.props.onShowUploaded();
  }

  handleSend = () => {
    const { images, selectedImages, failedImages } = this.state;
    
    const selectedUrls = Array.from(selectedImages)
      .filter(index => !failedImages.has(index))
      .map(index => images[index]);
    
    if (selectedUrls.length > 0) {
      this.props.onSendImages(selectedUrls);
    }
  }

  render() {
    const { images, selectedImages, previewImage, failedImages } = this.state;
    
    const validImagesCount = images.length - failedImages.size;
    const allSelected = selectedImages.size === validImagesCount && validImagesCount > 0;
    const someSelected = selectedImages.size > 0;
    const hasImages = images.length > 0;
    const hasValidImages = validImagesCount > 0;

    return (
      <section className="images-section">
        <h3 className="section-title">Изображения</h3>
        
        {hasImages ? (
          <>
            <div className="images-grid">
              {images.map((image, index) => {
                const isFailed = failedImages.has(index);
                const imageUrl = isFailed ? 
                  'https://yugcleaning.ru/wp-content/themes/consultix/images/no-image-found-360x250.png' : 
                  image;
                
                return (
                  <div 
                    key={index} 
                    className={`image-item ${selectedImages.has(index) ? 'selected' : ''} ${isFailed ? 'failed' : ''}`}
                    onClick={() => this.handleImageClick(image, index)}
                    onDoubleClick={() => this.handleDoubleClick(image, index)}
                    title={isFailed ? 'Изображение не загружено' : 'Двойной клик для предпросмотра'}
                  >
                    <img 
                      src={imageUrl} 
                      alt={`VK image ${index}`}
                      onError={() => this.handleImageError(index)}
                    />
                    {isFailed && (
                      <div className="image-error-overlay">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>Не загружено</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="images-actions">
              <button 
                className={`btn btn-secondary select-all ${!hasValidImages ? 'disabled' : ''}`}
                onClick={this.handleSelectAll}
                disabled={!hasValidImages}
              >
                <i className={`fas ${allSelected ? 'fa-times-circle' : 'fa-check-square'}`}></i>
                {allSelected ? 'Снять выделение' : 'Выбрать всё'}
              </button>
              <button 
                className="btn btn-secondary show-uploaded-files"
                onClick={this.handleShowUploaded}
              >
                <i className="fas fa-eye"></i> Посмотреть файлы
              </button>
              <button 
                className={`btn btn-primary send ${!someSelected ? 'disabled' : ''}`}
                onClick={this.handleSend}
                disabled={!someSelected}
              >
                <i className="fas fa-cloud-upload-alt"></i> Отправить на диск
              </button>
            </div>

            {failedImages.size > 0 && (
              <div className="images-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <span>Некоторые изображения не загрузились ({failedImages.size} из {images.length})</span>
              </div>
            )}
          </>
        ) : (
          <div className="no-images-message">
            <p>Не загружены изображения</p>
          </div>
        )}

        <section className="preview-section">
          <h3 className="section-title">Предпросмотр</h3>
          <div className="preview-image">
            <img src={previewImage} alt="Preview" />
          </div>
          {hasImages ? <p>Дважды кликните на изображение для предпросмотра</p> : ''}
        </section>
      </section>
    );
  }
}