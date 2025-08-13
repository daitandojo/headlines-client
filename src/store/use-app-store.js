// src/store/use-app-store.js (version 2.0)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set, get) => ({
      // --- Chat State ---
      chats: [],
      activeChatId: null,
      allMessages: {},
      chatContextPrompt: '',

      // --- NEW: Article & Event State ---
      articles: [],
      events: [],
      // Hydration flags to prevent re-initializing with stale props
      hydratedArticleSet: new Set(),
      hydratedEventSet: new Set(),

      // --- Chat Actions ---
      setChatContextPrompt: (prompt) => set({ chatContextPrompt: prompt }),
      createChat: () => {
        const newChatId = `chat_${Date.now()}`;
        const newChat = { id: newChatId, title: 'New Chat', createdAt: new Date().toISOString() };
        set(state => ({
          chats: [newChat, ...state.chats],
          activeChatId: newChatId,
          allMessages: { ...state.allMessages, [newChatId]: [] }
        }));
        return newChatId;
      },
      selectChat: (id) => {
        const { chats } = get();
        if (chats.find(c => c.id === id)) set({ activeChatId: id });
        else if (chats.length > 0) set({ activeChatId: chats[0].id });
        else get().createChat();
      },
      updateChatTitle: (id, newTitle) => set(state => ({ chats: state.chats.map(chat => chat.id === id ? { ...chat, title: newTitle } : chat) })),
      getMessagesForChat: (id) => get().allMessages[id] || [],
      setMessagesForChat: (id, messages) => set(state => ({ allMessages: { ...state.allMessages, [id]: messages } })),
      init: () => {
        const { chats, activeChatId } = get();
        if (chats.length === 0) get().createChat();
        else if (!activeChatId || !chats.find(c => c.id === activeChatId)) set({ activeChatId: chats[0].id });
      },
      
      // --- NEW: Article & Event Actions ---
      setInitialArticles: (initialArticles) => set(state => {
        const newHydratedSet = new Set(initialArticles.map(a => a._id));
        return { articles: initialArticles, hydratedArticleSet: newHydratedSet };
      }),
      setInitialEvents: (initialEvents) => set(state => {
        const newHydratedSet = new Set(initialEvents.map(e => e._id));
        return { events: initialEvents, hydratedEventSet: newHydratedSet };
      }),
      prependArticle: (article) => set(state => {
        // Prevent duplicates from streaming events
        if (state.articles.some(a => a._id === article._id)) return {};
        return { articles: [article, ...state.articles] };
      }),
      prependEvent: (event) => set(state => {
        if (state.events.some(e => e._id === event._id)) return {};
        return { events: [event, ...state.events] };
      }),
      appendArticles: (newArticles) => set(state => ({
        articles: [...state.articles, ...newArticles]
      })),
      appendEvents: (newEvents) => set(state => ({
        events: [...state.events, ...newEvents]
      })),
    }),
    {
      name: 'headlines-app-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist chat data to avoid bloating local storage
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        allMessages: state.allMessages,
      }),
    }
  )
);

export { useAppStore };