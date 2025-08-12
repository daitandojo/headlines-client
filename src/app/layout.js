// src/app/layout.js (version 1.3)
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/context/AppContext";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Headlines",
  description: "An interface to browse, search, and filter wealth event articles.",
  manifest: "/manifest.json",
  themeColor: "#111827",
  icons: {
    // This is the primary icon used by browsers for the tab.
    icon: '/icons/icon-192x192.png',
    // This is used for older browsers and as a fallback.
    shortcut: '/icons/icon-192x192.png',
    // This is for Apple devices when the app is added to the home screen.
    apple: '/icons/icon-192x192.png',
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
        <AppProvider>
          {children}
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}