// src/app/(main)/articles/page.js (version 1.5)
import { Suspense } from 'react';
import { ArticlesView } from '@/components/ArticlesView';
import { GlobalFilters } from '@/components/GlobalFilters';
import { Header } from '@/components/Header';
import { MainNavTabs } from '@/components/MainNavTabs';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ARTICLES_PER_PAGE } from '@/config/constants';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import SynthesizedEvent from '@/models/SynthesizedEvent';
import { getArticles } from '@/actions/articles';

async function getData(searchParams) {
    await dbConnect();
    const query = {
        country: { $ne: null },
        $or: [
            { relevance_article: { $gt: 25 } },
            { relevance_headline: { $gt: 25 } }
        ]
    };

    const uniqueCountriesPromise = Article.distinct('country', query);
    const articleCountPromise = Article.countDocuments(query);
    const eventCountPromise = SynthesizedEvent.countDocuments({ highest_relevance_score: { $gt: 25 } });
    
    const initialArticlesPromise = getArticles({ 
        page: 1, 
        filters: { q: searchParams.q, country: searchParams.country },
        sort: searchParams.sort 
    });

    const [uniqueCountries, articleCount, eventCount, initialArticles] = await Promise.all([
        uniqueCountriesPromise, articleCountPromise, eventCountPromise, initialArticlesPromise
    ]);
    return { uniqueCountries, articleCount, eventCount, initialArticles };
}

export default async function ArticlesPage({ searchParams }) {
    const { uniqueCountries, articleCount, eventCount, initialArticles } = await getData(searchParams);
    return (
        <div className="container mx-auto p-4 md:p-8 flex flex-col min-h-screen">
            <Header articleCount={articleCount} eventCount={eventCount} />
            <MainNavTabs />
            <main className="flex-grow flex flex-col mt-8">
                <GlobalFilters uniqueCountries={uniqueCountries} />
                <Suspense fallback={<SkeletonLoader count={ARTICLES_PER_PAGE} />}>
                    <ArticlesView 
                        initialArticles={initialArticles} 
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