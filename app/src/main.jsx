import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyMotion, applyTheme, storedMotion, storedTheme } from './lib/themes'
import { loadSession } from './lib/session'

// Apply the saved theme before the first paint so there is no flash (sign-in is always the default theme).
applyTheme(loadSession() ? storedTheme() : 'system')
applyMotion(storedMotion())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
