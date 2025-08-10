"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TabSwitcher({ currentView, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (newView) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', newView);
    // Reset page to 1 when switching views
    params.set('page', '1'); 
    router.push(`${pathname}?${params.toString()}`);
  };

  const [eventsContent, articlesContent] = children;

  return (
    <Tabs value={currentView} onValueChange={handleTabChange} className="w-full">
      <div className="flex justify-center mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="events">Synthesized Events</TabsTrigger>
          <TabsTrigger value="articles">Raw Intelligence</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="events">
        {eventsContent}
      </TabsContent>
      <TabsContent value="articles">
        {articlesContent}
      </TabsContent>
    </Tabs>
  );
}