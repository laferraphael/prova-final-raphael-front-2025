import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react'

const onRedirectCallback = (appState) => {
  const returnTo = appState?.returnTo || window.location.pathname;
  window.history.replaceState({}, document.title, returnTo);
};

const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || "dev-n7ewnwbo2a24rkxj.us.auth0.com",
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || "qaOuvFe8qNLxNWwjjc6KwvqKtIKw8TYd",
  authorizationParams: {
    redirect_uri: window.location.origin,
    response_type: "code",
    scope: "openid profile email",
  },
  useRefreshTokens: false,
  cacheLocation: "memory",
  onRedirectCallback: onRedirectCallback
};

// Só adiciona audience se estiver configurado
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
if (audience) {
  auth0Config.authorizationParams.audience = audience;
}

createRoot(document.getElementById('root')).render(
  <Auth0Provider {...auth0Config}>
    <App />
  </Auth0Provider>,
)
