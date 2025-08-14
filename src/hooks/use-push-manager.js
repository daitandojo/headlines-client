// src/hooks/use-push-manager.js (version 12.0)
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

  const checkSubscription = useCallback(async () => {
    try {
      // This now assumes the SW is registered by the layout and will be ready.
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
      return !!subscription
    } catch (error) {
      console.error('[PushManager] Error checking subscription:', error)
      setIsSubscribed(false)
      return false
    }
  }, [])

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    ) {
      setIsSupported(true)

      // The SW is registered in layout.js. We just wait for it to be ready.
      navigator.serviceWorker.ready
        .then((registration) => {
          console.log('[PushManager] Service Worker is ready, checking subscription.')
          checkSubscription().finally(() => setIsLoading(false))
        })
        .catch((error) => {
          console.error('[PushManager] Service worker failed to become ready:', error)
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [checkSubscription])

  const subscribe = useCallback(async () => {
    if (isSubscribed) {
      toast.info('You are already subscribed to notifications.')
      return
    }

    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready

      if (Notification.permission === 'denied') {
        throw new Error('Notification permission has been denied by the user.')
      }

      const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID public key not configured.')
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: { 'Content-Type': 'application/json' },
      })

      setIsSubscribed(true)
      toast.success('Notifications enabled!')
    } catch (error) {
      console.error('[PushManager] Subscription failed:', error)
      if (error.name === 'NotAllowedError') {
        toast.error('Permission for notifications was denied.')
      } else {
        toast.error('Failed to enable notifications.', { description: error.message })
      }
    } finally {
      setIsLoading(false)
    }
  }, [isSubscribed])

  return { isSupported, isSubscribed, isLoading, subscribe }
}
