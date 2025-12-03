'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import '@/styles/nprogress-custom.css';

/**
 * NavigationProgress component
 * Shows a loading bar at the top of the screen during navigation
 * Pages with skeleton loaders should be added to EXCLUDED_ROUTES
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Routes that use skeleton loaders instead of the top loading bar
  const EXCLUDED_ROUTES = ['/dashboard'];

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
    // Skip loading bar for excluded routes
    if (EXCLUDED_ROUTES.includes(pathname)) {
      return;
    }

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
