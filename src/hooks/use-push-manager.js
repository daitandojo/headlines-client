// src/hooks/use-push-manager.js (version 1.0)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            navigator.serviceWorker.ready.then(registration => {
                return registration.pushManager.getSubscription();
            }).then(subscription => {
                setIsSubscribed(!!subscription);
                setIsLoading(false);
            }).catch(error => {
                console.error("Error checking push subscription:", error);
                setIsLoading(false);
            });
        } else {
            setIsSupported(false);
            setIsLoading(false);
        }
    }, []);

    const subscribe = useCallback(async () => {
        const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!VAPID_PUBLIC_KEY) {
            toast.error("Push notifications are not configured on the server.");
            return false;
        }

        if (Notification.permission === 'denied') {
            toast.error("Notification permission has been denied.", {
                description: "You must enable notifications for this site in your browser settings.",
            });
            return false;
        }

        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Server error while saving subscription.');
            }

            setIsSubscribed(true);
            toast.success("Notifications enabled!");
            return true;
        } catch (error) {
            console.error("Error during push subscription:", error);
            toast.error("Failed to enable notifications.", {
                description: "Please ensure you grant permission. If the issue persists, check the console."
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { isSupported, isSubscribed, isLoading, subscribe };
}