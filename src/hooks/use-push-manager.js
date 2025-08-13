// src/hooks/use-push-manager.js (version 5.0)
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
    const [swRegistration, setSwRegistration] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            console.log("[PushManager] Browser supports Service Workers and Push.");
            setIsSupported(true);

            const initializePushManager = async () => {
                setIsLoading(true);
                console.log("[PushManager] Initializing... Waiting for service worker to be ready.");

                try {
                    // The `navigator.serviceWorker.ready` promise is the most reliable signal.
                    // It resolves with the registration when the service worker is active.
                    const readyPromise = navigator.serviceWorker.ready;
                    
                    // Use an extended timeout to accommodate slower mobile devices (like iOS).
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error("Service Worker readiness check timed out after 15 seconds.")), 15000)
                    );

                    // Race the two promises. This prevents the app from waiting indefinitely.
                    const registration = await Promise.race([readyPromise, timeoutPromise]);
                    
                    console.log("[PushManager] Service Worker is now active and ready:", registration);
                    setSwRegistration(registration);
                    
                    // Once we have a ready registration, check for an existing subscription.
                    const subscription = await registration.pushManager.getSubscription();
                    console.log("[PushManager] Initial subscription state:", subscription);
                    setIsSubscribed(!!subscription);

                } catch (error) {
                    console.error("[PushManager] Initialization failed:", error);
                    toast.error("Could not connect to the background notification service.", { 
                        description: "This can happen during initial setup. Please try again in a moment."
                    });
                    setIsSupported(false); // Gracefully disable the feature if initialization fails.
                } finally {
                    setIsLoading(false);
                    console.log("[PushManager] Initialization finished.");
                }
            };

            // Delay initialization slightly to allow the service worker registration process to start.
            const timer = setTimeout(() => {
                initializePushManager();
            }, 100);
            
            return () => clearTimeout(timer);

        } else {
            console.log("[PushManager] Browser does not support Service Workers or Push.");
            setIsSupported(false);
            setIsLoading(false);
        }
    }, []);

    const subscribe = useCallback(async () => {
        if (!swRegistration) {
            toast.error("Notification service not ready.", { description: "The background service is still starting. Please try again in a moment." });
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
            const subscription = await swRegistration.pushManager.subscribe({
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
            console.error("[PushManager] Full subscription error object:", error);
            
            let errorMessage = "An unexpected error occurred.";
            if (error instanceof Error) {
                errorMessage = `${error.name}: ${error.message}`;
            }

            if (error.name === 'NotAllowedError') {
                 toast.error("Permission denied.", { description: "You did not grant permission for notifications." });
            } else {
                 toast.error("Failed to enable notifications.", { description: errorMessage });
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [swRegistration]);

    return { isSupported, isSubscribed, isLoading, subscribe };
}