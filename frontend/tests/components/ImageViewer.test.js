import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

describe('ImageViewer Component', () => {
  let ImageViewerComponent;
  let mockOnShowUploaded;
  let mockOnSendImages;

  beforeEach(async () => {
    mockOnShowUploaded = jest.fn();
    mockOnSendImages = jest.fn();
    
    jest.mock('@utils/env', () => ({
      getApiBaseUrl: () => process.env.SERVER_URL || 'http://localhost:3001'
    }));

    const { default: ImageViewer } = await import('@components/common/ImageViewer');
    ImageViewerComponent = ImageViewer;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render empty state when no images', () => {
    render(
      <ImageViewerComponent 
        onShowUploaded={mockOnShowUploaded}
        onSendImages={mockOnSendImages}
      />
    );
    
    expect(screen.getByText('Не загружены изображения')).toBeInTheDocument();
    expect(screen.getByText('Изображения')).toBeInTheDocument();
  });

  it('should display section titles', () => {
    render(
      <ImageViewerComponent 
        onShowUploaded={mockOnShowUploaded}
        onSendImages={mockOnSendImages}
      />
    );
    
    expect(screen.getByText('Изображения')).toBeInTheDocument();
    expect(screen.getByText('Предпросмотр')).toBeInTheDocument();
  });
});