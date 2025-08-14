// src/components/PushNotificationManager.jsx (version 6.0)
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

export function PushNotificationManager() {
  // This hook now self-initializes via its own useEffect.
  // The component just consumes the state.
  const { isSupported, isSubscribed, isLoading, subscribe } = usePushManager()

  // If push notifications aren't supported by the browser, render nothing.
  if (!isSupported) {
    return null
  }

  const getTooltipText = () => {
    if (isLoading) return 'Initializing notifications...'
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
            onClick={subscribe}
            disabled={isLoading || isSubscribed}
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
