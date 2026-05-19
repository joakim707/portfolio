import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.addEventListener('error', event => {
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:16px;background:#1a0000;border-bottom:3px solid #ff3c6e;color:#ff3c6e;font-family:monospace;font-size:12px;white-space:pre-wrap;z-index:99999;max-height:40vh;overflow:auto;'
  el.textContent = `ERROR: ${event.message}\n${event.filename}:${event.lineno}:${event.colno}\n\n${event.error?.stack ?? ''}`
  document.body.appendChild(el)
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
