import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Inject Vercel Analytics on the client in production builds
if (import.meta.env.PROD) {
  import('@vercel/analytics').then(({ inject }) => {
    try {
      inject();
    } catch {}
  }).catch(() => {});
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
