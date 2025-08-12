"use client";

import { useChat } from 'ai/react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatScrollAnchor } from '@/components/chat/ChatScrollAnchor';
import { ChatThinkingIndicator } from '@/components/chat/ChatThinkingIndicator';
import { useLocalStorage } from '@/hooks/use-local-storage';

export function ChatView() {
    const [chatId] = useLocalStorage('chatId', `chat_${Date.now()}`);
    const [savedMessages, setSavedMessages] = useLocalStorage(`chatHistory_${chatId}`, []);
    const [status, setStatus] = useState('Awaiting input...');
    const [verifiedMessages, setVerifiedMessages] = useState({});

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat/generate',
        initialMessages: savedMessages,
        onResponse: () => setStatus('Synthesizing response...'),
        onFinish: async (message) => {
            const originalQuestion = messages.find(m => m.id === message.id && m.role === 'user')?.content;
            if (message.role === 'assistant' && originalQuestion) {
                setStatus('Verifying facts against knowledge base...');
                try {
                    const response = await fetch('/api/chat/verify', {
                        method: 'POST',
                        body: JSON.stringify({ answer: message.content, originalQuestion }),
                    });
                    const { verifiedClaims } = await response.json();
                    if (verifiedClaims) {
                        setVerifiedMessages(prev => ({ ...prev, [message.id]: verifiedClaims }));
                    }
                } catch (error) {
                    console.error("Verification failed:", error);
                }
            }
            setSavedMessages(prev => [...prev, message]);
            setStatus('Awaiting input...');
        },
        onError: () => setStatus('Error. Please try again.'),
    });
    
    const customHandleSubmit = (e) => {
        setStatus('Querying knowledge base...');
        handleSubmit(e);
    };

    return (
        <div className="max-w-5xl mx-auto">
            <Card className="bg-black/20 backdrop-blur-sm border border-white/10 shadow-2xl shadow-black/30 h-[80vh] flex flex-col">
                <div className="flex-grow overflow-y-auto p-4 space-y-6">
                    {messages.map(m => (
                        <ChatMessage 
                            key={m.id} 
                            message={m} 
                            verifiedContent={verifiedMessages[m.id]} 
                        />
                    ))}
                    {isLoading && <ChatThinkingIndicator status={status} />}
                    <ChatScrollAnchor messages={messages} />
                </div>
                <ChatInput 
                    input={input}
                    handleInputChange={handleInputChange}
                    handleSubmit={customHandleSubmit}
                    isLoading={isLoading}
                />
            </Card>
        </div>
    );
}