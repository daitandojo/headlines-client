// src/components/GlobalFilters.jsx (version 1.3)
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

export function GlobalFilters({ uniqueCountries }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialState = useMemo(() => ({
    q: searchParams.get('q') || '',
    country: searchParams.get('country') || '',
    sort: searchParams.get('sort') || 'date_desc',
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

    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [debouncedFilters, pathname, router, searchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const clearFilters = () => {
    setFilters({ q: '', country: '', sort: 'date_desc' });
  };
  
  const hasActiveFilters = filters.q || filters.country || filters.sort !== 'date_desc';

  return (
    <Card className="mb-8 bg-black/20 backdrop-blur-sm border-white/10 shadow-lg shadow-black/30">
        <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
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
                        <Label htmlFor="sort" className="text-slate-300">Sort By</Label>
                        <Select value={filters.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
                          <SelectTrigger id="sort" className="w-full bg-slate-900/80 border-slate-700"><SelectValue placeholder="Select sorting" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date_desc">Date (Newest First)</SelectItem>
                            <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
                            <SelectItem value="relevance_desc">Relevance (High to Low)</SelectItem>
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