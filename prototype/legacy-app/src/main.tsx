// Ensure window.fetch is writable if modified by sandbox or extensions
try {
  let _currentFetch = window.fetch ? window.fetch.bind(window) : undefined;
  Object.defineProperty(window, 'fetch', {
    get: () => _currentFetch,
    set: (fn) => {
      _currentFetch = fn;
    },
    configurable: true,
    enumerable: true,
  });
} catch {
  // Ignore
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

