// src/hooks/use-push-manager.js (version 7.0)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [swRegistration, setSwRegistration] = useState(null)

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    ) {
      console.log('[PushManager] Browser supports Service Workers and Push.')
      setIsSupported(true)

      const initializePushManager = async () => {
        setIsLoading(true)
        console.log(
          '[PushManager] Initializing. Waiting for service worker to become active...'
        )

        try {
          const registration = await navigator.serviceWorker.ready

          console.log('[PushManager] Service Worker is active and ready:', registration)
          setSwRegistration(registration)

          const subscription = await registration.pushManager.getSubscription()
          console.log('[PushManager] Initial subscription state:', subscription)
          setIsSubscribed(!!subscription)
        } catch (error) {
          console.error('[PushManager] Initialization failed:', error)
          toast.error('Notification service failed to start.', {
            description:
              'This can happen on first launch. Please try refreshing the app.',
          })
          setIsSupported(false)
        } finally {
          setIsLoading(false)
          console.log('[PushManager] Initialization finished.')
        }
      }

      initializePushManager()
    } else {
      console.log('[PushManager] Browser does not support Service Workers or Push.')
      setIsSupported(false)
      setIsLoading(false)
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!swRegistration) {
      toast.error('Notification service not ready.', {
        description:
          'The background service is still starting. Please try again in a moment.',
      })
      return false
    }

    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!VAPID_PUBLIC_KEY) {
      toast.error('Push notifications are not configured.')
      console.error(
        '[PushManager] VAPID public key is missing from environment variables.'
      )
      return false
    }

    if (Notification.permission === 'denied') {
      toast.error('Notification permission has been denied.', {
        description:
          'You must enable notifications for this site in your browser settings.',
      })
      return false
    }

    setIsLoading(true)
    try {
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      console.log('[PushManager] New subscription created:', subscription)

      await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: { 'Content-Type': 'application/json' },
      })
      console.log('[PushManager] Subscription sent to server.')

      setIsSubscribed(true)
      toast.success('Notifications enabled!')
      return true
    } catch (error) {
      console.error('[PushManager] Full subscription error object:', error)

      let errorMessage = 'An unexpected error occurred.'
      if (error instanceof Error) {
        errorMessage = `${error.name}: ${error.message}`
      }

      if (error.name === 'NotAllowedError') {
        toast.error('Permission denied.', {
          description: 'You did not grant permission for notifications.',
        })
      } else {
        toast.error('Failed to enable notifications.', { description: errorMessage })
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }, [swRegistration])

  return { isSupported, isSubscribed, isLoading, subscribe }
}
