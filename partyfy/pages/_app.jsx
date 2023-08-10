import Head from 'next/head';
import '../styles/globals.scss'
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
  <UserProvider>
    <Head>
      <meta name="application-name" content="PWA App" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Partyfy" />
      <meta name="description" content="Modify your friends's Spotify queue" />
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
      <meta name="twitter:description" content="Modify your friends's Spotify queue" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Partyfy" />
      <meta property="og:description" content="Modify your friends's Spotify queue" />
      <meta property="og:site_name" content="Partyfy" />
      <meta property="og:url" content="https://partfy.mattvandenberg.com" />
      <meta property="og:image" content="https://partfy.mattvandenberg.com/icon-512x512.png" />
    </Head>
    <Component {...pageProps} />
    <Analytics />
  </UserProvider>
  );
}