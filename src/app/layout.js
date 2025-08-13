// src/app/layout.js (version 1.5)
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  // PWA manifest and theme
  manifest: "/manifest.json",
  themeColor: "#111827",
  
  // App metadata
  title: "Headlines",
  description: "An interface to browse, search, and filter wealth event articles.",
  
  // Base icons, including a dedicated Apple icon
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },

  // Apple-specific PWA tags for a native-like experience
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Headlines",
  },
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
      </body>
    </html>
  );
}