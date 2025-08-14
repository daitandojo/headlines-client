// src/components/PushNotificationManager.jsx (version 4.0)
'use client'

import { Button } from './ui/button'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { usePushManager } from '@/hooks/use-push-manager'
import { useEffect } from 'react'

export function PushNotificationManager() {
  // The hook is now simpler and more focused.
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    handleSubscription,
    initialize, // A new function to check initial state
  } = usePushManager()

  // On component mount, perform a non-blocking check for the initial state.
  useEffect(() => {
    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isSupported) {
    return null
  }

  const getTooltipText = () => {
    if (isLoading) return 'Processing...'
    if (permission === 'denied') return 'Notifications blocked in browser settings'
    if (isSubscribed) return 'Notifications are enabled'
    return 'Enable push notifications'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSubscription}
            disabled={isLoading || permission === 'denied'}
            aria-label={getTooltipText()}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {!isLoading && isSubscribed && <Bell className="h-4 w-4 text-green-400" />}
            {!isLoading && !isSubscribed && <BellOff className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
