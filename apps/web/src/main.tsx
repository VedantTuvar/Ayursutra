import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './shared/api/queryClient';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Toast popup notifications wrapper */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass-panel text-slate-800 border border-slate-100 rounded-2xl shadow-xl',
          style: {
            padding: '12px 18px',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: 'Outfit, Inter, sans-serif'
          },
          success: {
            iconTheme: {
              primary: '#0f766e',
              secondary: '#ffffff'
            }
          },
          error: {
            iconTheme: {
              primary: '#e11d48',
              secondary: '#ffffff'
            }
          }
        }}
      />
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
