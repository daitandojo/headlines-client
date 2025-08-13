// src/app/(main)/opportunities/page.js (version 8.0)
import { Suspense } from 'react'
import { OpportunitiesView } from '@/components/OpportunitiesView'
import {
  getOpportunities,
  getOpportunityCountries,
  getTotalOpportunitiesCount,
} from '@/actions/opportunities'
import { SkeletonCard } from '@/components/SkeletonCard'

export const metadata = {
  title: 'Opportunities | Headlines',
  description: 'Manage and track wealth management opportunities.',
}

export default async function OpportunitiesPage({ searchParams }) {
  const filters = { country: searchParams.country }

  // This data fetching is now simplified to only get what THIS page needs.
  // The header data is handled by the parent layout.
  const [initialOpportunities, uniqueCountries, totalOpportunitiesCount] =
    await Promise.all([
      getOpportunities({ page: 1, filters }),
      getOpportunityCountries(),
      getTotalOpportunitiesCount({ filters }),
    ])

  // The Header, MainNavTabs, and main page container are now correctly
  // inherited from the shared `src/app/(main)/layout.js` file.
  // This component is now only responsible for its own content.
  return (
    <div className="max-w-5xl mx-auto w-full">
      <Suspense fallback={<SkeletonCard count={5} />}>
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
