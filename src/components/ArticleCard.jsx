// src/components/ArticleCard.jsx (version 2.0)
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, ExternalLink } from "lucide-react";
import { deleteArticle } from "@/actions/articles";
import { getCountryFlag } from "@/lib/countries";

const getRelevanceBadgeClass = (score) => {
  if (score >= 90) return "bg-red-500/20 text-red-300 border border-red-500/30 shadow-lg shadow-red-500/10";
  if (score >= 75) return "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10";
  return "bg-slate-500/20 text-slate-300 border border-slate-500/30";
};

export const ArticleCard = ({ article }) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteArticle(article._id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const flag = getCountryFlag(article.country);
  const formattedDate = new Date(article.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const relevanceScore = article.relevance_article || article.relevance_headline;

  return (
    <AccordionItem
      value={article._id}
      className={`border-slate-700 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800/60 shadow-lg shadow-black/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/30 hover:border-blue-500/50 hover:-translate-y-1 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <TooltipProvider delayDuration={100}>
        <div className="p-4">
            {/* --- RESPONSIVE HEADER --- */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Badge className={`text-sm font-bold px-2.5 py-1 ${getRelevanceBadgeClass(relevanceScore)}`}>
                      {relevanceScore}
                    </Badge>
                    <span className="text-lg hidden sm:inline">{flag}</span>
                    <p className="text-xs sm:text-sm text-slate-400 truncate">{article.newspaper}</p>
                </div>
                <div className="flex items-center flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => window.open(article.link, '_blank')} className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open in new tab</TooltipContent>
                  </Tooltip>
                  <AlertDialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isPending} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Delete article</TooltipContent>
                    </Tooltip>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the article from the database.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
            </div>

            <AccordionTrigger className="p-0 hover:no-underline text-left">
              <div className="flex-grow min-w-0">
                <p className="font-serif font-bold text-base sm:text-lg text-slate-100 line-clamp-3">
                  <span className="text-lg sm:hidden mr-2">{flag}</span>
                  {article.headline_en || `(en N/S): ${article.headline}`}
                </p>
              </div>
            </AccordionTrigger>
        </div>
      </TooltipProvider>

      <AccordionContent className="p-4 pt-0">
        <div className="border-t border-slate-700/50 pt-4 mt-2 space-y-4">
          {article.assessment_article && (
            <div>
              <h4 className="font-semibold text-sm text-slate-300 mb-1">Intelligence Analysis</h4>
              <p className="text-sm text-slate-400 italic break-words">"{article.assessment_article}"</p>
            </div>
          )}
          {article.key_individuals && article.key_individuals.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-slate-300 mb-1">Key Individuals & Contacts</h4>
              <ul className="list-disc list-inside text-sm text-slate-400">
                {article.key_individuals.map(person => (
                  <li key={person.name}>
                    <strong>{person.name}</strong> ({person.role_in_event} at {person.company})
                    {person.email_suggestion && <span className="text-xs text-slate-500 ml-2">{person.email_suggestion}</span>}
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