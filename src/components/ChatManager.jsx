// src/components/ChatManager.jsx (version 1.2)
"use client";

import { useState, useEffect } from 'react';
import { ChatSidebar } from './chat/ChatSidebar';
import { ChatView } from './ChatView';
import { useChatManager } from '@/hooks/use-chat-manager';
import { Loader2 } from 'lucide-react';

export function ChatManager() {
    const { 
        chats, 
        activeChatId, 
        createChat, 
        selectChat, 
        updateChatTitle,
        getMessagesForChat,
        setMessagesForChat,
    } = useChatManager();

    // This state is the key to solving the hydration error.
    // It's false on the server and on the initial client render.
    // It becomes true only after the component has "mounted" on the client.
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // During server render and the initial client render, show a consistent loading state.
    // This guarantees the server and client HTML match, preventing the hydration error.
    if (!isMounted || !activeChatId) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin mr-3" />
                <p>Initializing Chat Interface...</p>
            </div>
        );
    }

    // Once mounted, we can safely render the UI that depends on localStorage state.
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
                key={activeChatId} // This correctly resets the component state when switching chats
                chatId={activeChatId}
                updateChatTitle={updateChatTitle}
                getMessages={getMessagesForChat}
                setMessages={setMessagesForChat}
            />
        </div>
    );
}