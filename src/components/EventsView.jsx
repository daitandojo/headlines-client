// src/components/EventsView.jsx (version 1.3)
'use client'

import { useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EventList } from '@/components/EventList'
import { InfiniteScrollLoader } from '@/components/InfiniteScrollLoader'
import { getEvents, deleteEvent } from '@/actions/events'
import { useRealtimeUpdates } from '@/hooks/use-realtime-updates'
import { LoadingOverlay } from './LoadingOverlay'

export function EventsView({ initialEvents, searchParams }) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['events', searchParams], [searchParams])

  const { data, fetchNextPage, hasNextPage, isFetching, isError } = useInfiniteQuery({
    queryKey: queryKey,
    queryFn: ({ pageParam = 1 }) =>
      getEvents({
        page: pageParam,
        filters: { q: searchParams.q, country: searchParams.country },
        sort: searchParams.sort,
      }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length > 0 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    initialData: {
      pages: [initialEvents],
      pageParams: [1],
    },
    staleTime: 60 * 1000,
  })

  const { mutate: performDelete } = useMutation({
    mutationFn: deleteEvent,
    onMutate: async (eventIdToDelete) => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (oldData) => {
        if (!oldData) return { pages: [], pageParams: [] }
        return {
          ...oldData,
          pages: oldData.pages.map((page) =>
            page.filter((event) => event._id !== eventIdToDelete)
          ),
        }
      })
      toast.success('Event removed.')
      return { previousData }
    },
    onError: (err, eventId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast.error('Failed to delete event. Restoring.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  useRealtimeUpdates({
    channel: 'events-channel',
    event: 'new-event',
    queryKey: queryKey,
  })

  const events = data?.pages.flat() ?? []
  const showLoadingOverlay = isFetching && events.length === 0

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:px-0 -mx-4 px-4">
      <LoadingOverlay isLoading={showLoadingOverlay} text="Fetching Events..." />
      {!showLoadingOverlay && events.length > 0 ? (
        <>
          <EventList events={events} onDelete={performDelete} />
          <InfiniteScrollLoader onLoadMore={fetchNextPage} hasMore={hasNextPage} />
        </>
      ) : (
        !isFetching && (
          <div className="text-center text-gray-500 py-20 rounded-lg bg-black/20 border border-white/10">
            <p>No synthesized events found matching your criteria.</p>
          </div>
        )
      )}
      {isError && (
        <div className="text-center text-red-400 py-20">
          <p>Failed to load events. Please try again later.</p>
        </div>
      )}
    </div>
  )
}
