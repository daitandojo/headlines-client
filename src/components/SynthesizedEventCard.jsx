"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from "sonner";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, FileText, Trash2 } from "lucide-react";
import { deleteEvent } from "@/actions/events";
import { getCountryFlag } from "@/lib/countries";

const getRelevanceBadgeClass = (score) => {
  if (score >= 90) return "bg-red-500/20 text-red-300 border border-red-500/30 shadow-lg shadow-red-500/10";
  if (score >= 75) return "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10";
  return "bg-slate-500/20 text-slate-300 border border-slate-500/30";
};

export const SynthesizedEventCard = ({ event }) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearchByName = (name) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', `"${name}"`);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteEvent(event._id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const flag = getCountryFlag(event.country);

  return (
    <AccordionItem 
      value={event.event_key} 
      className={`relative border-slate-700 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800/60 shadow-lg shadow-black/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/30 hover:border-blue-500/50 hover:-translate-y-1 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <TooltipProvider delayDuration={100}>
        <div className="absolute top-4 right-4 z-10">
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isPending} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Delete Event</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the synthesized event. It will not delete the source articles.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center shrink-0">
              <Badge className={`text-xl font-bold px-4 py-2 ${getRelevanceBadgeClass(event.highest_relevance_score)}`}>
                {event.highest_relevance_score}
              </Badge>
              <span className="text-xs text-slate-500 mt-1">Score</span>
            </div>
            
            <div className="flex-grow min-w-0 pr-8">
              <h3 className="font-serif font-bold text-xl text-slate-100 mb-2">
                <span className="text-2xl mr-3 align-middle">{flag}</span>
                {event.synthesized_headline}
              </h3>
              <p className="text-slate-300 leading-relaxed mb-4">{event.synthesized_summary}</p>
              
              {event.key_individuals && event.key_individuals.length > 0 && (
                <div className="flex items-start gap-3 mb-4 text-slate-400">
                  <Users className="h-5 w-5 mt-1 shrink-0 text-slate-500" />
                  <div>
                    <h4 className="font-semibold text-sm text-slate-300">Key Individuals</h4>
                    <div className="text-sm">
                      {event.key_individuals.map((p, index) => (
                        <span key={p.name}>
                          <button onClick={() => handleSearchByName(p.name)} className="text-left hover:underline text-blue-400/80 hover:text-blue-400">{p.name}</button>
                          <span className="text-slate-500"> ({p.role_in_event})</span>
                          {index < event.key_individuals.length - 1 && <span className="mx-2 text-slate-600">•</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {event.ai_assessment_reason && (
                  <p className="text-xs text-slate-500 italic border-l-2 border-slate-700 pl-3">
                    {event.ai_assessment_reason}
                  </p>
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>
      
      <AccordionTrigger className="px-6 py-2 text-sm text-slate-400 hover:text-slate-200 hover:no-underline rounded-b-xl bg-black/20 hover:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>Show {event.source_articles.length} Source Article(s)</span>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="p-6 pt-4">
        <div className="border-t border-slate-700/50 pt-4 space-y-3">
          {event.source_articles.map(article => (
            <a key={article.link} href={article.link} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-md bg-slate-800/50 hover:bg-slate-800/80 transition-colors">
              <p className="font-medium text-slate-200 line-clamp-1">{article.headline}</p>
              <p className="text-xs text-slate-400">{article.newspaper}</p>
            </a>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};