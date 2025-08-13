// src/components/OpportunityCard.jsx (version 6.0)
'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
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
import { ExternalLink, User, Briefcase, MapPin, Trash2 } from 'lucide-react'
import { deleteOpportunity } from '@/actions/opportunities'

export function OpportunityCard({ opportunity, onOpportunityDeleted, onDeletionFailed }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      // --- Step 1: Perform the server action FIRST. ---
      const result = await deleteOpportunity(opportunity._id)

      if (result.success) {
        toast.success(result.message)
        // --- Step 2: On successful response, update the UI. ---
        // The modal will have already closed itself by this point.
        onOpportunityDeleted(opportunity._id)
      } else {
        toast.error(result.message)
        // If it fails, we do nothing to the UI. The card remains visible.
      }
    })
  }

  const sourceArticle = opportunity.sourceArticleId
  const { contactDetails } = opportunity

  return (
    <Card
      className={`bg-slate-900/50 border border-slate-700/80 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}
    >
      <CardContent className="p-4 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        {/* Wealth Indicator */}
        <div className="flex flex-col items-center justify-center w-20">
          {opportunity.likelyMMDollarWealth > 0 ? (
            <>
              <p className="text-2xl font-bold text-green-300">
                ${opportunity.likelyMMDollarWealth}M
              </p>
              <p className="text-xs text-green-400/70">Est. Wealth</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">N/A</p>
          )}
        </div>

        {/* Main Details */}
        <div className="border-l border-r border-slate-700/50 px-4 space-y-2">
          <p className="font-bold text-base text-slate-100 flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            {opportunity.reachOutTo}
          </p>
          <div className="space-y-1 text-sm text-slate-400">
            {contactDetails?.role && contactDetails?.company && (
              <p className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-500" /> {contactDetails.role} at{' '}
                {contactDetails.company}
              </p>
            )}
            {opportunity.basedIn && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" /> {opportunity.basedIn}
              </p>
            )}
          </div>
          <p className="text-sm text-slate-300 pt-1 italic">“{opportunity.whyContact}”</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(sourceArticle?.link, '_blank')}
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
                    <Button variant="ghost" size="icon" disabled={isPending}>
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
                    This will permanently delete this opportunity. This action cannot be
                    undone.
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
      </CardContent>
    </Card>
  )
}
