// src/components/ArticlesView.jsx (version 5.0)
'use client'

import { useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArticleList } from '@/components/ArticleList'
import { InfiniteScrollLoader } from '@/components/InfiniteScrollLoader'
import { getArticles, deleteArticle } from '@/actions/articles'
import { useRealtimeUpdates } from '@/hooks/use-realtime-updates'
import { LoadingOverlay } from './LoadingOverlay'

export function ArticlesView({ searchParams }) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['articles', searchParams], [searchParams])

  // useInfiniteQuery handles fetching, pagination, and caching
  const { data, fetchNextPage, hasNextPage, isLoading, isFetching, isError } =
    useInfiniteQuery({
      queryKey: queryKey,
      queryFn: ({ pageParam = 1 }) =>
        getArticles({
          page: pageParam,
          filters: { q: searchParams.q, country: searchParams.country },
          sort: searchParams.sort,
        }),
      getNextPageParam: (lastPage, allPages) => {
        // If the last page had results, there might be a next page.
        return lastPage.length > 0 ? allPages.length + 1 : undefined
      },
      initialPageParam: 1,
    })

  // useMutation handles the delete action and automatically updates the UI
  const { mutate: performDelete } = useMutation({
    mutationFn: deleteArticle,
    onSuccess: (result, articleId) => {
      if (result.success) {
        toast.success(result.message)
        queryClient.invalidateQueries({ queryKey })
      } else {
        toast.error(result.message)
      }
    },
    onError: (error) => {
      toast.error(`Failed to delete article: ${error.message}`)
    },
  })

  // Activate real-time updates which will invalidate the query on new data
  useRealtimeUpdates({
    channel: 'articles-channel',
    event: 'new-article',
    queryKey: queryKey,
  })

  const articles = data?.pages.flat() ?? []
  const showLoadingOverlay = isFetching && articles.length === 0

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:px-0 -mx-4 px-4">
      <LoadingOverlay isLoading={showLoadingOverlay} text="Fetching Articles..." />
      {!showLoadingOverlay && articles.length > 0 ? (
        <>
          <ArticleList articles={articles} onDelete={performDelete} />
          <InfiniteScrollLoader onLoadMore={fetchNextPage} hasMore={hasNextPage} />
        </>
      ) : (
        !isFetching && (
          <div className="text-center text-gray-500 py-20 rounded-lg bg-black/20 border border-white/10">
            <p>No articles found matching your criteria.</p>
          </div>
        )
      )}
      {isError && (
        <div className="text-center text-red-400 py-20">
          <p>Failed to load articles. Please try again later.</p>
        </div>
      )}
    </div>
  )
}
