// src/app/layout.js (version 3.0)
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  manifest: "/manifest.json",
  themeColor: "#111827",
  title: "Headlines",
  description: "An interface to browse, search, and filter wealth event articles.",
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Headlines",
  },
  other: {
    "mobile-web-app-capable": "yes",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          fontSans.variable
        )}
      >
        {children}
        <Toaster />
        <Script
          id="sw-registrar"
          strategy="afterInteractive"
        >
          {`
            if ('serviceWorker' in navigator && 'PushManager' in window) {
              console.log('[SW] Browser supports Service Workers and Push');
              
              const registerSW = async () => {
                try {
                  console.log('[SW] Registering service worker...');
                  
                  const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none' // Always check for updates
                  });
                  
                  console.log('[SW] Service Worker registered successfully:', registration);
                  
                  // Handle service worker updates
                  registration.addEventListener('updatefound', () => {
                    console.log('[SW] Service Worker update found');
                    const newWorker = registration.installing;
                    
                    if (newWorker) {
                      newWorker.addEventListener('statechange', () => {
                        console.log('[SW] Service Worker state changed to:', newWorker.state);
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          console.log('[SW] New service worker installed, page refresh recommended');
                        }
                      });
                    }
                  });
                  
                  // Listen for messages from the service worker
                  navigator.serviceWorker.addEventListener('message', (event) => {
                    console.log('[SW] Message from service worker:', event.data);
                  });
                  
                } catch (error) {
                  console.error('[SW] Service Worker registration failed:', error);
                }
              };
              
              // Register on page load
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', registerSW);
              } else {
                registerSW();
              }
              
              // Also check when page becomes visible (handles mobile app switching)
              document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                  navigator.serviceWorker.getRegistrations().then(registrations => {
                    if (registrations.length === 0) {
                      console.log('[SW] No service worker found, re-registering...');
                      registerSW();
                    }
                  });
                }
              });
              
            } else {
              console.log('[SW] Browser does not support Service Workers or Push');
            }
          `}
        </Script>
      </body>
    </html>
  );
}