// src/hooks/use-realtime-updates.js (version 2.0)
"use client";

import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { toast } from 'sonner';
import { useAppStore } from '@/store/use-app-store';
import { Sparkles } from 'lucide-react';

export function useRealtimeUpdates() {
    const { prependArticle, prependEvent } = useAppStore(state => ({
        prependArticle: state.prependArticle,
        prependEvent: state.prependEvent,
    }));
    const pusherRef = useRef(null);
    const channelsRef = useRef({});

    useEffect(() => {
        if (pusherRef.current) return;

        const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

        if (!PUSHER_KEY || !PUSHER_CLUSTER) {
            console.warn("Pusher keys not found, real-time updates are disabled.");
            return;
        }

        try {
            pusherRef.current = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });

            // Subscribe to Articles Channel
            channelsRef.current.articles = pusherRef.current.subscribe('articles-channel');
            channelsRef.current.articles.bind('new-article', (data) => {
                console.log('Real-time article received:', data);
                prependArticle(data);
                toast("New Article Received", {
                    description: data.headline,
                    icon: <Sparkles className="h-4 w-4 text-yellow-400" />,
                });
            });

            // Subscribe to Events Channel
            channelsRef.current.events = pusherRef.current.subscribe('events-channel');
            channelsRef.current.events.bind('new-event', (data) => {
                console.log('Real-time event received:', data);
                prependEvent(data);
                 toast("New Event Synthesized", {
                    description: data.synthesized_headline,
                    icon: <Sparkles className="h-4 w-4 text-blue-400" />,
                });
            });

            console.log("Successfully subscribed to real-time data channels.");

        } catch (error) {
            console.error("Failed to initialize Pusher:", error);
        }

        return () => {
            if (pusherRef.current) {
                Object.values(channelsRef.current).forEach(channel => channel.unbind_all());
                pusherRef.current.disconnect();
                pusherRef.current = null;
            }
        };
    }, [prependArticle, prependEvent]);
}