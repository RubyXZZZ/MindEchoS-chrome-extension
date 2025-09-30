import { create } from 'zustand';
import { KnowledgeCard } from '../types/card.types';
import { ChatMessage, ChatMode } from '../types/chat.types';
import {
    ALL_CARDS_FILTER,
    DEFAULT_CATEGORY,
    PROTECTED_CATEGORIES,
    STORAGE_KEYS,
    CARD_COLORS
} from '../utils/constants';
import { SummarizeAI } from '../services/ai/summarizeAI';

// Type for the data captured from the content script (enhanced with AI title)
interface SelectionPayload {
    text: string;
    url: string;
    title?: string;  // AI 生成的标题
    originalText?: string;  // 原始文本（未总结的）
    needsAISummarize?: boolean;  // 是否需要 AI 处理
}

interface AppState {
    cards: KnowledgeCard[];
    searchQuery: string;
    selectedCategory: string;
    expandedCard: string | null;
    editingCard: string | null;
    initialSelection: SelectionPayload | null;
    userCategories: readonly string[];
    categoryToDelete: string | null;

    messages: ChatMessage[];
    chatMode: ChatMode;
    selectedCardsForChat: string[];
    isTyping: boolean;

    currentView: 'cards' | 'chat';
    showAddModal: boolean;
    showDeleteCategoryModal: boolean;

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

    addMessage: (message: ChatMessage) => void;
    setChatMode: (mode: ChatMode) => void;
    setSelectedCardsForChat: (ids: string[]) => void;
    setIsTyping: (typing: boolean) => void;

    setCurrentView: (view: 'cards' | 'chat') => void;
    setShowAddModal: (show: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
    cards: [],
    searchQuery: '',
    selectedCategory: ALL_CARDS_FILTER,
    expandedCard: null,
    editingCard: null,
    initialSelection: null,
    userCategories: [],
    categoryToDelete: null,

    messages: [],
    chatMode: 'free',
    selectedCardsForChat: [],
    isTyping: false,

    currentView: 'cards',
    showAddModal: false,
    showDeleteCategoryModal: false,

    // --- Actions ---

    initialize: () => {
        chrome.storage.onChanged.addListener(async (changes, areaName) => {
            if (areaName === 'session' && changes.pendingSelection) {
                const { newValue } = changes.pendingSelection;
                if (newValue) {
                    // 检查是否需要 AI 处理 - 使用 Chrome 138+ 的 Summarizer API
                    if (newValue.needsAISummarize && 'Summarizer' in self) {
                        try {
                            const summarizer = SummarizeAI.getInstance();
                            const summarized = await summarizer.summarizeSelection(
                                newValue.text,
                                newValue.url || ''
                            );

                            if (summarized.success) {
                                set({
                                    initialSelection: {
                                        text: summarized.content || newValue.text,
                                        title: summarized.title,
                                        url: newValue.url,
                                        originalText: newValue.text
                                    },
                                    showAddModal: true
                                });
                            } else {
                                // AI 失败，使用降级处理
                                set({
                                    initialSelection: {
                                        text: newValue.text.substring(0, 500) + '...',
                                        title: newValue.text.substring(0, 50) + '...',
                                        url: newValue.url
                                    },
                                    showAddModal: true
                                });
                            }
                        } catch (error) {
                            console.error('AI summarization failed:', error);
                            // 降级处理
                            set({
                                initialSelection: {
                                    text: newValue.text,
                                    url: newValue.url
                                },
                                showAddModal: true
                            });
                        }
                    } else {
                        // 不需要 AI 处理或 Summarizer API 不可用
                        set({
                            initialSelection: newValue,
                            showAddModal: true
                        });
                    }

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

                // 检查是否需要 AI 处理 - 使用 Chrome 138+ 的 Summarizer API
                if (pendingData.needsAISummarize && 'Summarizer' in self) {
                    try {
                        const summarizer = SummarizeAI.getInstance();
                        const summarized = await summarizer.summarizeSelection(
                            pendingData.text,
                            pendingData.url || ''
                        );

                        if (summarized.success) {
                            set({
                                initialSelection: {
                                    text: summarized.content || pendingData.text,
                                    title: summarized.title,
                                    url: pendingData.url,
                                    originalText: pendingData.text
                                },
                                showAddModal: true
                            });
                        } else {
                            // AI 失败，使用降级处理
                            set({
                                initialSelection: {
                                    text: pendingData.text.substring(0, 500) + '...',
                                    title: pendingData.text.substring(0, 50) + '...',
                                    url: pendingData.url
                                },
                                showAddModal: true
                            });
                        }
                    } catch (error) {
                        console.error('AI summarization failed:', error);
                        // 降级处理
                        set({
                            initialSelection: pendingData,
                            showAddModal: true
                        });
                    }
                } else {
                    // 不需要 AI 处理或 Summarizer API 不可用
                    set({
                        initialSelection: pendingData,
                        showAddModal: true
                    });
                }

                await chrome.storage.session.remove('pendingSelection');
            }
        } catch (error) {
            console.error('Error checking pending selection:', error);
        }
    },

    loadStore: async () => {
        try {
            const result = await chrome.storage.local.get([STORAGE_KEYS.CARDS, STORAGE_KEYS.USER_CATEGORIES]);

            // Debug logging
            console.log('Loading from storage:', result);

            // Check if cards exist in storage and handle both undefined and empty cases
            if (!result[STORAGE_KEYS.CARDS] || !Array.isArray(result[STORAGE_KEYS.CARDS])) {
                // First time user - create sample card
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

                // Save the sample card to storage
                await chrome.storage.local.set({ [STORAGE_KEYS.CARDS]: [sampleCard] });
                set({ cards: [sampleCard] });
                console.log('Created sample card');
            } else {
                // Load existing cards
                const loadedCards = result[STORAGE_KEYS.CARDS];
                set({ cards: loadedCards });
                console.log(`Loaded ${loadedCards.length} cards from storage`);
            }

            // Load user categories
            if (result[STORAGE_KEYS.USER_CATEGORIES] && Array.isArray(result[STORAGE_KEYS.USER_CATEGORIES])) {
                const loadedUserCategories = result[STORAGE_KEYS.USER_CATEGORIES].filter((c: any) =>
                    typeof c === 'string' && c.trim() !== ''
                );
                set({ userCategories: loadedUserCategories });
                console.log(`Loaded ${loadedUserCategories.length} user categories`);
            }
        } catch (error) {
            console.error('Error loading store:', error);
            // Set default state in case of error
            set({ cards: [], userCategories: [] });
        }
    },

    addCard: async (card) => {
        try {
            const currentCards = get().cards;
            const newCards = [...currentCards, card];

            // Update state first
            set({ cards: newCards });

            // Then persist to storage
            await chrome.storage.local.set({ [STORAGE_KEYS.CARDS]: newCards });

            console.log('Card added successfully:', card.id);
            console.log('Total cards now:', newCards.length);
        } catch (error) {
            console.error('Error adding card:', error);
            // Revert state on error
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

    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
    setChatMode: (mode) => set({ chatMode: mode }),
    setSelectedCardsForChat: (ids) => set({ selectedCardsForChat: ids }),
    setIsTyping: (typing) => set({ isTyping: typing }),

    setCurrentView: (view) => set({ currentView: view }),
    setShowAddModal: (show) => set({ showAddModal: show }),
}));