import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeAuth } from './hooks/useAuth';

initializeAuth();

window.addEventListener('error', (event) => {
  console.log('Global error caught:', event.error);
  if (event.error?.stack) {
    console.log('Stack trace:', event.error.stack);
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

