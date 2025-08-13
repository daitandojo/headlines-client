// src/components/PushNotificationManager.jsx (version 2.0)
"use client";

import { Button } from './ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePushManager } from '@/hooks/use-push-manager';

export function PushNotificationManager() {
    const { isSupported, isSubscribed, isLoading, subscribe } = usePushManager();

    // If push notifications aren't supported by the browser, render nothing.
    if (!isSupported) {
        return null;
    }
    
    // The UI is now a clean representation of the state from the hook.
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={subscribe} 
                        disabled={isLoading || isSubscribed}
                        aria-label={isSubscribed ? "Notifications Enabled" : "Enable Notifications"}
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {!isLoading && isSubscribed && <Bell className="h-4 w-4 text-green-400" />}
                        {!isLoading && !isSubscribed && <BellOff className="h-4 w-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isSubscribed ? "Notifications Enabled" : "Enable Notifications"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}