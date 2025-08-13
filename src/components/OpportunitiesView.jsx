// src/components/OpportunitiesView.jsx (version 8.0)
'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { getOpportunities } from '@/actions/opportunities'

export function OpportunitiesView({
  initialOpportunities,
  uniqueCountries,
  totalCount,
  searchParams,
}) {
  const [opportunities, setOpportunities] = useState(initialOpportunities)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialOpportunities.length < totalCount)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const currentCountry = searchParams.country || 'all'

  const handleCountryChange = (value) => {
    const params = new URLSearchParams(window.location.search)
    if (value === 'all') {
      params.delete('country')
    } else {
      params.set('country', value)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  useEffect(() => {
    setOpportunities(initialOpportunities)
    setPage(1)
    setHasMore(initialOpportunities.length < totalCount)
  }, [initialOpportunities, totalCount])

  const loadMoreOpportunities = useCallback(async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    const nextPage = page + 1
    const newOpportunities = await getOpportunities({
      page: nextPage,
      filters: { country: searchParams.country },
    })
    if (newOpportunities.length > 0) {
      setOpportunities((prev) => [...prev, ...newOpportunities])
      setPage(nextPage)
    }
    setHasMore(opportunities.length + newOpportunities.length < totalCount)
    setIsLoading(false)
  }, [isLoading, hasMore, page, searchParams, opportunities.length, totalCount])

  const handleOpportunityDeleted = useCallback((opportunityId) => {
    setOpportunities((current) => current.filter((opp) => opp._id !== opportunityId))
  }, [])

  const handleDeletionFailed = useCallback((failedOpportunity) => {
    setOpportunities((current) => [failedOpportunity, ...current])
  }, [])

  return (
    <div className="space-y-6">
      {/* --- RE-ARCHITECTED RESPONSIVE HEADER --- */}
      <Card className="bg-slate-900/50 border-slate-700/80">
        {/* The CardContent's flex direction changes based on screen size */}
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-4">
          {/* Left side: Title and Description */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              Actionable Opportunities ({opportunities.length} of {totalCount})
            </h2>
            {/* The description is now hidden on mobile (`hidden`) and visible on larger screens (`sm:block`) */}
            <p className="hidden sm:block text-sm text-slate-400 mt-1">
              A curated list of individuals and entities that have experienced a
              significant wealth event.
            </p>
          </div>
          {/* Right side: Filter */}
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
      {/* --- End Responsive Header --- */}

      <div className="space-y-3">
        {opportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity._id}
            opportunity={opportunity}
            onOpportunityDeleted={handleOpportunityDeleted}
            onDeletionFailed={handleDeletionFailed}
          />
        ))}
      </div>

      <InfiniteScrollLoader onLoadMore={loadMoreOpportunities} hasMore={hasMore} />

      {!hasMore && opportunities.length > 0 && (
        <p className="text-center text-slate-500 text-sm py-4">End of list.</p>
      )}

      {opportunities.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-20 rounded-lg bg-black/20 border border-white/10">
          <p>No opportunities found for the selected filter.</p>
        </div>
      )}
    </div>
  )
}
