"use client";

import { useTransition } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink } from "lucide-react";
import { deleteArticle } from "@/actions/articles";

const getRelevanceBadgeClass = (score) => {
  if (score >= 90) return "bg-red-500/20 text-red-300 border border-red-500/30 shadow-lg shadow-red-500/10";
  if (score >= 75) return "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10";
  return "bg-slate-500/20 text-slate-300 border border-slate-500/30";
};

export const ArticleCard = ({ article }) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Are you sure you want to permanently delete this article?")) {
      startTransition(() => {
        deleteArticle(article._id).catch(err => alert("Deletion failed."));
      });
    }
  };

  return (
    <AccordionItem 
      value={article._id} 
      className="border-slate-700 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800/60 shadow-lg shadow-black/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/30 hover:border-blue-500/50 hover:-translate-y-1"
    >
      {/* Change: Use items-start to align elements to the top when text wraps */}
      <div className="flex items-start justify-between p-4">
        <AccordionTrigger className="flex-grow p-0 hover:no-underline text-left">
          {/* Change: Use items-start to align badge with the first line of text */}
          <div className="flex items-start gap-4 w-full">
            {/* Change: Add a slight top margin to the badge for better visual alignment with text */}
            <Badge className={`text-base font-bold px-3 py-1 shrink-0 mt-1 ${getRelevanceBadgeClass(article.relevance_article)}`}>
              {article.relevance_article}
            </Badge>
            <div className="flex-grow min-w-0">
              {/* FIX: Removed 'truncate' to allow the headline to wrap */}
              <p className="font-serif font-bold text-lg text-slate-100">
                {article.headline}
              </p>
              <p className="text-sm text-slate-400 mt-1">{article.newspaper}</p>
            </div>
          </div>
        </AccordionTrigger>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(article.link, '_blank')}
            className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
            title="Open in new tab"
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            title="Delete article"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <AccordionContent className="p-6 pt-0">
        <div className="border-t border-slate-700/50 pt-6 space-y-6">
          <div>
            <h4 className="font-semibold text-md text-slate-300 mb-2">AI Assessment</h4>
            {/* Fix: Added break-words to prevent overflow from long unbroken strings */}
            <p className="text-slate-400 italic break-words">"{article.assessment_article}"</p>
          </div>
          <div className="max-h-60 overflow-y-auto pr-4">
            <h4 className="font-semibold text-md text-slate-300 mb-2">Article Content</h4>
            {/* Fix: Added break-words for safety */}
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap font-serif break-words">
              {article.articleContent.contents.join('\n\n')}
            </p>
          </div>
          {article.key_individuals && article.key_individuals.length > 0 && (
            <div>
              <h4 className="font-semibold text-md text-slate-300 mb-2">Key Individuals & Contacts</h4>
              <ul className="list-disc list-inside text-slate-400">
                {article.key_individuals.map(person => (
                  <li key={person.name}>
                    <strong>{person.name}</strong> ({person.role_in_event} at {person.company})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};