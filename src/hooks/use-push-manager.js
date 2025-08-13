// src/hooks/use-push-manager.js (version 2.2)
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
    // State to hold the active service worker registration
    const [swRegistration, setSwRegistration] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            console.log("[PushManager] Browser supports Service Workers and Push.");
            setIsSupported(true);

            // --- ROBUST SERVICE WORKER INITIALIZATION ---
            const initializeServiceWorker = async () => {
                try {
                    // 1. Register the service worker.
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log("[PushManager] Service Worker registration successful:", registration);
                    
                    // 2. Wait for the service worker to become active. This is the crucial step.
                    // If there's an active worker, use it. Otherwise, wait for the new one to activate.
                    if (registration.active) {
                        console.log("[PushManager] Service worker is already active.");
                        setSwRegistration(registration);
                    } else {
                        console.log("[PushManager] Waiting for new service worker to activate...");
                        // Listen for the 'controllerchange' event which signals a new worker has taken control.
                        navigator.serviceWorker.addEventListener('controllerchange', () => {
                            if (navigator.serviceWorker.controller) {
                                console.log("[PushManager] New service worker has activated.");
                                setSwRegistration(navigator.serviceWorker.controller.registration);
                            }
                        });
                    }
                    
                    // 3. Check for an existing subscription.
                    const subscription = await registration.pushManager.getSubscription();
                    console.log("[PushManager] Initial subscription state:", subscription);
                    setIsSubscribed(!!subscription);

                } catch (error) {
                    console.error("[PushManager] Service Worker initialization failed:", error);
                    toast.error("PWA features disabled.", { description: "Could not initialize the service worker." });
                    setIsSupported(false);
                } finally {
                    setIsLoading(false);
                }
            };
            
            initializeServiceWorker();
            
        } else {
            console.log("[PushManager] Browser does not support Service Workers or Push.");
            setIsSupported(false);
            setIsLoading(false);
        }
    }, []);

    const subscribe = useCallback(async () => {
        // Now, we check against the stateful swRegistration object.
        if (!swRegistration) {
            toast.error("Service Worker not ready.", { description: "The background service for notifications is still starting. Please try again in a moment." });
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
            // Use the confirmed active registration to subscribe.
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