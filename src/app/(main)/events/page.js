// src/app/(main)/events/page.js (version 2.1)
import { Suspense } from 'react'
import { EventsView } from '@/components/EventsView'
import { GlobalFilters } from '@/components/GlobalFilters'
import { SkeletonCard } from '@/components/SkeletonCard'
import { EVENTS_PER_PAGE } from '@/config/constants'
import dbConnect from '@/lib/mongodb'
import SynthesizedEvent from '@/models/SynthesizedEvent'
import { getEvents } from '@/actions/events'

async function getData(searchParams) {
  await dbConnect()
  const query = { country: { $ne: null }, highest_relevance_score: { $gt: 25 } }

  const uniqueCountriesPromise = SynthesizedEvent.distinct('country', query)
  const initialEventsPromise = getEvents({
    page: 1,
    filters: { q: searchParams.q, country: searchParams.country },
    sort: searchParams.sort,
  })

  const [uniqueCountries, initialEvents] = await Promise.all([
    uniqueCountriesPromise,
    initialEventsPromise,
  ])
  return { uniqueCountries, initialEvents }
}

export default async function EventsPage({ searchParams }) {
  const { uniqueCountries, initialEvents } = await getData(searchParams)

  // The layout is now handled by the parent `layout.js` file.
  return (
    <>
      <GlobalFilters uniqueCountries={uniqueCountries} />
      <Suspense fallback={<SkeletonLoader count={EVENTS_PER_PAGE} />}>
        <EventsView initialEvents={initialEvents} searchParams={searchParams} />
      </Suspense>
    </>
  )
}

const SkeletonLoader = ({ count }) => (
  <div className="max-w-5xl mx-auto space-y-4 px-4 sm:px-0">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)
