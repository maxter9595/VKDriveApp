import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Yandex Integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    global.window = {
      open: jest.fn(),
      location: {
        href: ''
      }
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should get Yandex token from API', async () => {
    const mockToken = 'test-yandex-token';
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ yandexToken: mockToken })
    });

    const { Yandex } = await import('@api/services/integrations/Yandex');
    const token = await Yandex.getToken();

    expect(token).toBe(mockToken);
  });

  it('should create folder on Yandex Disk', async () => {
    const mockToken = 'test-token';
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({})
    });

    const { Yandex } = await import('@api/services/integrations/Yandex');
    
    Yandex.getToken = jest.fn().mockResolvedValue(mockToken);

    const callback = jest.fn();
    await Yandex.createFolder(callback);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("https://cloud-api.yandex.net/v1/disk/resources?path=VKDrive"),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': `OAuth ${mockToken}`
        })
      })
    );
  });

  it('should handle file extension based on MIME type', async () => {
    const { Yandex } = await import('@api/services/integrations/Yandex');
    
    expect(Yandex.ensureImageExtension('photo', 'image/jpeg')).toBe('photo.jpg');
    expect(Yandex.ensureImageExtension('photo', 'image/png')).toBe('photo.png');
    expect(Yandex.ensureImageExtension('photo.jpg', 'image/jpeg')).toBe('photo.jpg');
    expect(Yandex.ensureImageExtension('photo')).toBe('photo.jpg');
  });
});
