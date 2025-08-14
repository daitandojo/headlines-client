// src/app/(main)/chat/page.js (version 4.0)
import { ChatManager } from '@/components/ChatManager'
import { Header } from '@/components/Header'
import { MainNavTabs } from '@/components/MainNavTabs'

export default function ChatPage() {
  return (
    // This component now takes full control of the viewport layout.
    // The parent layout will not apply padding or container classes.
    <div className="h-dvh flex flex-col">
      <div className="container mx-auto p-4 md:p-8 flex flex-col flex-grow min-h-0">
        <Header />
        <MainNavTabs />
        <main className="flex-grow flex flex-col mt-4 min-h-0">
          <ChatManager />
        </main>
      </div>
    </div>
  )
}
