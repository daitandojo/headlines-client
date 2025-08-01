import { Accordion } from '@/components/ui/accordion';
import { ArticleCard } from '@/components/ArticleCard';

export const ArticleList = ({ articles }) => {
  return (
    <Accordion type="single" collapsible className="w-full space-y-2">
      {articles.map((article) => (
        <ArticleCard key={article._id} article={article} />
      ))}
    </Accordion>
  );
};