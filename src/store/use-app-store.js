// src/store/use-app-store.js (version 4.0)
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set, get) => ({
      // --- Chat State (Client-Side) ---
      chats: [],
      activeChatId: null,
      allMessages: {},
      chatContextPrompt: '',

      // --- Chat Actions ---
      setChatContextPrompt: (prompt) => set({ chatContextPrompt: prompt }),
      createChat: () => {
        const newChatId = `chat_${Date.now()}`
        const newChat = {
          id: newChatId,
          title: 'New Chat',
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          chats: [newChat, ...state.chats],
          activeChatId: newChatId,
          allMessages: { ...state.allMessages, [newChatId]: [] },
        }))
        return newChatId
      },
      selectChat: (id) => {
        const { chats } = get()
        if (chats.find((c) => c.id === id)) {
          set({ activeChatId: id })
        } else if (chats.length > 0) {
          set({ activeChatId: chats[0].id })
        } else {
          get().createChat()
        }
      },
      updateChatTitle: (id, newTitle) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === id ? { ...chat, title: newTitle } : chat
          ),
        })),
      getMessagesForChat: (id) => get().allMessages[id] || [],
      setMessagesForChat: (id, messages) =>
        set((state) => ({
          allMessages: { ...state.allMessages, [id]: messages },
        })),
      init: () => {
        const { chats, activeChatId, createChat, selectChat } = get()
        if (chats.length === 0) {
          createChat()
        } else if (!activeChatId || !chats.find((c) => c.id === activeChatId)) {
          selectChat(chats[0].id)
        }
      },
    }),
    {
      name: 'headlines-app-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist chat data to local storage.
      // Server data is now handled by TanStack Query.
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        allMessages: state.allMessages,
      }),
    }
  )
)

export default useAppStore
