import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#12121a',
              color: '#fff',
              border: '1px solid #1e1e2e',
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
