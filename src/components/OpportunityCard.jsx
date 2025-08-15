// src/components/OpportunityCard.jsx (version 8.2)
'use client'

import { Card, CardContent } from '@/components/ui/card'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ExternalLink, User, Briefcase, MapPin, Trash2, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SwipeToDelete } from './swipe/SwipeToDelete'
import { cn } from '@/lib/utils'

export function OpportunityCard({ opportunity, onDelete, isDeleting }) {
  const handleDelete = (e) => {
    if (e) e.preventDefault()
    onDelete()
  }

  const sourceArticle = opportunity.sourceArticleId
  const { contactDetails } = opportunity
  const isPremiumOpportunity = opportunity.likelyMMDollarWealth > 49

  return (
    <Card
      className={cn(
        'bg-slate-900/50 border border-slate-700/80 transition-all duration-300 ease-out overflow-hidden',
        isDeleting ? 'opacity-50' : 'opacity-100',
        isPremiumOpportunity && 'card-glow impatient-wobble'
      )}
    >
      <SwipeToDelete onDelete={handleDelete}>
        <CardContent className="p-4 space-y-3 bg-slate-900/50 relative z-10">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 space-y-1">
              <p className="font-bold text-base text-slate-100 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                {opportunity.reachOutTo}
              </p>
              {opportunity.basedIn && (
                <p className="text-xs text-slate-400 flex items-center gap-2 pl-6">
                  <MapPin className="h-3 w-3" /> {opportunity.basedIn}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {opportunity.likelyMMDollarWealth > 0 && (
                <Badge variant="outline" className="border-green-500/50 text-green-300">
                  ${opportunity.likelyMMDollarWealth}M
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isDeleting}
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(sourceArticle?.link, '_blank')
                      }}
                    >
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Source Article</p>
                  </TooltipContent>
                </Tooltip>
                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isDeleting}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-400" />
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete Opportunity</p>
                    </TooltipContent>
                  </Tooltip>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TooltipProvider>
            </div>
          </div>
          <div className="pl-4 border-l-2 border-slate-700 space-y-2">
            <div className="text-sm text-slate-400 space-y-1">
              {contactDetails?.role && contactDetails?.company && (
                <p className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <span>
                    {contactDetails.role} at <strong>{contactDetails.company}</strong>
                  </span>
                </p>
              )}
              {contactDetails?.email && (
                <a
                  href={`mailto:${contactDetails.email}`}
                  className="flex items-center gap-2 text-blue-400 hover:underline"
                >
                  <Mail className="h-4 w-4 text-slate-500 flex-shrink-0" />{' '}
                  {contactDetails.email}
                </a>
              )}
            </div>
            <p className="text-sm text-slate-300 pt-1 italic">
              “{opportunity.whyContact}”
            </p>
          </div>
        </CardContent>
      </SwipeToDelete>
    </Card>
  )
}
