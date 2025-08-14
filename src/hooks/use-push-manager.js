// src/hooks/use-push-manager.js (version 9.0)
'use client'

import { useState, useCallback } from 'react'
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
  const [permission, setPermission] = useState('default')

  const initialize = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    ) {
      setIsSupported(true)
      setPermission(Notification.permission)
      // Just check for an existing subscription without blocking.
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.pushManager.getSubscription().then((sub) => {
            if (sub) {
              setIsSubscribed(true)
            }
          })
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const handleSubscription = useCallback(async () => {
    // This function now contains the entire flow, initiated by user click.
    if (!isSupported) {
      toast.error('Push notifications are not supported on this browser.')
      return
    }

    setIsLoading(true)

    try {
      console.log('[PushManager] Awaiting service worker readiness...')
      const registration = await navigator.serviceWorker.ready
      console.log('[PushManager] Service worker is ready.')

      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        toast.info('You are already subscribed to notifications.')
        setIsSubscribed(true)
        setIsLoading(false)
        return
      }

      if (Notification.permission === 'denied') {
        toast.error('Notifications blocked.', {
          description: 'Please enable notifications in your browser settings.',
        })
        setIsLoading(false)
        return
      }

      console.log('[PushManager] Requesting subscription...')
      const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID public key not found.')
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      console.log('[PushManager] Subscription successful on client:', subscription)

      console.log('[PushManager] Sending subscription to server...')
      await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: { 'Content-Type': 'application/json' },
      })
      console.log('[PushManager] Subscription saved on server.')

      setIsSubscribed(true)
      setPermission('granted')
      toast.success('Notifications enabled!')
    } catch (error) {
      console.error('[PushManager] Full subscription flow failed:', error)
      setIsSubscribed(false)
      if (error.name === 'NotAllowedError') {
        toast.error('Permission for notifications was denied.')
        setPermission('denied')
      } else {
        toast.error('Failed to enable notifications.', { description: error.message })
      }
    } finally {
      // This is the key to fixing the perpetual spinner.
      setIsLoading(false)
      console.log('[PushManager] Subscription flow finished.')
    }
  }, [isSupported])

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    handleSubscription,
    initialize,
  }
}
