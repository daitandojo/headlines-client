// src/store/use-app-store.js (version 1.0)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // State
      chats: [],
      activeChatId: null,
      allMessages: {},
      chatContextPrompt: '',

      // Actions
      setChatContextPrompt: (prompt) => set({ chatContextPrompt: prompt }),

      createChat: () => {
        const newChatId = `chat_${Date.now()}`;
        const newChat = {
          id: newChatId,
          title: 'New Chat',
          createdAt: new Date().toISOString()
        };
        
        set(state => ({
          chats: [newChat, ...state.chats],
          activeChatId: newChatId,
          allMessages: { ...state.allMessages, [newChatId]: [] }
        }));
        
        return newChatId;
      },

      selectChat: (id) => {
        const { chats } = get();
        if (chats.find(c => c.id === id)) {
            set({ activeChatId: id });
        } else if (chats.length > 0) {
            set({ activeChatId: chats[0].id });
        } else {
            // If no chats exist, create one
            get().createChat();
        }
      },
      
      updateChatTitle: (id, newTitle) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === id ? { ...chat, title: newTitle } : chat
          )
        }));
      },
      
      getMessagesForChat: (id) => {
        return get().allMessages[id] || [];
      },
      
      setMessagesForChat: (id, messages) => {
        set(state => ({
          allMessages: { ...state.allMessages, [id]: messages }
        }));
      },
      
      // Initialization logic to ensure an active chat always exists
      init: () => {
        const { chats, activeChatId } = get();
        if (chats.length === 0) {
          get().createChat();
        } else if (!activeChatId || !chats.find(c => c.id === activeChatId)) {
          set({ activeChatId: chats[0].id });
        }
      }
    }),
    {
      name: 'headlines-app-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist a subset of the state
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        allMessages: state.allMessages,
      }),
    }
  )
);