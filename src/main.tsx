import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { ThemeProvider } from '@/hooks/useTheme';
import { BrandingProvider } from '@/hooks/useBranding';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <BrandingProvider>
          <App />
        </BrandingProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
