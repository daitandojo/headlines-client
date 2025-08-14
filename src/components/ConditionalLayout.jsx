// src/components/ConditionalLayout.jsx (version 1.0)
'use client'

import { usePathname } from 'next/navigation'

/**
 * A small client component whose only job is to conditionally render
 * its children based on the current path. This isolates the use of
 * the usePathname hook and resolves the server rendering conflict.
 */
export function ConditionalLayout({ children }) {
  const pathname = usePathname()
  const isChatPage = pathname === '/chat'

  // If it's the chat page, we render ONLY the page content itself.
  if (isChatPage) {
    // The chat page has its own full-height layout with Header and Tabs.
    // The children here will be the `page.js` for the chat route.
    return <>{children}</>
  }

  // For all other pages, render the standard layout shell passed from the server layout.
  // The children here will be the shell containing Header, Tabs, and the specific page content.
  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col min-h-screen">
      {children}
    </div>
  )
}
