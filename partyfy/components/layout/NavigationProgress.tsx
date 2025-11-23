'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import '@/styles/nprogress-custom.css';

/**
 * NavigationProgress component
 * Shows a loading bar at the top of the screen during navigation
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Configure NProgress
    NProgress.configure({
      showSpinner: false, // Hide the spinner, just show the bar
      speed: 300,
      minimum: 0.08,
      trickleSpeed: 200,
    });
  }, []);

  useEffect(() => {
    // Start the progress bar when navigation starts
    NProgress.start();

    // Complete the progress bar after a short delay
    // This ensures the bar shows even for fast navigations
    const timer = setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  return null;
}
