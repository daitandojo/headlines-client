// src/hooks/use-chat-manager.js (version 1.1)
"use client";

import { useCallback } from 'react';
import { useLocalStorage } from './use-local-storage';

export function useChatManager() {
    const [chats, setChats] = useLocalStorage('chatList', []);
    const [activeChatId, setActiveChatId] = useLocalStorage('activeChatId', null);
    
    // This is now the single source of truth for all message histories.
    // It's an object where keys are chat IDs.
    const [allMessages, setAllMessages] = useLocalStorage('chatMessages', {});

    const createChat = useCallback(() => {
        const newChatId = `chat_${Date.now()}`;
        const newChat = { 
            id: newChatId, 
            title: 'New Chat', 
            createdAt: new Date().toISOString() 
        };
        
        setChats(prev => [newChat, ...prev]);
        setActiveChatId(newChatId);
        // Initialize an empty message history for the new chat
        setAllMessages(prev => ({ ...prev, [newChatId]: [] }));

        return newChatId;
    }, [setChats, setActiveChatId, setAllMessages]);

    const selectChat = useCallback((id) => {
        setActiveChatId(id);
    }, [setActiveChatId]);

    const updateChatTitle = useCallback((id, newTitle) => {
        setChats(prev => 
            prev.map(chat => 
                chat.id === id ? { ...chat, title: newTitle } : chat
            )
        );
    }, [setChats]);
    
    const getMessagesForChat = useCallback((id) => {
        return allMessages[id] || [];
    }, [allMessages]);

    const setMessagesForChat = useCallback((id, messages) => {
        setAllMessages(prev => ({ ...prev, [id]: messages }));
    }, [setAllMessages]);

    // Ensure there's always an active chat on initial load
    if (chats && chats.length === 0 && !activeChatId) {
        // This runs only once on the very first load if no chats exist
        createChat();
    } else if (chats && chats.length > 0 && !activeChatId) {
        // This runs if there are chats but no active one is set (e.g., after a refresh)
        setActiveChatId(chats[0].id);
    }
    
    return {
        chats,
        activeChatId,
        createChat,
        selectChat,
        updateChatTitle,
        getMessagesForChat,
        setMessagesForChat,
    };
}