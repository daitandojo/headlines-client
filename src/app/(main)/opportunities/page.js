// src/app/(main)/opportunities/page.js (version 5.0)
import { Suspense } from 'react'
import { MainNavTabs } from '@/components/MainNavTabs'
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

  // Fetch all necessary data for the view and its new integrated header concurrently.
  const [initialOpportunities, uniqueCountries, totalCount] = await Promise.all([
    getOpportunities({ page: 1, filters }),
    getOpportunityCountries(),
    getTotalOpportunitiesCount({ filters }),
  ])

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col min-h-screen">
      <MainNavTabs />
      <main className="flex-grow flex flex-col mt-8 max-w-5xl mx-auto w-full">
        {/* 
                  The OpportunitiesView component is now self-contained and handles its own header.
                  We pass all the necessary data directly to it.
                */}
        <Suspense fallback={<SkeletonCard count={5} />}>
          <OpportunitiesView
            initialOpportunities={initialOpportunities}
            uniqueCountries={uniqueCountries}
            totalCount={totalCount}
            searchParams={searchParams}
          />
        </Suspense>
      </main>
    </div>
  )
}
