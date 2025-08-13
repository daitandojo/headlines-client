// src/hooks/use-push-manager.js (version 2.1)
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
    const [registration, setRegistration] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            console.log("[PushManager] Browser supports Service Workers and Push.");
            setIsSupported(true);

            navigator.serviceWorker.register('/sw.js').then(reg => {
                console.log("[PushManager] Service Worker registered successfully:", reg);
                setRegistration(reg);
                return reg.pushManager.getSubscription();
            }).then(subscription => {
                console.log("[PushManager] Initial subscription state:", subscription);
                setIsSubscribed(!!subscription);
                setIsLoading(false);
            }).catch(error => {
                console.error("[PushManager] Service Worker registration failed:", error);
                toast.error("PWA features disabled.", { description: "Could not register the service worker." });
                setIsSupported(false);
                setIsLoading(false);
            });
        } else {
            console.log("[PushManager] Browser does not support Service Workers or Push.");
            setIsSupported(false);
            setIsLoading(false);
        }
    }, []);

    const subscribe = useCallback(async () => {
        if (!registration) {
            toast.error("Service Worker not ready.", { description: "Please try again in a moment." });
            return false;
        }

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
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            console.log("[PushManager] New subscription created:", subscription);

            await fetch('/api/push/subscribe', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: { 'Content-Type': 'application/json' },
            });
            console.log("[PushManager] Subscription sent to server.");

            setIsSubscribed(true);
            toast.success("Notifications enabled!");
            return true;
        } catch (error) {
            // --- ENHANCED ERROR HANDLING ---
            // Log the full error object for detailed inspection.
            console.error("[PushManager] Full subscription error object:", error);
            
            let errorMessage = "An unexpected error occurred.";
            if (error instanceof Error) {
                errorMessage = `${error.name}: ${error.message}`;
            }

            if (error.name === 'NotAllowedError') {
                 toast.error("Permission denied.", { description: "You did not grant permission for notifications." });
            } else {
                 // Display the specific error message to the user.
                 toast.error("Failed to enable notifications.", { description: errorMessage });
            }
            return false;
            // --- END ENHANCED ERROR HANDLING ---
        } finally {
            setIsLoading(false);
        }
    }, [registration]);

    return { isSupported, isSubscribed, isLoading, subscribe };
}