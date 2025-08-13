// src/components/OpportunitiesView.jsx (version 7.0)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { OpportunityCard } from '@/components/OpportunityCard'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
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

  // --- Filtering Logic ---
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
      {/* --- RE-ARCHITECTED COMPACT HEADER --- */}
      <Card className="bg-slate-900/50 border-slate-700/80">
        <CardContent className="flex items-center justify-between p-4">
          {/* Left side: Title and Description */}
          <div>
            <CardTitle className="text-2xl">
              Actionable Opportunities ({opportunities.length} of {totalCount})
            </CardTitle>
            <CardDescription className="mt-1">
              A curated list of individuals and entities that have experienced a
              significant wealth event.
            </CardDescription>
          </div>
          {/* Right side: Filter */}
          <div className="w-full max-w-xs">
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
      {/* --- End Compact Header --- */}

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
