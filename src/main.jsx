import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts (Parkinsans, Instrument Serif, Space Mono) load from Google Fonts in index.html for now;
// switch to self-hosted @fontsource packages once they can be installed.
import './styles/tokens.css'
import './styles/base.css'
import './styles/typography.css'
import './styles/ui.css'
import './styles/blueprint.css'
import './firebase.js'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
