'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Filters = ({ uniqueSources }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); 
    router.push(`${pathname}?${params.toString()}`);
  };
  
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query !== (searchParams.get('q') || '')) {
        handleFilterChange('q', query);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    // This now uses a 2-column grid on mobile and 4 columns on medium screens and up
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 items-end">
      <div className="space-y-2">
        <Label htmlFor="search" className="text-slate-300">Search</Label>
        <Input
          id="search"
          type="text"
          placeholder="e.g., 'acquisition'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-slate-900/80 border-slate-700 ring-offset-background focus-visible:ring-ring"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="min_relevance" className="text-slate-300">Min. Relevance</Label>
        <Input
          id="min_relevance"
          type="number"
          placeholder="e.g., 10"
          min="0"
          max="100"
          defaultValue={searchParams.get('min_relevance') ?? '10'}
          onChange={(e) => handleFilterChange('min_relevance', e.target.value)}
          className="bg-slate-900/80 border-slate-700 ring-offset-background focus-visible:ring-ring"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="source" className="text-slate-300">Source</Label>
        <Select
          defaultValue={searchParams.get('source') || 'all'}
          onValueChange={(value) => handleFilterChange('source', value)}
        >
          <SelectTrigger id="source" className="w-full bg-slate-900/80 border-slate-700 ring-offset-background focus:ring-ring">
            <SelectValue placeholder="Select a source" />
          </SelectTrigger>
          <SelectContent>
            {uniqueSources.map(source => (
              <SelectItem key={source} value={source}>
                {source === 'all' ? 'All Sources' : source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sort" className="text-slate-300">Sort By</Label>
        <Select
          defaultValue={searchParams.get('sort') || 'date_desc'}
          onValueChange={(value) => handleFilterChange('sort', value)}
        >
          <SelectTrigger id="sort" className="w-full bg-slate-900/80 border-slate-700 ring-offset-background focus:ring-ring">
            <SelectValue placeholder="Select sorting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Date (Newest First)</SelectItem>
            <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
            <SelectItem value="relevance_desc">Relevance (High to Low)</SelectItem>
            <SelectItem value="relevance_asc">Relevance (Low to High)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};