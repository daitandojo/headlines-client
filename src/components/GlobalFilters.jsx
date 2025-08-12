"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export function GlobalFilters({ uniqueSources, uniqueCountries }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // useMemo ensures that the initial state is calculated only once
  const initialState = useMemo(() => ({
    q: searchParams.get('q') || '',
    source: searchParams.get('source') || '',
    country: searchParams.get('country') || '',
  }), [searchParams]);

  const [filters, setFilters] = useState(initialState);

  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.keys(debouncedFilters).forEach(key => {
      const value = debouncedFilters[key];
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.set('page', '1'); // Reset page on any filter change
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [debouncedFilters, pathname, router, searchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const clearFilters = () => {
    setFilters({ q: '', source: '', country: '' });
  };
  
  const hasActiveFilters = filters.q || filters.source || filters.country;

  return (
    <Card className="mb-8 bg-black/20 backdrop-blur-sm border-white/10 shadow-lg shadow-black/30">
        <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5 lg:col-span-2">
                    <Label htmlFor="search" className="text-slate-300">Search</Label>
                    <Input id="search" placeholder="Search by name, company, or keyword..." value={filters.q} onChange={(e) => handleFilterChange('q', e.target.value)} className="bg-slate-900/80 border-slate-700"/>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="country" className="text-slate-300">Country</Label>
                    <Select value={filters.country} onValueChange={(value) => handleFilterChange('country', value === 'all-countries' ? '' : value)}>
                        <SelectTrigger id="country" className="w-full bg-slate-900/80 border-slate-700"><SelectValue placeholder="All Countries" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all-countries">All Countries</SelectItem>
                            {uniqueCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-end space-x-2">
                    <div className="space-y-1.5 flex-grow">
                        <Label htmlFor="source" className="text-slate-300">Source</Label>
                        <Select value={filters.source} onValueChange={(value) => handleFilterChange('source', value === 'all-sources' ? '' : value)}>
                            <SelectTrigger id="source" className="w-full bg-slate-900/80 border-slate-700"><SelectValue placeholder="All Sources" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all-sources">All Sources</SelectItem>
                                {uniqueSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="icon" onClick={clearFilters} className="h-9 w-9 shrink-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </CardContent>
    </Card>
  );
}