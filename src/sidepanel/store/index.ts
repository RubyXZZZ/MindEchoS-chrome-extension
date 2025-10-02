import { create } from 'zustand';
import { KnowledgeCard } from '../types/card.types';
import { ChatMessage } from '../types/chat.types';
import {
    ALL_CARDS_FILTER,
    DEFAULT_CATEGORY,
    PROTECTED_CATEGORIES,
    STORAGE_KEYS,
    CARD_COLORS
} from '../utils/constants';

// Type for the data captured from the content script
interface SelectionPayload {
    text: string;
    url: string;
    title?: string;
    needsAISummarize?: boolean;
}

interface AppState {
    // Cards
    cards: KnowledgeCard[];
    searchQuery: string;
    selectedCategory: string;
    expandedCard: string | null;
    editingCard: string | null;
    initialSelection: SelectionPayload | null;
    userCategories: readonly string[];
    categoryToDelete: string | null;

    // Chat
    messages: ChatMessage[];
    selectedCardsForChat: string[];
    isTyping: boolean;

    // UI
    currentView: 'cards' | 'chat';
    showAddModal: boolean;
    showDeleteCategoryModal: boolean;

    // Card Actions
    initialize: () => void;
    checkForPendingSelection: () => Promise<void>;
    loadStore: () => Promise<void>;
    addCard: (card: KnowledgeCard) => Promise<void>;
    updateCard: (id: string, updates: Partial<KnowledgeCard>) => Promise<void>;
    deleteCard: (id: string) => Promise<void>;
    setSearchQuery: (query: string) => void;
    setSelectedCategory: (category: string) => void;
    setExpandedCard: (id: string | null) => void;
    setEditingCard: (id: string | null) => void;
    setInitialSelection: (payload: SelectionPayload | null) => void;
    addCategory: (category: string) => Promise<void>;
    triggerDeleteCategory: (category: string) => void;
    cancelDeleteCategory: () => void;
    deleteCategoryAndCards: () => Promise<void>;
    moveCardsToOtherAndDeleteCategory: () => Promise<void>;

    // Chat Actions
    addMessage: (message: ChatMessage) => void;
    updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
    clearMessages: () => void;
    setSelectedCardsForChat: (ids: string[]) => void;
    setIsTyping: (typing: boolean) => void;

