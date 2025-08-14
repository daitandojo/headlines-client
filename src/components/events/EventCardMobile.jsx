// src/components/events/EventCardMobile.jsx (version 1.0)
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, MessageSquarePlus, Users } from 'lucide-react'
import { getCountryFlag } from '@/lib/countries'

const getRelevanceBadgeClass = (score) => {
  if (score >= 90) return 'bg-red-500/20 text-red-300 border border-red-500/30'
  if (score >= 75) return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
  return 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
}

export function EventCardMobile({ event, onChat, onDelete, isPending }) {
  if (!event) return null
  const flag = getCountryFlag(event.country)

  return (
    <div className="sm:hidden">
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge
            className={`text-sm font-bold px-2 py-0.5 ${getRelevanceBadgeClass(event.highest_relevance_score)}`}
          >
            {event.highest_relevance_score}
          </Badge>
          <h3 className="font-serif font-bold text-base text-slate-100 line-clamp-2">
            <span className="text-lg mr-2 align-middle">{flag}</span>
            {event.synthesized_headline}
          </h3>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onChat}
            className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 h-8 w-8"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={(e) => e.stopPropagation()}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the event.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">
        {event.synthesized_summary}
      </p>
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
  )
}
