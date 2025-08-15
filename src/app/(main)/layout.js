// src/app/(main)/layout.js (version 8.2)
import { getTotalArticleCount } from '@/actions/articles'
import { getTotalEventCount } from '@/actions/events'
import { getTotalOpportunitiesCount } from '@/actions/opportunities'
import { Providers } from '../providers'
import { ConditionalLayout } from '@/components/ConditionalLayout'

/**
 * The main layout is now responsible only for fetching global data.
 * The rendering of the UI shell is delegated to the ConditionalLayout
 * client component, which can react to the current route.
 */
export default async function MainLayout({ children }) {
  // Fetch all data required for the Header.
  const [articleCount, eventCount, opportunityCount] = await Promise.all([
    getTotalArticleCount(),
    getTotalEventCount(),
    getTotalOpportunitiesCount(),
  ])

  const layoutProps = {
    articleCount,
    eventCount,
    opportunityCount,
  }

  return (
    <Providers>
      <ConditionalLayout serverProps={layoutProps}>{children}</ConditionalLayout>
    </Providers>
  )
}
