// src/app/layout.js (version 2.1)
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
    // This is the critical line for iOS home screen icons.
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
          strategy="lazyOnload"
        >
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker
                  .register('/sw.js')
                  .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
                  .catch((error) => console.error('Service Worker registration failed:', error));
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}