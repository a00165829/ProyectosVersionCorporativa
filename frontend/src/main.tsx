import React from 'react'
import ReactDOM from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance, DEV_MODE } from './lib/msal'
import App from './App'
import './index.css'

async function start() {
  if (!DEV_MODE) {
    await msalInstance.initialize()
    await msalInstance.handleRedirectPromise()
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      {DEV_MODE ? (
        <App />
      ) : (
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      )}
    </React.StrictMode>
  )
}

start()