import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { Filters } from '@/components/Filters';
import { ArticleList } from '@/components/ArticleList';
import { PaginationControls } from '@/components/PaginationControls';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ARTICLES_PER_PAGE } from '@/config/constants';

export async function ArticlesView({ searchParams }) {
  const page = parseInt(searchParams.page) || 1;
  const searchTerm = searchParams.q || '';
  const sourceFilter = searchParams.source || '';
  const countryFilter = searchParams.country || '';
  const sortOption = searchParams.sort || 'date_desc';
  
  const minRelevanceRaw = searchParams.min_relevance;
  const minRelevance = (minRelevanceRaw !== undefined && minRelevanceRaw !== '' && !isNaN(parseInt(minRelevanceRaw, 10)))
    ? parseInt(minRelevanceRaw, 10)
    : 10;

  await dbConnect();

  const queryFilter = {
    relevance_headline: { $gte: minRelevance }
  };

  if (searchTerm) {
    const searchRegex = { $regex: searchTerm, $options: 'i' };
    queryFilter.$or = [
      { headline: searchRegex },
      { assessment_article: searchRegex },
      { 'key_individuals.name': searchRegex },
      { 'key_individuals.company': searchRegex },
    ];
  }
  if (sourceFilter) {
    queryFilter.newspaper = sourceFilter;
  }
  if (countryFilter) {
    queryFilter.country = countryFilter;
  }

  let sort = {};
  switch (sortOption) {
    case 'relevance_asc': sort = { relevance_headline: 1, createdAt: -1 }; break;
    case 'relevance_desc': sort = { relevance_headline: -1, createdAt: -1 }; break;
    case 'date_asc': sort = { createdAt: 1 }; break;
    case 'date_desc':
    default: sort = { createdAt: -1 }; break;
  }

  const uniqueSourcesPromise = Article.distinct('newspaper', { newspaper: { $ne: null }});
  const uniqueCountriesPromise = Article.distinct('country', { country: { $ne: null }});
  const totalArticlesPromise = Article.countDocuments(queryFilter);
  const articlesPromise = Article.find(queryFilter)
    .sort(sort)
    .skip((page - 1) * ARTICLES_PER_PAGE)
    .limit(ARTICLES_PER_PAGE)
    .lean();

  const [uniqueSources, uniqueCountries, totalArticles, articles] = await Promise.all([
    uniqueSourcesPromise,
    uniqueCountriesPromise,
    totalArticlesPromise,
    articlesPromise,
  ]);

  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="bg-black/20 backdrop-blur-sm border border-white/10 shadow-2xl shadow-black/30">
        <CardHeader className="border-b border-white/10">
          <Filters uniqueSources={uniqueSources} uniqueCountries={uniqueCountries} />
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <h2 className="text-lg sm:text-xl font-medium text-slate-300">
              Displaying {articles.length} of {totalArticles} raw articles
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