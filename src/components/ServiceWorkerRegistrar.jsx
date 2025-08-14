// src/components/ServiceWorkerRegistrar.jsx (version 3.0)
'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

/**
 * A client-side component dedicated to registering the service worker.
 * It now also ensures the service worker takes control immediately.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          console.log('[SW Registrar] Attempting to register service worker...')
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          })
          console.log('[SW Registrar] Registration successful:', registration)

          registration.addEventListener('updatefound', () => {
            console.log('[SW Registrar] New service worker version found.')
            const newWorker = registration.installing
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW Registrar] New worker installed. Notifying user.')
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

          // Ensure the current service worker is active and controlling the page
          if (navigator.serviceWorker.controller) {
            console.log('[SW Registrar] Service worker is already controlling the page.')
          } else {
            console.log(
              '[SW Registrar] No controller, page may have been loaded before SW activation.'
            )
          }
        } catch (error) {
          console.error('[SW Registrar] Registration failed:', error)
          toast.error('Could not initialize background features.')
        }
      }
      window.addEventListener('load', registerServiceWorker)
    }
  }, [])

  return null
}
