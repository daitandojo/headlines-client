import { Suspense } from 'react';
import { ArticlesView } from '@/components/ArticlesView';
import { GlobalFilters } from '@/components/GlobalFilters';
import { StatsBar } from '@/components/StatsBar';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ARTICLES_PER_PAGE } from '@/config/constants';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import SynthesizedEvent from '@/models/SynthesizedEvent';

async function getData() {
    await dbConnect();
    const uniqueSourcesPromise = Article.distinct('newspaper', { newspaper: { $ne: null } });
    const uniqueCountriesPromise = Article.distinct('country', { country: { $ne: null } });
    const articleCountPromise = Article.countDocuments();
    const eventCountPromise = SynthesizedEvent.countDocuments();
    
    const [uniqueSources, uniqueCountries, articleCount, eventCount] = await Promise.all([
        uniqueSourcesPromise, uniqueCountriesPromise, articleCountPromise, eventCountPromise
    ]);
    return { uniqueSources, uniqueCountries, articleCount, eventCount };
}

export default async function ArticlesPage({ searchParams }) {
    const { uniqueSources, uniqueCountries, articleCount, eventCount } = await getData();
    return (
        <>
            <StatsBar articleCount={articleCount} eventCount={eventCount} />
            <GlobalFilters uniqueSources={uniqueSources} uniqueCountries={uniqueCountries} />
            <Suspense fallback={<SkeletonLoader count={ARTICLES_PER_PAGE} />}>
                <ArticlesView searchParams={searchParams} />
            </Suspense>
        </>
    );
}

const SkeletonLoader = ({ count }) => (
    <div className="max-w-5xl mx-auto space-y-4">
        {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
);