import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const removeLoader = () => {
  if (typeof window !== 'undefined' && (window as unknown as Record<string, () => void>).__removeLoader) {
    (window as unknown as Record<string, () => void>).__removeLoader();
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

setTimeout(removeLoader, 500);
