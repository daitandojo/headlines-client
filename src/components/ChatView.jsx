// src/components/ChatView.jsx (version 1.8)
"use client";

import { useChat } from 'ai/react';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatScrollAnchor } from '@/components/chat/ChatScrollAnchor';
import { ChatThinkingIndicator } from '@/components/chat/ChatThinkingIndicator';
import { useAppStore } from '@/store/use-app-store';
import { generateChatTitle } from '@/actions/chat';

export function ChatView({ chatId, updateChatTitle, getMessages, setMessages }) {
    const { chatContextPrompt, setChatContextPrompt } = useAppStore(state => ({
        chatContextPrompt: state.chatContextPrompt,
        setChatContextPrompt: state.setChatContextPrompt
    }));
    
    const { messages, input, setInput, handleInputChange, handleSubmit, isLoading, append } = useChat({
        id: chatId,
        api: '/api/chat',
        initialMessages: getMessages(chatId),
        onFinish: async (message) => {
            const currentMessages = [...messages, message];
            setMessages(chatId, currentMessages);

            if (currentMessages.length === 2) {
                const result = await generateChatTitle(currentMessages);
                if (result.success) {
                    updateChatTitle(chatId, result.title);
                }
            }
        },
    });

    useEffect(() => {
        if (chatContextPrompt) {
            const userMessage = { role: 'user', content: chatContextPrompt };
            // Do not manually add to state; `append` will do this.
            append(userMessage);
            setChatContextPrompt(''); // Reset the prompt in the store
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