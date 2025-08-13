// src/components/ChatManager.jsx (version 1.3)
"use client";

import { useEffect } from 'react';
import { ChatSidebar } from './chat/ChatSidebar';
import { ChatView } from './ChatView';
import { useAppStore } from '@/store/use-app-store';
import { Loader2 } from 'lucide-react';

export function ChatManager() {
    // Select state and actions from the Zustand store.
    const { 
        chats, 
        activeChatId, 
        createChat, 
        selectChat,
        updateChatTitle,
        getMessagesForChat,
        setMessagesForChat,
        init,
    } = useAppStore(state => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        createChat: state.createChat,
        selectChat: state.selectChat,
        updateChatTitle: state.updateChatTitle,
        getMessagesForChat: state.getMessagesForChat,
        setMessagesForChat: state.setMessagesForChat,
        init: state.init
    }));

    // The 'isHydrated' state ensures we don't render client-specific UI on the server.
    const isHydrated = useAppStore(state => state._hasHydrated);

    useEffect(() => {
        // Initialize the store on mount to ensure a chat session is active.
        if(isHydrated) {
            init();
        }
    }, [isHydrated, init]);

    // During SSR or before hydration, show a loading state.
    if (!isHydrated || !activeChatId) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin mr-3" />
                <p>Initializing Chat Interface...</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-full gap-4">
            <div className="hidden md:flex md:flex-col">
                <ChatSidebar 
                    chats={chats}
                    activeChatId={activeChatId}
                    createChat={createChat}
                    selectChat={selectChat}
                />
            </div>
            <ChatView
                key={activeChatId} // This correctly resets component state when switching chats
                chatId={activeChatId}
                updateChatTitle={updateChatTitle}
                getMessages={getMessagesForChat}
                setMessages={setMessagesForChat}
            />
        </div>
    );
}