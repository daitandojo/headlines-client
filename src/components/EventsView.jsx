// src/components/EventsView.jsx (version 1.3)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { EventList } from '@/components/EventList';
import { InfiniteScrollLoader } from '@/components/InfiniteScrollLoader';
import { getEvents } from '@/actions/events';
import { EVENTS_PER_PAGE } from '@/config/constants';
import { useRealtimeUpdates } from '@/hooks/use-realtime-updates'; // NEW

export function EventsView({ initialEvents, searchParams }) {
    const [events, setEvents] = useState(initialEvents);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialEvents.length === EVENTS_PER_PAGE);
    const [isLoading, setIsLoading] = useState(false);
    
    useRealtimeUpdates(); // NEW: Activate real-time listener

    useEffect(() => {
        setEvents(initialEvents);
        setPage(1);
        setHasMore(initialEvents.length === EVENTS_PER_PAGE);
    }, [initialEvents]);

    const loadMoreEvents = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);

        const nextPage = page + 1;
        const newEvents = await getEvents({
            page: nextPage,
            filters: { q: searchParams.q, country: searchParams.country },
            sort: searchParams.sort,
        });

        if (newEvents.length > 0) {
            setEvents(prev => [...prev, ...newEvents]);
            setPage(nextPage);
        }

        if (newEvents.length < EVENTS_PER_PAGE) {
            setHasMore(false);
        }
        
        setIsLoading(false);
    }, [isLoading, hasMore, page, searchParams]);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {events.length > 0 ? (
                <>
                    <EventList events={events} />
                    <InfiniteScrollLoader onLoadMore={loadMoreEvents} hasMore={hasMore} />
                </>
            ) : (
                <div className="text-center text-gray-500 py-20 rounded-lg bg-black/20 border border-white/10">
                    <p>No synthesized events found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}