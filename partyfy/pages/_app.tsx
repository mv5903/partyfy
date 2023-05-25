import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.scss'
import type { AppProps } from 'next/app'
import { UserProvider } from '@auth0/nextjs-auth0/client'
import { StrictMode } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  return (
  <UserProvider>
    <StrictMode>
      <Component {...pageProps} />
    </StrictMode>
  </UserProvider>
  );
}