import { handleAuth, handleLogin, handleCallback } from '@auth0/nextjs-auth0';

export default handleAuth({
  login: handleLogin({
    authorizationParams: {
      redirect_uri: (req) => {
        // Dynamically build the callback URL based on the request
        const protocol = req.headers['x-forwarded-proto'] || (req.connection.encrypted ? 'https' : 'http');
        const host = req.headers['x-forwarded-host'] || req.headers['host'];
        return `${protocol}://${host}/api/auth/callback`;
      }
    },
    returnTo: '/dashboard'
  }),
  callback: handleCallback({
    redirectUri: (req) => {
      // Use the same dynamic URL for the callback
      const protocol = req.headers['x-forwarded-proto'] || (req.connection.encrypted ? 'https' : 'http');
      const host = req.headers['x-forwarded-host'] || req.headers['host'];
      return `${protocol}://${host}/api/auth/callback`;
    }
  })
}); 
 