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

  return (
    <AccordionItem
      value={article._id}
      className={`border-slate-700 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800/60 shadow-lg shadow-black/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/30 hover:border-blue-500/50 hover:-translate-y-1 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <TooltipProvider delayDuration={100}>
        <div className="flex items-start gap-4 p-4">
          <div className="flex flex-col items-center gap-y-2 shrink-0">
            <Badge className={`text-base font-bold px-3 py-1 ${getRelevanceBadgeClass(article.relevance_article || article.relevance_headline)}`}>
              {article.relevance_article || article.relevance_headline}
            </Badge>
            <div className="flex gap-1">
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
                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the article from the database.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <AccordionTrigger className="flex-grow p-0 hover:no-underline text-left">
            <div className="flex-grow min-w-0">
              <p className="font-serif font-bold text-lg text-slate-100 line-clamp-2">{article.headline}</p>
              <p className="text-sm text-slate-400 mt-1">{article.newspaper}</p>
            </div>
          </AccordionTrigger>
        </div>
      </TooltipProvider>

      <AccordionContent className="p-6 pt-0">
        <div className="border-t border-slate-700/50 pt-6 space-y-6">
          {article.assessment_article && (
            <div>
              <h4 className="font-semibold text-md text-slate-300 mb-2">Intelligence Analysis</h4>
              <p className="text-slate-400 italic break-words">"{article.assessment_article}"</p>
            </div>
          )}
          {article.key_individuals && article.key_individuals.length > 0 && (
            <div>
              <h4 className="font-semibold text-md text-slate-300 mb-2">Key Individuals & Contacts</h4>
              <ul className="list-disc list-inside text-slate-400">
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