import { create } from 'zustand';
import { KnowledgeCard } from '../types/card.types';
import { ChatMessage, ChatMode } from '../types/chat.types';

interface AppState {
    // Cards state
    cards: KnowledgeCard[];
    searchQuery: string;
    selectedCategory: string;
    expandedCard: string | null;
    editingCard: string | null;
    initialContent: string | null;

    // Chat state
    messages: ChatMessage[];
    chatMode: ChatMode;
    selectedCardsForChat: string[];
    isTyping: boolean;

    // View state
    currentView: 'cards' | 'chat';
    showAddModal: boolean;

    // Actions
    setCards: (cards: KnowledgeCard[]) => void;
    addCard: (card: KnowledgeCard) => void;
    updateCard: (id: string, updates: Partial<KnowledgeCard>) => void;
    deleteCard: (id: string) => void;
    setSearchQuery: (query: string) => void;
    setSelectedCategory: (category: string) => void;
    setExpandedCard: (id: string | null) => void;
    setEditingCard: (id: string | null) => void;
    setInitialContent: (content: string | null) => void;

    addMessage: (message: ChatMessage) => void;
    setChatMode: (mode: ChatMode) => void;
    setSelectedCardsForChat: (ids: string[]) => void;
    setIsTyping: (typing: boolean) => void;

    setCurrentView: (view: 'cards' | 'chat') => void;
    setShowAddModal: (show: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
    // Initial state
    cards: [],
    searchQuery: '',
    selectedCategory: 'All',
    expandedCard: null,
    editingCard: null,
    initialContent: null,

    messages: [],
    chatMode: 'free',
    selectedCardsForChat: [],
    isTyping: false,

    currentView: 'cards',
    showAddModal: false,

    // Actions
    setCards: (cards) => set({ cards }),
    addCard: (card) => set((state) => ({ cards: [card, ...state.cards] })),
    updateCard: (id, updates) => set((state) => ({
        cards: state.cards.map(card =>
            card.id === id ? { ...card, ...updates } : card
        )
    })),
    deleteCard: (id) => set((state) => ({
        cards: state.cards.filter(card => card.id !== id)
    })),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
    setExpandedCard: (expandedCard) => set({ expandedCard }),
    setEditingCard: (editingCard) => set({ editingCard }),
    setInitialContent: (initialContent) => set({ initialContent }),

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),
    setChatMode: (chatMode) => set({ chatMode }),
    setSelectedCardsForChat: (selectedCardsForChat) => set({ selectedCardsForChat }),
    setIsTyping: (isTyping) => set({ isTyping }),

    setCurrentView: (currentView) => set({ currentView }),
    setShowAddModal: (showAddModal) => set({ showAddModal }),
}));
