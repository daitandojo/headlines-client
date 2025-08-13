// src/app/(main)/layout.js (version 2.0)
import { Header } from '@/components/Header'
import { MainNavTabs } from '@/components/MainNavTabs'
import { getTotalArticleCount } from '@/actions/articles'
import { getTotalEventCount } from '@/actions/events'

/**
 * This shared layout provides a consistent header, navigation, and
 * page structure for all main application views (Events, Articles, Opportunities).
 */
export default async function MainLayout({ children }) {
  // Fetch data required by the shared Header component.
  const [articleCount, eventCount] = await Promise.all([
    getTotalArticleCount(),
    getTotalEventCount(),
  ])

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col min-h-screen">
      <Header articleCount={articleCount} eventCount={eventCount} />
      <MainNavTabs />
      <main className="flex-grow flex flex-col mt-8">{children}</main>
    </div>
  )
}
