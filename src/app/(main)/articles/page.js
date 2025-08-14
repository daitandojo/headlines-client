// src/app/(main)/articles/page.js (version 2.2)
import { Suspense } from 'react'
import { ArticlesView } from '@/components/ArticlesView'
import { GlobalFilters } from '@/components/GlobalFilters'
import { ARTICLES_PER_PAGE } from '@/config/constants'
import dbConnect from '@/lib/mongodb'
import Article from '@/models/Article'
import { getArticles } from '@/actions/articles'
import { LoadingOverlay } from '@/components/LoadingOverlay'

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

  return (
    <>
      <GlobalFilters uniqueCountries={uniqueCountries} />
      <Suspense fallback={<LoadingOverlay isLoading={true} text="Loading Articles..." />}>
        <ArticlesView initialArticles={initialArticles} searchParams={searchParams} />
      </Suspense>
    </>
  )
}
