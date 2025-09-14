import '@testing-library/jest-dom';
import './__mocks__/env';

const originalError = console.error;
const originalWarn = console.warn;

process.env.SERVER_URL = 'http://localhost:3001';

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

global.localStorage = localStorageMock;

global.window.alert = jest.fn();
global.window.confirm = jest.fn();
global.window.open = jest.fn();

global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

global.importMeta = {
  env: {
    SERVER_URL: 'http://localhost:3001'
  }
};

const originalLocation = window.location;

beforeAll(() => {
  delete window.location;
  
  window.location = {
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    toString: () => 'http://localhost',
    origin: 'http://localhost',
    protocol: 'http:',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    pathname: '/',
    search: '',
    hash: ''
  };
});

afterAll(() => {
  window.location = originalLocation;
});

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    
    if (
      message.includes('Not implemented: navigation') ||
      message.includes('ReactDOMTestUtils.act is deprecated') ||
      message.includes('Ошибка выполнения HTTP-запроса') ||
      message.includes('Warning: `ReactDOMTestUtils.act`')
    ) {
      return;
    }
    
    originalError(...args);
  });
});

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    
    if (message.includes('ReactDOMTestUtils.act is deprecated')) {
      return;
    }
    
    originalWarn(...args);
  });
});

afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});