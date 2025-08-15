// src/components/EventsView.jsx (version 2.0)
'use client'

import { useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EventList } from '@/components/EventList'
import { InfiniteScrollLoader } from '@/components/InfiniteScrollLoader'
import { deleteEvent, getEvents } from '@/actions/events' // <-- deleteEvent is now the new complex one
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

  // START: UPDATED MUTATION LOGIC
  const { mutate: performDelete } = useMutation({
    mutationFn: deleteEvent, // This now expects an object: { eventId, ...options }
    onMutate: async (variables) => {
      const { eventId } = variables
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (oldData) => {
        if (!oldData) return { pages: [], pageParams: [] }
        return {
          ...oldData,
          pages: oldData.pages.map((page) =>
            page.filter((event) => event._id !== eventId)
          ),
        }
      })
      // Optimistic toast, final result will be shown in onSuccess/onError
      toast.loading('Deletion in progress...')
      return { previousData }
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast.dismiss() // Dismiss loading toast
      toast.error('Failed to delete event. Restoring.')
    },
    onSuccess: (data) => {
      toast.dismiss() // Dismiss loading toast
      if (data.success) {
        toast.success(data.message)
        // Invalidate other queries that might be affected
        queryClient.invalidateQueries({ queryKey: ['opportunities'] })
        queryClient.invalidateQueries({ queryKey: ['articles'] })
      } else {
        toast.error(`Deletion failed: ${data.message}`)
        // Refetch to ensure consistency if the server-side operation failed
        queryClient.invalidateQueries({ queryKey })
      }
    },
    onSettled: () => {
      // Invalidate to ensure the view is in sync with the DB, especially if
      // only some parts of the deletion succeeded before an error.
      queryClient.invalidateQueries({ queryKey })
    },
  })
  // END: UPDATED MUTATION LOGIC

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
