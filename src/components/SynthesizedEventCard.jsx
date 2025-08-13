// src/components/SynthesizedEventCard.jsx (version 2.0)
"use client";

import { useTransition } from "react";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, FileText, Trash2, MessageSquarePlus, Mail, Building, Briefcase } from "lucide-react";
import { deleteEvent } from "@/actions/events";
import { getCountryFlag } from "@/lib/countries";
import { useAppStore } from "@/store/use-app-store";

const getRelevanceBadgeClass = (score) => {
  if (score >= 90) return "bg-red-500/20 text-red-300 border border-red-500/30 shadow-lg shadow-red-500/10";
  if (score >= 75) return "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10";
  return "bg-slate-500/20 text-slate-300 border border-slate-500/30";
};

export const SynthesizedEventCard = ({ event }) => {
  const [isPending, startTransition] = useTransition();
  const setChatContextPrompt = useAppStore((state) => state.setChatContextPrompt);
  const router = useRouter();

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

  const handleChatAboutEvent = () => {
    const prompt = `Tell me more about the event: "${event.synthesized_headline}". What are the key implications?`;
    setChatContextPrompt(prompt);
    router.push('/chat');
  };
  
  const flag = getCountryFlag(event.country);
  const formattedDate = new Date(event.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <AccordionItem 
      value={event.event_key} 
      className={`relative border-slate-700 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800/60 shadow-lg shadow-black/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/30 hover:border-blue-500/50 hover:-translate-y-1 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <TooltipProvider delayDuration={100}>
        <div className="p-4">
            {/* --- MOBILE LAYOUT --- */}
            <div className="sm:hidden">
                <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Badge className={`text-sm font-bold px-2.5 py-1 ${getRelevanceBadgeClass(event.highest_relevance_score)}`}>
                            {event.highest_relevance_score}
                        </Badge>
                        <h3 className="font-serif font-bold text-base text-slate-100 line-clamp-2">
                            <span className="text-lg mr-2 align-middle">{flag}</span>
                            {event.synthesized_headline}
                        </h3>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={handleChatAboutEvent} className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 h-8 w-8">
                            <MessageSquarePlus className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={isPending} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the event.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{event.synthesized_summary}</p>
            </div>

            {/* --- DESKTOP LAYOUT --- */}
            <div className="hidden sm:flex items-start gap-6">
                <div className="flex flex-col items-center shrink-0">
                  <Badge className={`text-xl font-bold px-4 py-2 ${getRelevanceBadgeClass(event.highest_relevance_score)}`}>
                    {event.highest_relevance_score}
                  </Badge>
                  <span className="text-xs text-slate-500 mt-1">Score</span>
                </div>
                <div className="flex-grow min-w-0 pr-20">
                  <h3 className="font-serif font-bold text-xl text-slate-100 mb-2">
                    <span className="text-2xl mr-3 align-middle">{flag}</span>
                    {event.synthesized_headline}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">{event.synthesized_summary}</p>
                </div>
                 <div className="absolute top-4 right-4 z-10 flex gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={handleChatAboutEvent} className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 h-8 w-8">
                                <MessageSquarePlus className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ask AI about this event</TooltipContent>
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
                          <TooltipContent>Delete Event</TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the synthesized event.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* --- SHARED FOOTER --- */}
            <div className="mt-4 pt-4 border-t border-slate-800/50 flex flex-col sm:flex-row justify-between items-start gap-4">
               {event.key_individuals && event.key_individuals.length > 0 && (
                <div className="flex items-start gap-3 text-slate-400">
                  <Users className="h-5 w-5 mt-0.5 shrink-0 text-slate-500" />
                  <p className="text-sm font-medium text-slate-300">
                    {event.key_individuals.length} Key Individual(s) Identified
                  </p>
                </div>
              )}
              {event.ai_assessment_reason && (
                  <p className="text-xs text-slate-500 italic sm:text-right flex-grow">
                    {event.ai_assessment_reason}
                  </p>
              )}
            </div>
        </div>
      </TooltipProvider>

      <AccordionTrigger className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:no-underline rounded-b-xl bg-black/20 hover:bg-slate-800/50">
        <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Show Intelligence Details & Sources</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-4 pt-4">
        {/* --- OVERHAULED DETAILS SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Individuals Column */}
          {event.key_individuals && event.key_individuals.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-slate-300 mb-2 border-b border-slate-700 pb-1">Key Individuals</h4>
              {event.key_individuals.map((person, index) => (
                <div key={index} className="p-3 rounded-md bg-slate-800/50">
                  <p className="font-bold text-slate-100 flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" /> {person.name}
                  </p>
                  <div className="pl-6 space-y-1 mt-1 text-sm text-slate-400">
                    {person.role_in_event && (
                      <p className="flex items-center gap-2">
                        <Briefcase className="h-3 w-3" /> {person.role_in_event}
                      </p>
                    )}
                    {person.company && (
                       <p className="flex items-center gap-2">
                        <Building className="h-3 w-3" /> {person.company}
                      </p>
                    )}
                    {person.email_suggestion && (
                      <a href={`mailto:${person.email_suggestion}`} className="flex items-center gap-2 text-blue-400 hover:underline">
                        <Mail className="h-3 w-3" /> {person.email_suggestion}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Source Articles Column */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-slate-300 mb-2 border-b border-slate-700 pb-1">Source Articles ({event.source_articles.length})</h4>
            {event.source_articles.map(article => (
              <a key={article.link} href={article.link} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-md bg-slate-800/50 hover:bg-slate-800/80 transition-colors">
                  <p className="font-medium text-slate-200 line-clamp-1 text-sm">{article.headline}</p>
                  <p className="text-xs text-slate-400">{article.newspaper}</p>
              </a>
            ))}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};