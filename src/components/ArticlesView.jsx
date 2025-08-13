// src/components/ArticlesView.jsx (version 2.0)
"use client";

import { useEffect, useCallback, useState } from 'react';
import { ArticleList } from '@/components/ArticleList';
import { InfiniteScrollLoader } from '@/components/InfiniteScrollLoader';
import { getArticles } from '@/actions/articles';
import { ARTICLES_PER_PAGE } from '@/config/constants';
import { useRealtimeUpdates } from '@/hooks/use-realtime-updates';
import { useAppStore } from '@/store/use-app-store';

export function ArticlesView({ initialArticles, searchParams }) {
    // Get state and actions from the central store
    const { articles, setInitialArticles, appendArticles, hydratedArticleSet } = useAppStore(state => ({
        articles: state.articles,
        setInitialArticles: state.setInitialArticles,
        appendArticles: state.appendArticles,
        hydratedArticleSet: state.hydratedArticleSet,
    }));

    // Local state for pagination control
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialArticles.length === ARTICLES_PER_PAGE);
    const [isLoading, setIsLoading] = useState(false);
    
    // Activate the real-time listener
    useRealtimeUpdates();

    // Effect to hydrate the store with initial server-side data
    // It runs only once per unique set of initial articles
    useEffect(() => {
        const initialIds = new Set(initialArticles.map(a => a._id));
        const isAlreadyHydrated = [...initialIds].every(id => hydratedArticleSet.has(id));
        
        if (!isAlreadyHydrated || articles.length === 0) {
            setInitialArticles(initialArticles);
            setPage(1);
            setHasMore(initialArticles.length === ARTICLES_PER_PAGE);
        }
    }, [initialArticles, setInitialArticles, hydratedArticleSet, articles.length]);

    const loadMoreArticles = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);

        const nextPage = page + 1;
        const newArticles = await getArticles({
            page: nextPage,
            filters: { q: searchParams.q, country: searchParams.country },
            sort: searchParams.sort,
        });

        if (newArticles.length > 0) {
            appendArticles(newArticles); // Append to the central store
            setPage(nextPage);
        }
        
        if (newArticles.length < ARTICLES_PER_PAGE) {
            setHasMore(false);
        }
        
        setIsLoading(false);
    }, [isLoading, hasMore, page, searchParams, appendArticles]);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {articles.length > 0 ? (
                <>
                    <ArticleList articles={articles} />
                    <InfiniteScrollLoader onLoadMore={loadMoreArticles} hasMore={hasMore} />
                </>
            ) : (
                <div className="text-center text-gray-500 py-20 rounded-lg bg-black/20 border border-white/10">
                    <p>No articles found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}