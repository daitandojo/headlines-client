// src/hooks/use-push-manager.js (version 8.0)
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
  const [permission, setPermission] = useState('default')
  const [swRegistration, setSwRegistration] = useState(null)

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    ) {
      setIsSupported(true)
      setPermission(Notification.permission)
      navigator.serviceWorker.ready
        .then((registration) => {
          setSwRegistration(registration)
          setIsLoading(false)
        })
        .catch((err) => {
          console.error('[PushManager] Service worker not ready:', err)
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const checkSubscription = useCallback(async () => {
    if (!swRegistration) return
    setIsLoading(true)
    try {
      const sub = await swRegistration.pushManager.getSubscription()
      setIsSubscribed(!!sub)
    } catch (error) {
      console.error('[PushManager] Error checking subscription:', error)
      setIsSubscribed(false)
    } finally {
      setIsLoading(false)
    }
  }, [swRegistration])

  const handleSubscription = useCallback(async () => {
    if (!swRegistration || !isSupported) {
      toast.error('Push notifications are not supported on this browser.')
      return
    }

    if (permission === 'denied') {
      toast.error('Notifications blocked.', {
        description: 'Please enable notifications in your browser settings.',
      })
      return
    }

    // If already subscribed, do nothing (or maybe implement unsubscribe logic here later)
    if (isSubscribed) {
      toast.info('You are already subscribed to notifications.')
      return
    }

    setIsLoading(true)
    try {
      const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID public key not found.')
      }

      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: { 'Content-Type': 'application/json' },
      })

      setIsSubscribed(true)
      setPermission('granted')
      toast.success('Notifications enabled!')
    } catch (error) {
      console.error('[PushManager] Subscription failed:', error)
      if (error.name === 'NotAllowedError') {
        toast.error('Permission denied for notifications.')
        setPermission('denied')
      } else {
        toast.error('Failed to subscribe.', { description: error.message })
      }
      setIsSubscribed(false)
    } finally {
      setIsLoading(false)
    }
  }, [swRegistration, isSupported, permission, isSubscribed])

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    handleSubscription,
    checkSubscription,
  }
}
