'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from './ui/button';
import { X } from 'lucide-react';

export const Filters = ({ uniqueSources, uniqueCountries }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    min_relevance: searchParams.get('min_relevance') || '10',
    source: searchParams.get('source') || '',
    country: searchParams.get('country') || '',
    sort: searchParams.get('sort') || 'date_desc',
  });

  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    Object.keys(debouncedFilters).forEach(key => {
      const value = debouncedFilters[key];
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters, pathname, router]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const clearFilters = () => {
    const newFilters = { q: '', min_relevance: '10', source: '', country: '', sort: 'date_desc' };
    setFilters(newFilters);
  };
  
  const hasActiveFilters = filters.q || filters.min_relevance !== '10' || filters.source || filters.country;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-4 gap-y-6 items-end">
      {/* Search Input */}
      <div className="space-y-2 lg:col-span-2 xl:col-span-1">
        <Label htmlFor="search" className="text-slate-300">Search</Label>
        <Input id="search" placeholder="e.g., 'acquisition'..." value={filters.q} onChange={(e) => handleFilterChange('q', e.target.value)} className="bg-slate-900/80 border-slate-700"/>
      </div>

      {/* Country Select */}
      <div className="space-y-2">
        <Label htmlFor="country" className="text-slate-300">Country</Label>
        <Select value={filters.country} onValueChange={(value) => handleFilterChange('country', value === 'all-countries' ? '' : value)}>
          <SelectTrigger id="country" className="w-full bg-slate-900/80 border-slate-700"><SelectValue placeholder="All Countries" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all-countries">All Countries</SelectItem>
            {uniqueCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Source Select */}
      <div className="space-y-2">
        <Label htmlFor="source" className="text-slate-300">Source</Label>
        <Select value={filters.source} onValueChange={(value) => handleFilterChange('source', value === 'all-sources' ? '' : value)}>
          <SelectTrigger id="source" className="w-full bg-slate-900/80 border-slate-700"><SelectValue placeholder="All Sources" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all-sources">All Sources</SelectItem>
            {uniqueSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      
      {/* Sort Select */}
      <div className="space-y-2">
        <Label htmlFor="sort" className="text-slate-300">Sort By</Label>
        <Select value={filters.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
          <SelectTrigger id="sort" className="w-full bg-slate-900/80 border-slate-700"><SelectValue placeholder="Select sorting" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Date (Newest First)</SelectItem>
            <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
            <SelectItem value="relevance_desc">Relevance (High to Low)</SelectItem>
            <SelectItem value="relevance_asc">Relevance (Low to High)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Button */}
      <div className="flex items-end">
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10">
            <X className="mr-2 h-4 w-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
};