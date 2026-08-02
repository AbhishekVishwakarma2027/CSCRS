import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppProviders } from './app/providers'
import { AppRouter } from './app/router'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Ensure index.html has <div id="root" />.')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>
)
