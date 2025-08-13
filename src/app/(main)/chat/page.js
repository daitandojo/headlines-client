// src/app/(main)/chat/page.js (version 1.4)
import { ChatManager } from '@/components/ChatManager';
import { Header } from '@/components/Header';
import { MainNavTabs } from '@/components/MainNavTabs';

export default function ChatPage() {
    return (
        <div className="container mx-auto p-4 md:p-8 flex flex-col h-dvh overflow-hidden">
            <Header />
            <MainNavTabs />
            <main className="flex-grow flex flex-col mt-4 min-h-0">
                <ChatManager />
            </main>
        </div>
    );
}