import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
        },
        success: {
          style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
          iconTheme: { primary: '#22c55e', secondary: '#fff' }
        },
        error: {
          style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
          iconTheme: { primary: '#ef4444', secondary: '#fff' }
        },
        loading: {
          style: { background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' },
        }
      }}
    />
  </StrictMode>
)