import { Inter } from "next/font/google";
// CRITICAL FIX: Import the global CSS file that defines the entire theme.
import "./globals.css";
import { cn } from "@/lib/utils";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Headlines Intelligence Client",
  description: "An interface to browse, search, and filter wealth event articles.",
};

export default function RootLayout({ children }) {
  // CRITICAL FIX: Apply the "dark" class to the <html> tag.
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          fontSans.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}