// src/components/ChatView.jsx (version 8.0)
'use client'

import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatScrollAnchor } from '@/components/chat/ChatScrollAnchor'
import { ChatLoadingIndicator } from '@/components/chat/ChatLoadingIndicator'
import useAppStore from '@/store/use-app-store'
import { generateChatTitle } from '@/actions/chat'

async function postChatMessage(messages) {
  const sanitizedMessages = messages.map(({ role, content }) => ({ role, content }))
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: sanitizedMessages }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Failed to get a response from the server.')
  }
  return response.text()
}

export function ChatView({ chatId, updateChatTitle, getMessages, setMessages }) {
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false) // Explicit state for loading UI
  const inputRef = useRef(null)
  const { chatContextPrompt, setChatContextPrompt } = useAppStore((state) => ({
    chatContextPrompt: state.chatContextPrompt,
    setChatContextPrompt: state.setChatContextPrompt,
  }))

  const messages = getMessages(chatId)

  const { mutate: sendMessage } = useMutation({
    mutationFn: postChatMessage,
    onSuccess: (assistantResponse, newMessages) => {
      const finalMessages = [
        ...newMessages,
        { role: 'assistant', content: assistantResponse, id: `asst_${Date.now()}` },
      ]
      setMessages(chatId, finalMessages)

      if (finalMessages.length === 2) {
        generateChatTitle(finalMessages).then((result) => {
          if (result.success) {
            updateChatTitle(chatId, result.title)
          }
        })
      }
    },
    onError: (error, originalMessages) => {
      toast.error(`An error occurred: ${error.message}`)
      setMessages(chatId, originalMessages.slice(0, -1))
    },
    onSettled: () => {
      // This runs on both success and error, ensuring the spinner is always hidden.
      setIsThinking(false)
    },
  })

  useEffect(() => {
    if (!isThinking && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus()
      }, 100)
    }
  }, [isThinking])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isThinking) return

    setIsThinking(true) // Show spinner immediately
    const userMessage = { role: 'user', content: input, id: `user_${Date.now()}` }
    const newMessages = [...messages, userMessage]

    setMessages(chatId, newMessages)
    sendMessage(newMessages)
    setInput('')
  }

  useEffect(() => {
    if (chatContextPrompt && !isThinking) {
      setIsThinking(true) // Show spinner immediately
      const userMessage = {
        role: 'user',
        content: chatContextPrompt,
        id: `user_ctx_${Date.now()}`,
      }
      const newMessages = [...getMessages(chatId), userMessage]

      setMessages(chatId, newMessages)
      sendMessage(newMessages)

      setChatContextPrompt('')
    }
  }, [
    chatContextPrompt,
    isThinking,
    chatId,
    getMessages,
    setMessages,
    sendMessage,
    setChatContextPrompt,
  ])

  return (
    <div className="flex-grow flex flex-col justify-between h-full min-h-0">
      <Card className="bg-black/20 backdrop-blur-sm border border-white/10 shadow-2xl shadow-black/30 h-full flex flex-col">
        <div className="flex-grow overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {messages.length === 0 && !isThinking && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p className="text-lg">Ask anything about the knowledge base.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <ChatMessage key={m.id || `msg-${i}`} message={m} />
          ))}
          {isThinking && <ChatLoadingIndicator />}
          <ChatScrollAnchor messages={messages} />
        </div>
        <div className="px-4 pb-4">
          <ChatInput
            inputRef={inputRef}
            input={input}
            setInput={setInput}
            handleInputChange={(e) => setInput(e.target.value)}
            handleSubmit={handleSubmit}
            isLoading={isThinking} // Disable input while thinking
          />
        </div>
      </Card>
    </div>
  )
}
