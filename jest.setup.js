// jest-dom adds custom jest matchers for asserting on DOM nodes
// See: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// window関連のモックはブラウザ環境でのみ実行
if (typeof window !== 'undefined') {
  // Mock window.matchMedia - needed for responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock URL methods
  if (typeof URL.createObjectURL === 'undefined') {
    Object.defineProperty(URL, 'createObjectURL', {
      value: jest.fn(() => 'mock-url')
    });
  }
  
  if (typeof URL.revokeObjectURL === 'undefined') {
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: jest.fn()
    });
  }
}