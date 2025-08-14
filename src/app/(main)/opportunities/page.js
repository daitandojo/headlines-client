// src/app/(main)/opportunities/page.js (version 8.2)
import { Suspense } from 'react'
import { OpportunitiesView } from '@/components/OpportunitiesView'
import {
  getOpportunities,
  getOpportunityCountries,
  getTotalOpportunitiesCount,
} from '@/actions/opportunities'
import { SkeletonCard } from '@/components/SkeletonCard'
import { OPPORTUNITIES_PER_PAGE } from '@/config/constants'

export const metadata = {
  title: 'Opportunities | Headlines',
  description: 'Manage and track wealth management opportunities.',
}

export default async function OpportunitiesPage({ searchParams }) {
  const filters = { country: searchParams.country }

  const [initialOpportunities, uniqueCountries, totalOpportunitiesCount] =
    await Promise.all([
      getOpportunities({ page: 1, filters }),
      getOpportunityCountries(),
      getTotalOpportunitiesCount({ filters }),
    ])

  return (
    <div className="max-w-5xl mx-auto w-full">
      <Suspense fallback={<SkeletonLoader count={OPPORTUNITIES_PER_PAGE} />}>
        <OpportunitiesView
          initialOpportunities={initialOpportunities}
          uniqueCountries={uniqueCountries}
          totalCount={totalOpportunitiesCount}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  )
}

const SkeletonLoader = ({ count }) => (
  <div className="max-w-5xl mx-auto space-y-4 px-4 sm:px-0">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)
