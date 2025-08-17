// src/app/(main)/layout.js (version 9.0)
import { getTotalArticleCount } from '@/actions/articles'
import { getTotalEventCount } from '@/actions/events'
import { getTotalOpportunitiesCount } from '@/actions/opportunities'
import { getGlobalCountries } from '@/actions/countries' // <-- Import new action
import { Providers } from '../providers'
import { ConditionalLayout } from '@/components/ConditionalLayout'

/**
 * The main layout is now responsible only for fetching global data.
 * The rendering of the UI shell is delegated to the ConditionalLayout
 * client component, which can react to the current route.
 */
export default async function MainLayout({ children }) {
  // Fetch all data required for the Header and global components.
  const [articleCount, eventCount, opportunityCount, globalCountries] = await Promise.all(
    [
      getTotalArticleCount(),
      getTotalEventCount(),
      getTotalOpportunitiesCount(),
      getGlobalCountries(), // <-- Fetch global countries
    ]
  )

  const layoutProps = {
    articleCount,
    eventCount,
    opportunityCount,
    globalCountries, // <-- Pass down to client
  }

  return (
    <Providers>
      <ConditionalLayout serverProps={layoutProps}>{children}</ConditionalLayout>
    </Providers>
  )
}
