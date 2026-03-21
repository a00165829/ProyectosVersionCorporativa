import { Configuration, PublicClientApplication, LogLevel } from '@azure/msal-browser'

const tenantId  = import.meta.env.VITE_AZURE_TENANT_ID  || 'placeholder'
const clientId  = import.meta.env.VITE_AZURE_CLIENT_ID  || 'placeholder'
const DEV_MODE  = tenantId === 'placeholder'

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii || !DEV_MODE) return
        if (level === LogLevel.Error) console.error(message)
      },
    },
  },
}

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
}

export const msalInstance = new PublicClientApplication(msalConfig)

export { DEV_MODE }
