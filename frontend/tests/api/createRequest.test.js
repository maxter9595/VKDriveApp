import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

global.fetch = jest.fn();

describe('createRequest', () => {
  beforeEach(() => {
    localStorage.clear();
    fetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should make GET request with query parameters', async () => {
    const mockResponse = { data: 'test' };
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(mockResponse)
    });

    const { createRequest } = await import('@api/core/createRequest');
    const result = await createRequest({
      url: 'https://api.example.com/data',
      method: 'GET',
      data: { param1: 'value1', param2: 'value2' }
    });

    expect(result).toEqual(mockResponse);

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/data?param1=value1&param2=value2',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer null'
        })
      })
    );
  });

  it('should handle POST request with JSON data', async () => {
    const mockResponse = { success: true };
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(mockResponse)
    });

    const { createRequest } = await import('@api/core/createRequest');
    const postData = { name: 'test', value: 123 };
    const result = await createRequest({
      url: 'https://api.example.com/create',
      method: 'POST',
      data: postData
    });

    expect(result).toEqual(mockResponse);

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(postData),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
  });

  it('should handle authentication errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Invalid credentials')
    });

    const { createRequest } = await import('@api/core/createRequest');
    
    await expect(createRequest({
      url: 'https://api.example.com/protected',
      method: 'GET'
    })).rejects.toThrow('Некорректные учетные данные');
  });

  it('should handle user deactivation errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Account is deactivated')
    });

    const { createRequest } = await import('@api/core/createRequest');
    
    await expect(createRequest({
      url: 'https://api.example.com/protected',
      method: 'GET'
    })).rejects.toThrow('Пользователь деактивирован');
  });
});