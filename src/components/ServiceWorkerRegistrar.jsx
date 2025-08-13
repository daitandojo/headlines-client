// src/components/ServiceWorkerRegistrar.jsx (version 1.0)
"use client";

import { useEffect } from 'react';

/**
 * A client-side component dedicated to registering the service worker.
 * It renders nothing and runs its logic in a useEffect hook.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    // Ensure this runs only in the browser
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register the service worker after the page has loaded
      // to avoid contention for resources.
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
          .catch((error) => console.error('Service Worker registration failed:', error));
      });
    }
  }, []);

  return null; // This component does not render any UI.
}