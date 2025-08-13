// src/app/(main)/articles/page.js (version 2.0)
import { Suspense } from 'react'
import { ArticlesView } from '@/components/ArticlesView'
import { GlobalFilters } from '@/components/GlobalFilters'
import { SkeletonCard } from '@/components/SkeletonCard'
import { ARTICLES_PER_PAGE } from '@/config/constants'
import dbConnect from '@/lib/mongodb'
import Article from '@/models/Article'
import { getArticles } from '@/actions/articles'

// This page no longer needs to fetch counts for the header, as the layout now handles it.
async function getData(searchParams) {
  await dbConnect()
  const query = {
    country: { $ne: null },
    $or: [{ relevance_article: { $gt: 25 } }, { relevance_headline: { $gt: 25 } }],
  }

  const uniqueCountriesPromise = Article.distinct('country', query)
  const initialArticlesPromise = getArticles({
    page: 1,
    filters: { q: searchParams.q, country: searchParams.country },
    sort: searchParams.sort,
  })

  const [uniqueCountries, initialArticles] = await Promise.all([
    uniqueCountriesPromise,
    initialArticlesPromise,
  ])
  return { uniqueCountries, initialArticles }
}

export default async function ArticlesPage({ searchParams }) {
  const { uniqueCountries, initialArticles } = await getData(searchParams)

  // The layout is now handled by the parent `layout.js` file.
  // This component only needs to render its specific content.
  return (
    <>
      <GlobalFilters uniqueCountries={uniqueCountries} />
      <Suspense fallback={<SkeletonLoader count={ARTICLES_PER_PAGE} />}>
        <ArticlesView initialArticles={initialArticles} searchParams={searchParams} />
      </Suspense>
    </>
  )
}

const SkeletonLoader = ({ count }) => (
  <div className="max-w-5xl mx-auto space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)
