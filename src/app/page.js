import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { ArticlesView } from '@/components/ArticlesView';
import { EventsView } from '@/components/EventsView';
import { TabSwitcher } from '@/components/TabSwitcher';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ARTICLES_PER_PAGE, EVENTS_PER_PAGE } from '@/config/constants';

export const dynamic = 'force-dynamic';

export default function HomePage({ searchParams }) {
  const currentView = searchParams.view || 'events';

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header />
      <TabSwitcher currentView={currentView}>
        {/* The children of TabSwitcher are the TabsContent components */}
        <Suspense fallback={<SkeletonLoader count={EVENTS_PER_PAGE} />}>
          <EventsView searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<SkeletonLoader count={ARTICLES_PER_PAGE} />}>
          <ArticlesView searchParams={searchParams} />
        </Suspense>
      </TabSwitcher>
    </div>
  );
}

// Helper component to render multiple skeletons
const SkeletonLoader = ({ count }) => (
  <div className="max-w-5xl mx-auto space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);