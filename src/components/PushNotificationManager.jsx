// src/components/PushNotificationManager.jsx (version 1.3)
"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

export function PushNotificationManager() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSupported, setIsSupported] = useState(false);
    
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(subscription => {
                    if (subscription) {
                        setIsSubscribed(true);
                    }
                    setIsLoading(false);
                });
            }).catch(err => {
                console.error("Service worker not ready:", err);
                setIsLoading(false);
            });
        } else {
            setIsSupported(false);
            setIsLoading(false);
        }
    }, []);

    const handleSubscribe = async () => {
        if (!VAPID_PUBLIC_KEY) {
            toast.error("Push notifications are not configured on the server.", {
                description: "The VAPID public key is missing from the environment variables.",
            });
            return;
        }

        if (Notification.permission === 'denied') {
            toast.error("Notification permission has been denied.", {
                description: "You must enable notifications for this site in your browser settings.",
            });
            return;
        }
        
        setIsLoading(true);
        toast.info("Awaiting notification permission...");
        
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                body: JSON.stringify(sub),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error("Failed to save subscription on the server.");
            }

            setIsSubscribed(true);
            toast.success("Notifications enabled!", {
                description: "You will now receive alerts for new intelligence events.",
            });
        } catch (error) {
            console.error("Error subscribing:", error);
            toast.error("Failed to enable notifications.", {
                description: "Please ensure you've granted permission. If the problem persists, check the console.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isSupported) {
        return null;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleSubscribe} disabled={isLoading || isSubscribed}>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {!isLoading && isSubscribed && <Bell className="h-4 w-4 text-green-400" />}
                        {!isLoading && !isSubscribed && <BellOff className="h-4 w-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isSubscribed ? "Notifications Enabled" : "Enable Notifications"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}