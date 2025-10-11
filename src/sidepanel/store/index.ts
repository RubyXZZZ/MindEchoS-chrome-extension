// state management
import { create } from 'zustand';
import { KnowledgeCard } from '../types/card.types';
import { ChatMessage, ChatArchive } from '../types/chat.types';
import {
    ALL_CARDS_FILTER,
    DEFAULT_CATEGORY,
    PROTECTED_CATEGORIES,
    STORAGE_KEYS,
    SAMPLE_CARD_ID
} from '../utils/constants';
import { generateArchiveId } from '../utils/idGenerator';
import { formatArchiveDate } from '../utils/formatters';

interface SelectionPayload {
    text: string;
    url: string;
    title?: string;
    needsAISummarize?: boolean;
    needsContentSummary?: boolean;
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

    // Storage
    storageUsed: number;
    storageLimit: number;

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
    loadChatArchives: () => Promise<void>;

    // Settings Actions
    resetCardNumbers: () => Promise<void>;

    // Storage Actions
    updateStorageUsage: () => Promise<void>;

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

    // === Storage State ===
    storageUsed: 0,
    storageLimit: 10485760,  // 10 MB

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
                            needsAISummarize: newValue.needsAISummarize || false,
                            needsContentSummary: newValue.needsContentSummary !== false
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
                        needsAISummarize: pendingData.needsAISummarize || false,
                        needsContentSummary: pendingData.needsContentSummary !== false
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

            if (!result[STORAGE_KEYS.CARDS] || !Array.isArray(result[STORAGE_KEYS.CARDS])) {
                const sampleCard: KnowledgeCard = {
                    id: SAMPLE_CARD_ID,
                    displayNumber: 0,
                    title: 'Quick Start Guide',
                    content: `## 📝 Create Cards with AI-Summarize
1. **From selected text**:   
    • Click ➕ → **SELECTION**
    • **RIGHT-CLICK** or **SHORTCUT** when panel is closed
💡 Win:\`Ctl+Shift+S\` Mac: \`Cmd+Shift+S\` (⚙️ Settings)
2. **From Webpage Article**: Click ➕→ **WEBPAGE**

---

## 🗂️ Organize Cards:
1. 🔍 Search (toggle AI SWITCH for semantic matching)
2. Manage mode: batch select, delete, export, move categories

---

## 🤖 AI Interaction:
1. Click 🤖 or use MANAGE to select cards for AI context
2. AI reads selected cards and answers questions
3. Quick actions: Understand, Compare, Quiz, Write (Summary, Outline, Draft)

---

## 📌 Tips:
• Short text (under 180 chars): saves directly without AI
• First AI use: wait 2-5 sec for initialization
• Reset card number in ⚙️ Settings if needed
• Archive conversations via Manage mode (AI view)
• Privacy: Chrome's built-in Gemini Nano runs locally`,
                    url: '',
                    timestamp: Date.now(),
                    tags: [],
                    category: DEFAULT_CATEGORY,
                    color: 'bg-yellow-100',
                };

                await chrome.storage.local.set({ [STORAGE_KEYS.CARDS]: [sampleCard] });
                set({ cards: [sampleCard] });
            } else {
                const loadedCards = result[STORAGE_KEYS.CARDS];
                set({ cards: loadedCards });
            }

            if (result[STORAGE_KEYS.USER_CATEGORIES] && Array.isArray(result[STORAGE_KEYS.USER_CATEGORIES])) {
                const loadedUserCategories = result[STORAGE_KEYS.USER_CATEGORIES].filter((c: any) =>
                    typeof c === 'string' && c.trim() !== ''
                );
                set({ userCategories: loadedUserCategories });
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

            get().updateStorageUsage();
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

            get().updateStorageUsage();
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

            get().updateStorageUsage();
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

            get().updateStorageUsage();
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

            // archive time as title
            const title = formatArchiveDate(Date.now());

            const archive: ChatArchive = {
                id: generateArchiveId(),
                title,
                messages: state.messages,
                selectedCards: state.selectedCardsForChat,
                createdAt: state.messages[0]?.timestamp || Date.now(),
                archivedAt: Date.now()
            };

            const result = await chrome.storage.local.get([STORAGE_KEYS.CHAT_ARCHIVES]);
            const archives = result[STORAGE_KEYS.CHAT_ARCHIVES] || [];

            const newArchives = [archive, ...archives];
            await chrome.storage.local.set({
                [STORAGE_KEYS.CHAT_ARCHIVES]: newArchives
            });

            set({
                chatArchives: newArchives,
                messages: [],
                selectedCardsForChat: []
            });

            await chrome.storage.local.remove(STORAGE_KEYS.CURRENT_CHAT);

            get().updateStorageUsage();

            console.log('[Store] Chat archived:', archive.id, 'Title:', title);
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

            get().updateStorageUsage();

            console.log('[Store] Archive deleted:', archiveId);
        } catch (error) {
            console.error('[Store] Error deleting archive:', error);
        }
    },

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

    // === Settings Actions ===

    resetCardNumbers: async () => {
        try {
            const state = get();
            const cards = [...state.cards].sort((a, b) => a.timestamp - b.timestamp);

            let nextNumber = 1;
            const updatedCards = cards.map((card) => {
                // Sample == 00
                if (card.id === SAMPLE_CARD_ID) {
                    return { ...card, displayNumber: 0 };
                }
                const displayNumber = nextNumber;
                nextNumber++;
                return { ...card, displayNumber };
            });

            set({ cards: updatedCards });
            await chrome.storage.local.set({ [STORAGE_KEYS.CARDS]: updatedCards });
            await chrome.storage.local.set({ [STORAGE_KEYS.NEXT_DISPLAY_NUMBER]: nextNumber });
        } catch (error) {
            console.error('[Store] Error resetting card numbers:', error);
        }
    },

    // === Storage Actions ===

    updateStorageUsage: async () => {
        try {
            const bytesInUse = await chrome.storage.local.getBytesInUse(null);
            set({ storageUsed: bytesInUse });
        } catch (error) {
            console.error('[Store] Error getting storage usage:', error);
        }
    },

    // === UI Actions ===

    setCurrentView: (view) => set({ currentView: view }),
    setShowAddModal: (show) => set({ showAddModal: show }),
}));