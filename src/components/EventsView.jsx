// src/components/EventsView.jsx (version 2.0)
"use client";

import { useEffect, useCallback, useState } from 'react';
import { EventList } from '@/components/EventList';
import { InfiniteScrollLoader } from '@/components/InfiniteScrollLoader';
import { getEvents } from '@/actions/events';
import { EVENTS_PER_PAGE } from '@/config/constants';
import { useRealtimeUpdates } from '@/hooks/use-realtime-updates';
import { useAppStore } from '@/store/use-app-store';

export function EventsView({ initialEvents, searchParams }) {
    // Get state and actions from the central store
    const { events, setInitialEvents, appendEvents, hydratedEventSet } = useAppStore(state => ({
        events: state.events,
        setInitialEvents: state.setInitialEvents,
        appendEvents: state.appendEvents,
        hydratedEventSet: state.hydratedEventSet,
    }));
    
    // Local state for pagination control
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialEvents.length === EVENTS_PER_PAGE);
    const [isLoading, setIsLoading] = useState(false);
    
    // Activate the real-time listener
    useRealtimeUpdates();

    // Effect to hydrate the store with initial server-side data
    useEffect(() => {
        const initialIds = new Set(initialEvents.map(e => e._id));
        const isAlreadyHydrated = [...initialIds].every(id => hydratedEventSet.has(id));

        if (!isAlreadyHydrated || events.length === 0) {
            setInitialEvents(initialEvents);
            setPage(1);
            setHasMore(initialEvents.length === EVENTS_PER_PAGE);
        }
    }, [initialEvents, setInitialEvents, hydratedEventSet, events.length]);

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
            appendEvents(newEvents); // Append to the central store
            setPage(nextPage);
        }

        if (newEvents.length < EVENTS_PER_PAGE) {
            setHasMore(false);
        }
        
        setIsLoading(false);
    }, [isLoading, hasMore, page, searchParams, appendEvents]);

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