// src/components/InstallPwaButton.jsx (version 1.1)
"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, Smartphone } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function InstallPwaButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for mobile user agent
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const checkInstallStatus = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsAppInstalled(true);
      }
    };

    checkInstallStatus();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  // Condition 1: If the app is already installed, show nothing.
  if (isAppInstalled) {
    return null;
  }

  // Condition 2: If the install prompt is available, show the direct install button.
  if (installPrompt) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleInstallClick}>
                <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Install App</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Condition 3: If on mobile and no direct prompt, show the informational banner.
  if (isMobile) {
      return (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
            <Smartphone className="h-4 w-4 text-slate-500" />
            <span>Install on your phone!</span>
        </div>
      );
  }

  // Condition 4: If on desktop and no prompt, show nothing.
  return null;
}