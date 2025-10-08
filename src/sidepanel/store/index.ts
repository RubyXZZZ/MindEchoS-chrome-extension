import { create } from 'zustand';
import { KnowledgeCard } from '../types/card.types';
import { ChatMessage, ChatArchive } from '../types/chat.types';
import {
    ALL_CARDS_FILTER,
    DEFAULT_CATEGORY,
    PROTECTED_CATEGORIES,
    STORAGE_KEYS,
    CARD_COLORS
} from '../utils/constants';

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
    chatArchives: ChatArchive[];

    // UI
    currentView: 'cards' | 'chat' | 'settings';
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

    // Chat Persistence Actions
    loadCurrentChat: () => Promise<void>;
    saveCurrentChat: () => Promise<void>;
    archiveCurrentChat: () => Promise<void>;
    loadArchive: (archiveId: string) => void;
    deleteArchive: (archiveId: string) => Promise<void>;
    // exportArchive: (archiveId: string) => void;
    loadChatArchives: () => Promise<void>;

    // UI Actions
    setCurrentView: (view: 'cards' | 'chat' | 'settings') => void;
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
    chatArchives: [],

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

    // === Chat Persistence Actions ===

    loadCurrentChat: async () => {
        try {
            const result = await chrome.storage.local.get([STORAGE_KEYS.CURRENT_CHAT]);

            if (result[STORAGE_KEYS.CURRENT_CHAT]) {
                const savedChat = result[STORAGE_KEYS.CURRENT_CHAT];
                set({
                    messages: savedChat.messages || [],
                    selectedCardsForChat: savedChat.selectedCards || []
                });
                console.log('[Store] Loaded current chat with', savedChat.messages?.length || 0, 'messages');
            }
        } catch (error) {
            console.error('[Store] Error loading current chat:', error);
        }
    },

    saveCurrentChat: async () => {
        try {
            const state = get();
            const currentChat = {
                messages: state.messages,
                selectedCards: state.selectedCardsForChat,
                lastUpdated: Date.now()
            };

            await chrome.storage.local.set({
                [STORAGE_KEYS.CURRENT_CHAT]: currentChat
            });
            console.log('[Store] Current chat saved');
        } catch (error) {
            console.error('[Store] Error saving current chat:', error);
        }
    },

    archiveCurrentChat: async () => {
        try {
            const state = get();

            if (state.messages.length === 0) {
                console.log('[Store] No messages to archive');
                return;
            }

            // 生成归档标题（从第一条用户消息）
            const firstUserMsg = state.messages.find(m => m.role === 'user');
            const title = firstUserMsg
                ? firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')
                : 'Untitled Chat';

            const archive: ChatArchive = {
                id: `archive_${Date.now()}`,
                title,
                messages: state.messages,
                selectedCards: state.selectedCardsForChat,
                createdAt: state.messages[0]?.timestamp || Date.now(),
                archivedAt: Date.now()
            };

            // 获取现有归档
            const result = await chrome.storage.local.get([STORAGE_KEYS.CHAT_ARCHIVES]);
            const archives = result[STORAGE_KEYS.CHAT_ARCHIVES] || [];

            // 添加新归档
            const newArchives = [archive, ...archives];
            await chrome.storage.local.set({
                [STORAGE_KEYS.CHAT_ARCHIVES]: newArchives
            });

            // 更新状态
            set({
                chatArchives: newArchives,
                messages: [],
                selectedCardsForChat: []
            });

            // 清空当前对话的持久化
            await chrome.storage.local.remove(STORAGE_KEYS.CURRENT_CHAT);

            console.log('[Store] Chat archived:', archive.id);
        } catch (error) {
            console.error('[Store] Error archiving chat:', error);
        }
    },

    loadArchive: (archiveId: string) => {
        const state = get();
        const archive = state.chatArchives.find(a => a.id === archiveId);

        if (archive) {
            set({
                messages: archive.messages,
                selectedCardsForChat: archive.selectedCards,
                currentView: 'chat'
            });
            console.log('[Store] Loaded archive:', archiveId);
        }
    },

    deleteArchive: async (archiveId: string) => {
        try {
            const state = get();
            const newArchives = state.chatArchives.filter(a => a.id !== archiveId);

            set({ chatArchives: newArchives });
            await chrome.storage.local.set({
                [STORAGE_KEYS.CHAT_ARCHIVES]: newArchives
            });

            console.log('[Store] Archive deleted:', archiveId);
        } catch (error) {
            console.error('[Store] Error deleting archive:', error);
        }
    },

    // exportArchive: (archiveId: string) => {
    //     const state = get();
    //     const archive = state.chatArchives.find(a => a.id === archiveId);
    //
    //     if (archive) {
    //         const dataStr = JSON.stringify(archive, null, 2);
    //         const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    //         const linkElement = document.createElement('a');
    //         linkElement.setAttribute('href', dataUri);
    //         linkElement.setAttribute('download', `chat_${archive.id}.json`);
    //         linkElement.click();
    //         console.log('[Store] Archive exported:', archiveId);
    //     }
    // },


    loadChatArchives: async () => {
        try {
            const result = await chrome.storage.local.get([STORAGE_KEYS.CHAT_ARCHIVES]);
            const archives = result[STORAGE_KEYS.CHAT_ARCHIVES] || [];

            set({ chatArchives: archives });
            console.log('[Store] Loaded', archives.length, 'chat archives');
        } catch (error) {
            console.error('[Store] Error loading archives:', error);
            set({ chatArchives: [] });
        }
    },

    // === UI Actions ===

    setCurrentView: (view) => set({ currentView: view }),
    setShowAddModal: (show) => set({ showAddModal: show }),
}));