// src/components/ChatView.jsx (version 2.1)
"use client";

import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatScrollAnchor } from '@/components/chat/ChatScrollAnchor';
import { ChatThinkingIndicator } from '@/components/chat/ChatThinkingIndicator';
import { useAppStore } from '@/store/use-app-store';
import { generateChatTitle } from '@/actions/chat';

export function ChatView({ chatId, updateChatTitle, getMessages, setMessages }) {
    const inputRef = useRef(null);
    const { chatContextPrompt, setChatContextPrompt } = useAppStore(state => ({
        chatContextPrompt: state.chatContextPrompt,
        setChatContextPrompt: state.setChatContextPrompt
    }));
    
    const { messages, input, setInput, handleInputChange, handleSubmit, isLoading, append } = useChat({
        id: chatId,
        api: '/api/chat',
        initialMessages: getMessages(chatId),
        onFinish: async (message) => {
            // The `messages` array from the hook is the source of truth.
            // At this point, it already contains the user's message and the complete assistant message.
            setMessages(chatId, messages);

            // --- BUG FIX ---
            // The check is now performed on the `messages` array directly.
            // A new chat's first exchange will result in messages.length being exactly 2.
            if (messages.length === 2) {
                const result = await generateChatTitle(messages);
                if (result.success) {
                    updateChatTitle(chatId, result.title);
                }
            }
            // --- END BUG FIX ---
        },
    });

    useEffect(() => {
        if (!isLoading && inputRef.current) {
            setTimeout(() => {
                inputRef.current.focus();
            }, 100);
        }
    }, [isLoading]);

    useEffect(() => {
        if (chatContextPrompt) {
            const userMessage = { role: 'user', content: chatContextPrompt };
            append(userMessage);
            setChatContextPrompt('');
        }
    }, [chatContextPrompt, append, setChatContextPrompt]);
    
    const customHandleSubmit = (e) => {
        e.preventDefault();
        handleSubmit(e);
    };

    return (
        <div className="flex-grow flex flex-col justify-between h-full min-h-0">
            <Card className="bg-black/20 backdrop-blur-sm border border-white/10 shadow-2xl shadow-black/30 h-full flex flex-col">
                <div className="flex-grow overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    {messages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <p className="text-lg">Ask anything about the knowledge base.</p>
                        </div>
                    )}
                    {messages.map(m => (
                        <ChatMessage key={m.id} message={m} />
                    ))}
                    {isLoading && <ChatThinkingIndicator status="Thinking..." />}
                    <ChatScrollAnchor messages={messages} />
                </div>
                <div className="px-4 pb-4">
                    <ChatInput 
                        inputRef={inputRef}
                        input={input}
                        setInput={setInput}
                        handleInputChange={handleInputChange}
                        handleSubmit={customHandleSubmit}
                        isLoading={isLoading}
                    />
                </div>
            </Card>
        </div>
    );
}