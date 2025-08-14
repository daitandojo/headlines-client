// src/components/ArticlesView.jsx (version 5.2)
'use client'

import { useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArticleList } from '@/components/ArticleList'
import { InfiniteScrollLoader } from '@/components/InfiniteScrollLoader'
import { getArticles, deleteArticle } from '@/actions/articles'
import { useRealtimeUpdates } from '@/hooks/use-realtime-updates'
import { LoadingOverlay } from './LoadingOverlay'

export function ArticlesView({ initialArticles, searchParams }) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['articles', searchParams], [searchParams])

  const { data, fetchNextPage, hasNextPage, isFetching, isError } = useInfiniteQuery({
    queryKey: queryKey,
    queryFn: ({ pageParam = 1 }) =>
      getArticles({
        page: pageParam,
        filters: { q: searchParams.q, country: searchParams.country },
        sort: searchParams.sort,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.length > 0 ? (data?.pages.length ?? 0) + 1 : undefined,
    initialPageParam: 1,
    initialData: {
      pages: [initialArticles],
      pageParams: [1],
    },
    staleTime: 60 * 1000,
  })

  const { mutate: performDelete } = useMutation({
    mutationFn: deleteArticle,
    onMutate: async (articleIdToDelete) => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (oldData) => {
        if (!oldData) return { pages: [], pageParams: [] }
        return {
          ...oldData,
          pages: oldData.pages.map((page) =>
            page.filter((article) => article._id !== articleIdToDelete)
          ),
        }
      })
      toast.success('Article removed.')
      return { previousData }
    },
    onError: (err, articleId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast.error('Failed to delete article. Restoring.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

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
