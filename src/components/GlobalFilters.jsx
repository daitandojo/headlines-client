// src/components/GlobalFilters.jsx (version 2.0)
'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from './ui/card'
import { Search, Globe, ArrowUpDown, X } from 'lucide-react'

export function GlobalFilters({ uniqueCountries }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialState = useMemo(
    () => ({
      q: searchParams.get('q') || '',
      country: searchParams.get('country') || '',
      sort: searchParams.get('sort') || 'date_desc',
    }),
    [searchParams]
  )

  const [filters, setFilters] = useState(initialState)
  const debouncedFilters = useDebounce(filters, 500)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    Object.keys(debouncedFilters).forEach((key) => {
      const value = debouncedFilters[key]
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [debouncedFilters, pathname, router, searchParams])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ q: '', country: '', sort: 'date_desc' })
  }

  const hasActiveFilters = filters.q || filters.country

  return (
    <Card className="mb-8 bg-black/20 backdrop-blur-sm border-white/10 shadow-xl shadow-black/40">
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-4 items-end">
          {/* --- Search Input (takes more space on desktop) --- */}
          <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
            <Label htmlFor="search" className="text-slate-300 flex items-center">
              <Search className="h-4 w-4 mr-2" /> Search
            </Label>
            <div className="relative">
              <Input
                id="search"
                placeholder="Search by name, company, or keyword..."
                value={filters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                className="bg-slate-900/80 border-slate-700 h-11"
              />
            </div>
          </div>

          {/* --- Country Select --- */}
          <div className="space-y-1.5 lg:pl-6 lg:border-l lg:border-slate-700/60">
            <Label htmlFor="country" className="text-slate-300 flex items-center">
              <Globe className="h-4 w-4 mr-2" /> Country
            </Label>
            <Select
              value={filters.country}
              onValueChange={(value) =>
                handleFilterChange('country', value === 'all-countries' ? '' : value)
              }
            >
              <SelectTrigger
                id="country"
                className="w-full bg-slate-900/80 border-slate-700 h-11"
              >
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-countries">All Countries</SelectItem>
                {uniqueCountries.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* --- Sort Select --- */}
          <div className="space-y-1.5 lg:pl-6 lg:border-l lg:border-slate-700/60">
            <Label htmlFor="sort" className="text-slate-300 flex items-center">
              <ArrowUpDown className="h-4 w-4 mr-2" /> Sort By
            </Label>
            <Select
              value={filters.sort}
              onValueChange={(value) => handleFilterChange('sort', value)}
            >
              <SelectTrigger
                id="sort"
                className="w-full bg-slate-900/80 border-slate-700 h-11"
              >
                <SelectValue placeholder="Select sorting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Date (Newest First)</SelectItem>
                <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
                <SelectItem value="relevance_desc">Relevance (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* --- Clear Button (conditional) --- */}
          <div className="flex items-end justify-end h-11 lg:pl-6 lg:border-l lg:border-slate-700/60">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="w-full lg:w-auto text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-full clear-filters-button"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
