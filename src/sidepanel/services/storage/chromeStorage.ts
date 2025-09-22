
import { ChatMessage } from '../../types/chat.types.ts';
import { KnowledgeCard } from '../../types/card.types.ts';
import { STORAGE_KEYS } from '../../utils/constants';

export class ChromeStorageService {
    // Save cards to chrome.storage.local
    static async saveCards(cards: KnowledgeCard[]): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ [STORAGE_KEYS.CARDS]: cards });
        } else {
            // Fallback to localStorage for development
            localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
        }
    }

    // Load cards from chrome.storage.local
    static async loadCards(): Promise<KnowledgeCard[]> {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get(STORAGE_KEYS.CARDS);
            return result[STORAGE_KEYS.CARDS] || [];
        } else {
            // Fallback to localStorage for development
            const stored = localStorage.getItem(STORAGE_KEYS.CARDS);
            return stored ? JSON.parse(stored) : [];
        }
    }

    // Save chat history
    static async saveChatHistory(messages: ChatMessage[]): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ [STORAGE_KEYS.CHAT_HISTORY]: messages });
        } else {
            localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
        }
    }

    // Load chat history
    static async loadChatHistory(): Promise<ChatMessage[]> {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get(STORAGE_KEYS.CHAT_HISTORY);
            return result[STORAGE_KEYS.CHAT_HISTORY] || [];
        } else {
            const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
            return stored ? JSON.parse(stored) : [];
        }
    }
}