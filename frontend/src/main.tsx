import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

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
