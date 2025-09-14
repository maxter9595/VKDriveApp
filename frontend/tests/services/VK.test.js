import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('VK Integration', () => {
  let originalDocument;
  let originalWindow;

  beforeEach(() => {
    originalDocument = global.document;
    originalWindow = global.window;

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    global.document = {
      createElement: jest.fn().mockReturnValue({
        src: '',
        remove: jest.fn()
      }),
      body: {
        appendChild: jest.fn(),
        lastChild: { remove: jest.fn() }
      }
    };
    
    global.window = {
      location: {
        href: '',
        assign: jest.fn(),
        replace: jest.fn()
      }
    };

    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };

    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    jest.resetAllMocks();
  });

  it('should get token from API', async () => {
    const mockToken = 'test-vk-token';
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ vkToken: mockToken })
    });

    const { VK } = await import('@api/services/integrations/VK');
    const token = await VK.getToken();

    expect(token).toBe(mockToken);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/tokens'),
      expect.any(Object)
    );
  });

  it('should handle token fetch errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    const { VK } = await import('@api/services/integrations/VK');
    const token = await VK.getToken();

    expect(token).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('should create script element for VK API call', async () => {
    const mockToken = 'test-token';
    const userId = '12345';
    const callback = jest.fn();

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ vkToken: mockToken })
    });

    const createElementSpy = jest.spyOn(document, 'createElement');
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    
    const mockScriptElement = {
      src: '',
      remove: jest.fn()
    };
    
    createElementSpy.mockReturnValue(mockScriptElement);

    const { VK } = await import('@api/services/integrations/VK');
    await VK.get(userId, callback);

    expect(createElementSpy).toHaveBeenCalledWith('script');
    expect(appendChildSpy).toHaveBeenCalledWith(mockScriptElement);
    expect(VK.lastCallback).toBe(callback);

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
  });

  it('should process VK API response correctly', async () => {
    const callback = jest.fn();
    const mockResponse = {
      response: {
        items: [
          {
            sizes: [
              { type: 's', url: 'small.jpg' },
              { type: 'm', url: 'medium.jpg' },
              { type: 'x', url: 'large.jpg' }
            ]
          }
        ]
      }
    };

    const scriptElement = document.createElement('script');
    scriptElement.remove = jest.fn();
    document.body.appendChild(scriptElement);

    const { VK } = await import('@api/services/integrations/VK');
    VK.lastCallback = callback;
    VK.processData(mockResponse);

    expect(callback).toHaveBeenCalledWith(['large.jpg']);
    expect(scriptElement.remove).toHaveBeenCalled();
  });

  it('should handle VK API errors', async () => {
    const originalAlert = global.alert;
    global.alert = jest.fn();

    const mockError = {
      error: {
        error_msg: 'Invalid token'
      }
    };

    const scriptElement = document.createElement('script');
    scriptElement.remove = jest.fn();
    document.body.appendChild(scriptElement);

    const { VK } = await import('@api/services/integrations/VK');
    VK.processData(mockError);

    expect(alert).toHaveBeenCalledWith(expect.stringContaining('Invalid token'));
    expect(scriptElement.remove).toHaveBeenCalled();

    global.alert = originalAlert;
  });
});
