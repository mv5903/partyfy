import { UserProvider } from '@auth0/nextjs-auth0/client';
import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import '../styles/globals.scss';
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  applicationName: 'Partyfy',
  title: 'Partyfy',
  description: 'Add songs to your friend\'s Spotify queue remotely.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Partyfy',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  themeColor: '#000000',
  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/public/icon-512x512.png' },
      { url: '/public/icon-152x152.png', sizes: '152x152' },
      { url: '/public/icon-180x180.png', sizes: '180x180' },
    ],
  },
  openGraph: {
    type: 'website',
    title: 'Partyfy',
    description: 'Add songs to your friend\'s Spotify queue remotely.',
    siteName: 'Partyfy',
    url: 'https://partfy.mattvandenberg.com',
    images: 'https://partfy.mattvandenberg.com/icon-512x512.png',
  },
  twitter: {
    card: 'summary',
    title: 'Partyfy',
    description: 'Add songs to your friend\'s Spotify queue remotely.',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="m-0 p-0 bg-black">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#5bbad5" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" />
      </head>
      <body className="m-0 p-0 bg-black">
        <UserProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ClientLayout>
              {children}
            </ClientLayout>
          </NextIntlClientProvider>
          <Analytics />
        </UserProvider>
      </body>
    </html>
  );
}
