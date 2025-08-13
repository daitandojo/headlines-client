// src/app/(main)/chat/page.js (version 2.0)
import { ChatManager } from '@/components/ChatManager'
import { Header } from '@/components/Header'
import { MainNavTabs } from '@/components/MainNavTabs'

export default function ChatPage() {
  return (
    // --- DEFINITIVE FIX ---
    // Changed `h-dvh overflow-hidden` to `min-h-dvh`.
    // This makes the container flexible, allowing it to resize correctly
    // when the mobile keyboard appears, which solves the input focus issue.
    <div className="container mx-auto p-4 md:p-8 flex flex-col min-h-dvh">
      <Header />
      <MainNavTabs />
      <main className="flex-grow flex flex-col mt-4 min-h-0">
        <ChatManager />
      </main>
    </div>
  )
}
