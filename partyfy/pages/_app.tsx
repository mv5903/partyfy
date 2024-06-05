import { UserProvider } from '@auth0/nextjs-auth0/client';
import { Analytics } from '@vercel/analytics/react';
import Head from 'next/head';
import { useEffect } from 'react';
import '../styles/globals.scss';

export default function App({ Component, pageProps }) {

  useEffect(() => {
    const handleError = (event) => {
      // Don't report errors in development, only in production
      if (window.location.href.includes("localhost")) {
        console.log("Error Logger: Skipping error report in development mode.");
        return;
      }

      fetch('/api/reportError', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: event.message,
          source: event.filename + ", Stack: " + event.error.stack,
          lineno: event.lineno,
          colno: event.colno,
          userAgent: navigator.userAgent
        })
      }).catch(console.error);
    };

    const handlePromiseRejection = (event) => {
      if (window.location.href.includes("localhost")) {
        console.log("Error Logger: Skipping error report in development mode.");
        return;
      }

      fetch('/api/reportError', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: event.reason ? event.reason.message : 'Unhandled promise rejection',
          source: event.reason ? event.reason.stack : null,
          userAgent: navigator.userAgent
        })
      }).catch(console.error);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, []);

  return (
  <UserProvider>
    <Head>
      <meta name="application-name" content="Partyfy" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Partyfy" />
      <meta name="description" content="Add songs to your friend's Spotify queue remotely." />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-config" content="/icons/browserconfig.xml" />
      <meta name="msapplication-TileColor" content="#2B5797" />
      <meta name="msapplication-tap-highlight" content="no" />
      <meta name="theme-color" content="#000000" />

      <link rel="apple-touch-icon" href="/public/icon-512x512.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/public/icon-152x152.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/public/icon-180x180.png" />

      <link rel="manifest" href="/manifest.json" />
      <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#5bbad5" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:url" content="https://partfy.mattvandenberg.com" />
      <meta name="twitter:title" content="Partyfy" />
      <meta name="twitter:description" content="Add songs to your friend's Spotify queue remotely." />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Partyfy" />
      <meta property="og:description" content="Add songs to your friend's Spotify queue remotely." />
      <meta property="og:site_name" content="Partyfy" />
      <meta property="og:url" content="https://partfy.mattvandenberg.com" />
      <meta property="og:image" content="https://partfy.mattvandenberg.com/icon-512x512.png" />
    </Head>
    <Component {...pageProps} />
    <Analytics />
  </UserProvider>
  );
}