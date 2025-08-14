// src/components/ServiceWorkerRegistrar.jsx (version 2.0)
'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

/**
 * A client-side component dedicated to registering the service worker.
 * It renders nothing and runs its logic in a useEffect hook.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          console.log('[SW] Attempting to register service worker...')

          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          })

          console.log(
            '[SW] Service Worker registered successfully with scope:',
            registration.scope
          )

          // Listen for updates to the service worker.
          registration.addEventListener('updatefound', () => {
            console.log('[SW] A new service worker version has been found.')
            const newWorker = registration.installing

            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log(
                  '[SW] New service worker is installed and ready. Notifying user.'
                )
                toast.info('A new version of the app is available!', {
                  action: {
                    label: 'Refresh',
                    onClick: () => window.location.reload(),
                  },
                  duration: 10000,
                })
              }
            })
          })
        } catch (error) {
          console.error('[SW] Service Worker registration failed:', error)
          toast.error('Could not initialize background features.', {
            description: 'Please try refreshing the page.',
          })
        }
      }

      // Register after the page has loaded to avoid blocking initial render.
      window.addEventListener('load', registerServiceWorker)
    }
  }, [])

  return null // This component does not render any UI.
}
