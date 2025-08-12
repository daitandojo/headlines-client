// src/hooks/use-realtime-updates.js (version 1.0)
"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';
import { toast } from 'sonner';

export function useRealtimeUpdates() {
    const router = useRouter();
    // Use a ref to prevent re-subscribing on every render
    const pusherRef = useRef(null);
    const channelRef = useRef(null);

    useEffect(() => {
        // Ensure this only runs once and on the client
        if (pusherRef.current) return;

        const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

        if (!PUSHER_KEY || !PUSHER_CLUSTER) {
            console.warn("Pusher keys not found, real-time updates are disabled.");
            return;
        }

        try {
            pusherRef.current = new Pusher(PUSHER_KEY, {
                cluster: PUSHER_CLUSTER
            });
    
            channelRef.current = pusherRef.current.subscribe('data-updates');
    
            channelRef.current.bind('data-changed', (data) => {
                console.log('Real-time event received:', data);
                toast.info("New intelligence has been added.", {
                    description: "The view will now refresh automatically.",
                    action: {
                        label: 'Refresh Now',
                        onClick: () => router.refresh(),
                    },
                });
                // Soft-refresh the page to get new server-rendered data
                router.refresh(); 
            });

            console.log("Successfully subscribed to real-time updates channel.");

        } catch (error) {
            console.error("Failed to initialize Pusher:", error);
        }

        // Cleanup on component unmount
        return () => {
            if (pusherRef.current) {
                pusherRef.current.unsubscribe('data-updates');
                pusherRef.current.disconnect();
                pusherRef.current = null;
            }
        };
    }, [router]); // router is stable
}