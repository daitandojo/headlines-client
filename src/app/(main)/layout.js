// src/app/(main)/layout.js (version 4.0)
'use client' // Required for usePathname hook

import { usePathname } from 'next/navigation'
import { Header } from '@/components/Header'
import { MainNavTabs } from '@/components/MainNavTabs'
import { Providers } from '../providers'
import { cn } from '@/lib/utils'
// NOTE: This layout no longer needs to fetch data, as child pages/layouts handle it.

/**
 * This shared layout provides a consistent structure for most main app views.
 * It now conditionally applies padding to accommodate the full-screen chat page.
 */
export default function MainLayout({ children }) {
  const pathname = usePathname()
  const isChatPage = pathname === '/chat'

  return (
    <Providers>
      {/*
        If it's the chat page, we render the children directly without wrapping them
        in the standard padded layout, allowing ChatPage to control its own full-height layout.
      */}
      {isChatPage ? (
        children
      ) : (
        <div className="container mx-auto p-4 md:p-8 flex flex-col min-h-screen">
          <Header />
          <MainNavTabs />
          <main className={cn('flex-grow flex flex-col', !isChatPage && 'mt-8')}>
            {children}
          </main>
        </div>
      )}
    </Providers>
  )
}