    // UI Actions
    setCurrentView: (view: 'cards' | 'chat') => void;
    setShowAddModal: (show: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
    // === Card State ===
    cards: [],
    searchQuery: '',
    selectedCategory: ALL_CARDS_FILTER,
    expandedCard: null,
    editingCard: null,
    initialSelection: null,
    userCategories: [],
    categoryToDelete: null,

    // === Chat State ===
    messages: [],
    selectedCardsForChat: [],
    isTyping: false,

    // === UI State ===
    currentView: 'cards',
    showAddModal: false,
    showDeleteCategoryModal: false,

    // === Card Actions ===

    initialize: () => {
        chrome.storage.onChanged.addListener(async (changes, areaName) => {
            if (areaName === 'session' && changes.pendingSelection) {
                const { newValue } = changes.pendingSelection;
                if (newValue) {
                    console.log('[Store] Detected pendingSelection:', newValue);

                    set({
                        initialSelection: {
                            text: newValue.text,
                            url: newValue.url,
                            needsAISummarize: newValue.needsAISummarize || false
                        },
                        showAddModal: true
                    });

                    chrome.storage.session.remove('pendingSelection');
                }
            }
        });
    },

    checkForPendingSelection: async () => {
        try {
            const result = await chrome.storage.session.get('pendingSelection');
            if (result.pendingSelection) {
                const pendingData = result.pendingSelection;
                console.log('[Store] Found pending selection on init:', pendingData);

                set({
                    initialSelection: {
                        text: pendingData.text,
                        url: pendingData.url,
                        needsAISummarize: pendingData.needsAISummarize || false
                    },
                    showAddModal: true
                });

                await chrome.storage.session.remove('pendingSelection');
            }
        } catch (error) {
            console.error('Error checking pending selection:', error);
        }
    },

    loadStore: async () => {
        try {
            const result = await chrome.storage.local.get([STORAGE_KEYS.CARDS, STORAGE_KEYS.USER_CATEGORIES]);

            console.log('Loading from storage:', result);

            if (!result[STORAGE_KEYS.CARDS] || !Array.isArray(result[STORAGE_KEYS.CARDS])) {
                const sampleCard: KnowledgeCard = {
                    id: 'sample-card-1',
                    title: '欢迎使用知识卡片!',
                    content: '这是一个示例卡片。你可以使用右键菜单或快捷键从任何网页上捕获选中的文本来创建新卡片。',
                    url: '',
                    timestamp: Date.now(),
                    tags: [],
                    category: DEFAULT_CATEGORY,
                    color: CARD_COLORS[0],
                };

                await chrome.storage.local.set({ [STORAGE_KEYS.CARDS]: [sampleCard] });
                set({ cards: [sampleCard] });
                console.log('Created sample card');
            } else {
                const loadedCards = result[STORAGE_KEYS.CARDS];
                set({ cards: loadedCards });
                console.log(`Loaded ${loadedCards.length} cards from storage`);
            }

            if (result[STORAGE_KEYS.USER_CATEGORIES] && Array.isArray(result[STORAGE_KEYS.USER_CATEGORIES])) {
                const loadedUserCategories = result[STORAGE_KEYS.USER_CATEGORIES].filter((c: any) =>
                    typeof c === 'string' && c.trim() !== ''
                );
                set({ userCategories: loadedUserCategories });
                console.log(`Loaded ${loadedUserCategories.length} user categories`);
            }
        } catch (error) {
            console.error('Error loading store:', error);
            set({ cards: [], userCategories: [] });
        }
    },

    addCard: async (card) => {
        try {
            const currentCards = get().cards;
            const newCards = [...currentCards, card];

            set({ cards: newCards });
            await chrome.storage.local.set({ [STORAGE_KEYS.CARDS]: newCards });

            console.log('Card added successfully:', card.id);
            console.log('Total cards now:', newCards.length);
        } catch (error) {
            console.error('Error adding card:', error);
            const originalCards = get().cards.filter(c => c.id !== card.id);
            set({ cards: originalCards });
        }
    },

    updateCard: async (id, updates) => {
        try {
            const currentCards = get().cards;
            const newCards = currentCards.map(card =>
                card.id === id ? { ...card, ...updates } : card
            );

            set({ cards: newCards });
            await chrome.storage.local.set({ [STORAGE_KEYS.CARDS]: newCards });

            console.log('Card updated:', id);
        } catch (error) {
            console.error('Error updating card:', error);
        }
    },

    deleteCard: async (id) => {
        try {
            const currentCards = get().cards;
            const newCards = currentCards.filter(card => card.id !== id);

            set({ cards: newCards });
            await chrome.storage.local.set({ [STORAGE_KEYS.CARDS]: newCards });

            console.log('Card deleted:', id);
        } catch (error) {
            console.error('Error deleting card:', error);
        }
    },

    addCategory: async (category) => {
        try {
            const state = get();
            const newCategory = category.trim();

            if (newCategory &&
                ![...state.userCategories, ...PROTECTED_CATEGORIES].find(c =>
                    c.toLowerCase() === newCategory.toLowerCase()
                )) {
                const newUserCategories = [...state.userCategories, newCategory];
                set({ userCategories: newUserCategories });
                await chrome.storage.local.set({ [STORAGE_KEYS.USER_CATEGORIES]: newUserCategories });
                console.log('Category added:', newCategory);
            }
        } catch (error) {
            console.error('Error adding category:', error);
        }
    },

    triggerDeleteCategory: (category) => {
        if (PROTECTED_CATEGORIES.includes(category)) return;
        set({ categoryToDelete: category, showDeleteCategoryModal: true });
    },

    cancelDeleteCategory: () => {
        set({ categoryToDelete: null, showDeleteCategoryModal: false });
    },

    deleteCategoryAndCards: async () => {
        try {
            const state = get();
            const category = state.categoryToDelete;
            if (!category || PROTECTED_CATEGORIES.includes(category)) return;

            const newCards = state.cards.filter(card => card.category !== category);
            const newUserCategories = state.userCategories.filter(c => c !== category);

            set({
                cards: newCards,
                userCategories: newUserCategories,
                selectedCategory: ALL_CARDS_FILTER,
                categoryToDelete: null,
                showDeleteCategoryModal: false
            });

            await chrome.storage.local.set({
                [STORAGE_KEYS.CARDS]: newCards,
                [STORAGE_KEYS.USER_CATEGORIES]: newUserCategories
            });

            console.log('Category and cards deleted:', category);
        } catch (error) {
            console.error('Error deleting category and cards:', error);
        }
    },

    moveCardsToOtherAndDeleteCategory: async () => {
        try {
            const state = get();
            const category = state.categoryToDelete;
            if (!category || PROTECTED_CATEGORIES.includes(category)) return;

            const newCards = state.cards.map(card =>
                card.category === category ? { ...card, category: DEFAULT_CATEGORY } : card
            );
            const newUserCategories = state.userCategories.filter(c => c !== category);

            set({
                cards: newCards,
                userCategories: newUserCategories,
                selectedCategory: ALL_CARDS_FILTER,
                categoryToDelete: null,
                showDeleteCategoryModal: false
            });

            await chrome.storage.local.set({
                [STORAGE_KEYS.CARDS]: newCards,
                [STORAGE_KEYS.USER_CATEGORIES]: newUserCategories
            });

            console.log('Category deleted and cards moved:', category);
        } catch (error) {
            console.error('Error moving cards and deleting category:', error);
        }
    },

    setSearchQuery: (query) => set({ searchQuery: query }),
    setSelectedCategory: (category) => set({ selectedCategory: category }),
    setExpandedCard: (id) => set({ expandedCard: id }),
    setEditingCard: (id) => set({ editingCard: id }),
    setInitialSelection: (payload) => set({ initialSelection: payload }),

    // === Chat Actions ===

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),

    updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map(msg =>
            msg.id === id ? { ...msg, ...updates } : msg
        )
    })),

    clearMessages: () => set({ messages: [] }),

    setSelectedCardsForChat: (ids) => set({ selectedCardsForChat: ids }),
    setIsTyping: (typing) => set({ isTyping: typing }),

    // === UI Actions ===

    setCurrentView: (view) => set({ currentView: view }),
    setShowAddModal: (show) => set({ showAddModal: show }),
}));