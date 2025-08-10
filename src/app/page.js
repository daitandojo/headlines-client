import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { ArticlesView } from '@/components/ArticlesView';
import { EventsView } from '@/components/EventsView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = 'force-dynamic';

export default function HomePage({ searchParams }) {
  const currentView = searchParams.view || 'events';

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header />
      <Tabs defaultValue={currentView} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="events">Synthesized Events</TabsTrigger>
            <TabsTrigger value="articles">Raw Intelligence</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="events">
          <Suspense fallback={<div className="text-center text-slate-400 p-10">Loading Events...</div>}>
            <EventsView searchParams={searchParams} />
          </Suspense>
        </TabsContent>

        <TabsContent value="articles">
          <Suspense fallback={<div className="text-center text-slate-400 p-10">Loading Intelligence...</div>}>
            <ArticlesView searchParams={searchParams} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}