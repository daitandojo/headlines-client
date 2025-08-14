// src/app/(main)/layout.js (version 8.1)
import { getTotalArticleCount } from '@/actions/articles'
import { getTotalEventCount } from '@/actions/events'
import { getTotalOpportunitiesCount } from '@/actions/opportunities'
import { Providers } from '../providers'
import { Header } from '@/components/Header'
import { MainNavTabs } from '@/components/MainNavTabs'
import { ConditionalLayout } from '@/components/ConditionalLayout'

/**
 * This is now a pure, stable Server Component layout.
 * It fetches data and renders the primary structure.
 */
export default async function MainLayout({ children }) {
  // Fetch all data required for the Header.
  const [articleCount, eventCount, opportunityCount] = await Promise.all([
    getTotalArticleCount(),
    getTotalEventCount(),
    getTotalOpportunitiesCount(),
  ])

  return (
    <Providers>
      {/*
        The ConditionalLayout is a client component that decides whether to
        render the full shell or just the children (for the chat page).
      */}
      <ConditionalLayout>
        {/* The Header scrolls away with the content. */}
        <Header
          articleCount={articleCount}
          eventCount={eventCount}
          opportunityCount={opportunityCount}
        />
        {/* The MainNavTabs are in a sticky container to keep them visible. */}
        <div className="sticky top-[5px] z-30 my-4">
          <MainNavTabs />
        </div>
        {/* The main content area that scrolls underneath the tabs. */}
        <main className="flex-grow flex flex-col">{children}</main>
      </ConditionalLayout>
    </Providers>
  )
}
