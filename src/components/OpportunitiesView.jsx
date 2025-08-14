// src/components/OpportunitiesView.jsx (version 12.0)
'use client'

import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { OpportunityCard } from '@/components/OpportunityCard'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InfiniteScrollLoader } from '@/components/InfiniteScrollLoader'
import { AnimatePresence, motion } from 'framer-motion'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOpportunities, deleteOpportunity } from '@/actions/opportunities'
import { toast } from 'sonner'
import { AnimatedList, itemVariants } from './AnimatedList'
import { LoadingOverlay } from './LoadingOverlay'

export function OpportunitiesView({
  uniqueCountries,
  searchParams,
  initialOpportunities,
  totalCount,
}) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()

  const queryKey = useMemo(() => ['opportunities', searchParams], [searchParams])
  const currentCountry = searchParams.country || 'all'

  const { data, fetchNextPage, hasNextPage, isFetching, isError } = useInfiniteQuery({
    queryKey: queryKey,
    queryFn: ({ pageParam = 1 }) =>
      getOpportunities({
        page: pageParam,
        filters: { country: searchParams.country },
      }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length > 0 ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
    initialData: {
      pages: [initialOpportunities],
      pageParams: [1],
    },
  })

  const { mutate: performDelete, isPending: isDeleting } = useMutation({
    mutationFn: deleteOpportunity,
    onMutate: async (opportunityIdToDelete) => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (oldData) => {
        if (!oldData) return { pages: [], pageParams: [] }
        return {
          ...oldData,
          pages: oldData.pages.map((page) =>
            page.filter((opp) => opp._id !== opportunityIdToDelete)
          ),
        }
      })
      toast.success('Opportunity removed.')
      return { previousData }
    },
    onError: (err, oppId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast.error('Failed to delete opportunity. Restoring.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const handleCountryChange = (value) => {
    const params = new URLSearchParams(window.location.search)
    if (value === 'all') {
      params.delete('country')
    } else {
      params.set('country', value)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const opportunities = data?.pages.flat() ?? []
  const showLoadingOverlay = isFetching && opportunities.length === 0

  return (
    <div className="space-y-6">
      <LoadingOverlay isLoading={showLoadingOverlay} text="Fetching Opportunities..." />

      <Card className="bg-slate-900/50 border-slate-700/80">
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {totalCount} Actionable Opportunities
            </h2>
            <p className="hidden sm:block text-sm text-slate-400 mt-1">
              A curated list of individuals and entities that have experienced a
              significant wealth event.
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <Label htmlFor="country-filter" className="text-slate-300 text-xs">
              Filter by Country
            </Label>
            <Select value={currentCountry} onValueChange={handleCountryChange}>
              <SelectTrigger
                id="country-filter"
                className="w-full mt-1 bg-slate-900/80 border-slate-700"
              >
                <SelectValue placeholder="Filter by country..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {uniqueCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!showLoadingOverlay && (
        <div className="sm:px-0 -mx-4 px-4">
          <AnimatedList className="space-y-3">
            <AnimatePresence>
              {opportunities.map((opportunity) => (
                <motion.div
                  key={opportunity._id}
                  variants={itemVariants}
                  exit={itemVariants.exit}
                  layout
                >
                  <OpportunityCard
                    opportunity={opportunity}
                    onDelete={() => performDelete(opportunity._id)}
                    isDeleting={isDeleting}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </AnimatedList>
        </div>
      )}

      <InfiniteScrollLoader onLoadMore={fetchNextPage} hasMore={hasNextPage} />

      {!hasNextPage && opportunities.length > 0 && !showLoadingOverlay && (
        <p className="text-center text-slate-500 text-sm py-4">End of list.</p>
      )}

      {opportunities.length === 0 && !isFetching && (
        <div className="text-center text-gray-500 py-20 rounded-lg bg-black/20 border border-white/10">
          <p>No opportunities found for the selected filter.</p>
        </div>
      )}

      {isError && (
        <div className="text-center text-red-400 py-20">
          <p>Failed to load opportunities. Please try again later.</p>
        </div>
      )}
    </div>
  )
}
