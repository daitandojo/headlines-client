// src/components/ArticlesView.jsx (version 2.0)
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { Filters } from '@/components/Filters';
import { ArticleList } from '@/components/ArticleList';
import { PaginationControls } from '@/components/PaginationControls';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const ARTICLES_PER_PAGE = 10;

export async function ArticlesView({ searchParams }) {
  const page = parseInt(searchParams.page) || 1;
  const searchTerm = searchParams.q || '';
  const sourceFilter = searchParams.source || 'all';
  const sortOption = searchParams.sort || 'date_desc';
  
  const minRelevanceRaw = searchParams.min_relevance;
  const minRelevance = (minRelevanceRaw !== undefined && minRelevanceRaw !== '' && !isNaN(parseInt(minRelevanceRaw, 10)))
    ? parseInt(minRelevanceRaw, 10)
    : 10;

  await dbConnect();

  const queryFilter = {
    relevance_article: { $gte: minRelevance }
  };

  if (searchTerm) {
    const searchRegex = { $regex: searchTerm, $options: 'i' };
    queryFilter.$or = [
      { headline: searchRegex },
      { assessment_article: searchRegex },
      // CRITICAL FIX: Removed the search against 'articleContent.contents' as it no longer exists.
    ];
  }
  if (sourceFilter && sourceFilter !== 'all') {
    queryFilter.newspaper = sourceFilter;
  }

  let sort = {};
  switch (sortOption) {
    case 'relevance_asc': sort = { relevance_article: 1 }; break;
    case 'relevance_desc': sort = { relevance_article: -1 }; break;
    case 'date_asc': sort = { createdAt: 1 }; break;
    case 'date_desc':
    default: sort = { createdAt: -1 }; break;
  }

  const uniqueSourcesPromise = Article.distinct('newspaper');
  const totalArticlesPromise = Article.countDocuments(queryFilter);
  const articlesPromise = Article.find(queryFilter)
    .sort(sort)
    .skip((page - 1) * ARTICLES_PER_PAGE)
    .limit(ARTICLES_PER_PAGE)
    .lean();

  const [uniqueSources, totalArticles, articles] = await Promise.all([
    uniqueSourcesPromise,
    totalArticlesPromise,
    articlesPromise,
  ]);

  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="bg-black/20 backdrop-blur-sm border border-white/10 shadow-2xl shadow-black/30">
        <CardHeader className="border-b border-white/10">
          <Filters uniqueSources={['all', ...uniqueSources]} />
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* This container now stacks on mobile and goes horizontal on larger screens */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <h2 className="text-lg sm:text-xl font-medium text-slate-300">
              Displaying {articles.length} of {totalArticles} articles
            </h2>
            {totalPages > 1 && (
              <PaginationControls totalPages={totalPages} currentPage={page} />
            )}
          </div>
          
          {articles.length > 0 ? (
            <ArticleList articles={JSON.parse(JSON.stringify(articles))} />
          ) : (
            <div className="text-center text-gray-500 py-20 rounded-lg bg-black/20 border border-white/10">
              <p>No articles found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}