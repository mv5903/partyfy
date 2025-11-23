'use client';

import PromotionalHeader from '@/components/misc/PromotionalHeader';
import { NavigationProgress } from '@/components/layout/NavigationProgress';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsMobileDevice(isMobile);

    const handleError = (event: ErrorEvent) => {
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

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
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

  if (isClient && !isMobileDevice) {
    return (
      <>
        <NavigationProgress />
        <div className='flex flex-col justify-center items-center mt-10 text-white'>
          <div className='flex justify-center'>
            <img className='object-center' src='/logo.png' width="200px" alt="Partyfy Logo" />
          </div>
          <h3 className="text-2xl m-4">Sorry, Partyfy is not available on desktop.</h3>
          <h2 className="text-2xl m-4 text-center"><i>Please use your mobile device to access the site.</i></h2>
          <PromotionalHeader />
        </div>
      </>
    );
  }

  return (
    <>
      <NavigationProgress />
      {children}
    </>
  );
}
