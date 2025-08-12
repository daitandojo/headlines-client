// src/app/(main)/events/page.js (version 1.6)
import { Suspense } from 'react';
import { EventsView } from '@/components/EventsView';
import { GlobalFilters } from '@/components/GlobalFilters';
import { Header } from '@/components/Header';
import { MainNavTabs } from '@/components/MainNavTabs';
import { SkeletonCard } from '@/components/SkeletonCard';
import { EVENTS_PER_PAGE } from '@/config/constants';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import SynthesizedEvent from '@/models/SynthesizedEvent';
import { getEvents } from '@/actions/events';

async function getData(searchParams) {
    await dbConnect();
    const uniqueCountriesPromise = SynthesizedEvent.distinct('country', { country: { $ne: null }, highest_relevance_score: { $gt: 25 } });
    const articleCountPromise = Article.countDocuments({ $or: [{relevance_article: { $gt: 25 }}, {relevance_headline: {$gt: 25}}] });
    const eventCountPromise = SynthesizedEvent.countDocuments({ highest_relevance_score: { $gt: 25 } });
    
    const initialEventsPromise = getEvents({ 
        page: 1, 
        filters: { q: searchParams.q, country: searchParams.country },
        sort: searchParams.sort
    });

    const [uniqueCountries, articleCount, eventCount, initialEvents] = await Promise.all([
        uniqueCountriesPromise, articleCountPromise, eventCountPromise, initialEventsPromise
    ]);
    return { uniqueCountries, articleCount, eventCount, initialEvents };
}

export default async function EventsPage({ searchParams }) {
    const { uniqueCountries, articleCount, eventCount, initialEvents } = await getData(searchParams);
    return (
        <div className="container mx-auto p-4 md:p-8 flex flex-col min-h-screen">
            <Header articleCount={articleCount} eventCount={eventCount} />
            <MainNavTabs />
            <main className="flex-grow flex flex-col mt-8">
                <GlobalFilters uniqueCountries={uniqueCountries} />
                <Suspense fallback={<SkeletonLoader count={EVENTS_PER_PAGE} />}>
                    <EventsView 
                        initialEvents={initialEvents}
                        searchParams={searchParams}
                    />
                </Suspense>
            </main>
        </div>
    );
}

const SkeletonLoader = ({ count }) => (
    <div className="max-w-5xl mx-auto space-y-4">
        {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
);