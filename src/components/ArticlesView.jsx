// src/components/ArticlesView.jsx (version 1.3)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { ArticleList } from '@/components/ArticleList';
import { InfiniteScrollLoader } from '@/components/InfiniteScrollLoader';
import { getArticles } from '@/actions/articles';
import { ARTICLES_PER_PAGE } from '@/config/constants';
import { useRealtimeUpdates } from '@/hooks/use-realtime-updates'; // NEW

export function ArticlesView({ initialArticles, searchParams }) {
    const [articles, setArticles] = useState(initialArticles);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialArticles.length === ARTICLES_PER_PAGE);
    const [isLoading, setIsLoading] = useState(false);
    
    useRealtimeUpdates(); // NEW: Activate real-time listener

    useEffect(() => {
        setArticles(initialArticles);
        setPage(1);
        setHasMore(initialArticles.length === ARTICLES_PER_PAGE);
    }, [initialArticles]);

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
            setArticles(prev => [...prev, ...newArticles]);
            setPage(nextPage);
        }
        
        if (newArticles.length < ARTICLES_PER_PAGE) {
            setHasMore(false);
        }
        
        setIsLoading(false);
    }, [isLoading, hasMore, page, searchParams]);

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