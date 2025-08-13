// src/hooks/use-realtime-updates.js (version 2.0)
"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';
import { toast } from 'sonner';

export function useRealtimeUpdates() {
    const router = useRouter();
    const pusherRef = useRef(null);
    const channelRef = useRef(null);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const reconnectTimeoutRef = useRef(null);

    useEffect(() => {
        // Ensure this only runs once and on the client
        if (pusherRef.current) return;

        const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

        if (!PUSHER_KEY || !PUSHER_CLUSTER) {
            console.warn("Pusher keys not found, real-time updates are disabled.");
            setConnectionStatus('disabled');
            return;
        }

        const initializePusher = () => {
            try {
                // Clear any existing reconnect timeout
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }

                pusherRef.current = new Pusher(PUSHER_KEY, {
                    cluster: PUSHER_CLUSTER,
                    forceTLS: true,
                    enabledTransports: ['ws', 'wss'],
                    disabledTransports: ['xhr_polling', 'xhr_streaming', 'sockjs'],
                    wsPort: 443,
                    wssPort: 443,
                    httpPort: 80,
                    httpsPort: 443,
                    enableStats: false,
                    enableLogging: process.env.NODE_ENV === 'development'
                });

                // Connection event handlers
                pusherRef.current.connection.bind('connecting', () => {
                    console.log('[Pusher] Connecting...');
                    setConnectionStatus('connecting');
                });

                pusherRef.current.connection.bind('connected', () => {
                    console.log('[Pusher] Connected successfully');
                    setConnectionStatus('connected');
                });

                pusherRef.current.connection.bind('disconnected', () => {
                    console.log('[Pusher] Disconnected');
                    setConnectionStatus('disconnected');
                    
                    // Auto-reconnect after 5 seconds
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('[Pusher] Attempting to reconnect...');
                        if (pusherRef.current) {
                            pusherRef.current.connect();
                        }
                    }, 5000);
                });

                pusherRef.current.connection.bind('error', (error) => {
                    console.error('[Pusher] Connection error:', error);
                    setConnectionStatus('error');
                });

                pusherRef.current.connection.bind('unavailable', () => {
                    console.warn('[Pusher] Connection unavailable');
                    setConnectionStatus('unavailable');
                });

                // Subscribe to channel
                channelRef.current = pusherRef.current.subscribe('data-updates');

                channelRef.current.bind('pusher:subscription_succeeded', () => {
                    console.log('[Pusher] Successfully subscribed to real-time updates channel');
                });

                channelRef.current.bind('pusher:subscription_error', (error) => {
                    console.error('[Pusher] Subscription error:', error);
                });

                channelRef.current.bind('data-changed', (data) => {
                    console.log('[Pusher] Real-time event received:', data);
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

            } catch (error) {
                console.error('[Pusher] Failed to initialize:', error);
                setConnectionStatus('error');
                
                // Retry after 10 seconds
                reconnectTimeoutRef.current = setTimeout(initializePusher, 10000);
            }
        };

        // Initialize Pusher
        initializePusher();

        // Cleanup on component unmount
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            
            if (channelRef.current) {
                channelRef.current.unbind_all();
                pusherRef.current?.unsubscribe('data-updates');
                channelRef.current = null;
            }
            
            if (pusherRef.current) {
                pusherRef.current.disconnect();
                pusherRef.current = null;
            }
            
            setConnectionStatus('disconnected');
        };
    }, [router]);

    return { connectionStatus };
}