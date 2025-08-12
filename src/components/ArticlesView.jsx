import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { ArticleList } from '@/components/ArticleList';
import { PaginationControls } from '@/components/PaginationControls';
import { ARTICLES_PER_PAGE } from '@/config/constants';

export async function ArticlesView({ searchParams }) {
  const page = parseInt(searchParams.page) || 1;
  const searchTerm = searchParams.q || '';
  const sourceFilter = searchParams.source || '';
  const countryFilter = searchParams.country || '';
  
  await dbConnect();

  const queryFilter = {};

  if (searchTerm) {
    const searchRegex = { $regex: searchTerm, $options: 'i' };
    queryFilter.$or = [
      { headline: searchRegex },
      { assessment_article: searchRegex },
      { 'key_individuals.name': searchRegex },
    ];
  }
  if (sourceFilter) {
    queryFilter.newspaper = sourceFilter;
  }
  if (countryFilter) {
    queryFilter.country = countryFilter;
  }

  const totalArticlesPromise = Article.countDocuments(queryFilter);
  const articlesPromise = Article.find(queryFilter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * ARTICLES_PER_PAGE)
    .limit(ARTICLES_PER_PAGE)
    .lean();

  const [totalArticles, articles] = await Promise.all([totalArticlesPromise, articlesPromise]);

  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
    </div>
  );
}