export const CARD_COLORS = [
    'bg-gradient-to-br from-purple-100 to-pink-100',
    'bg-gradient-to-br from-blue-100 to-cyan-100',
    'bg-gradient-to-br from-green-100 to-emerald-100',
    'bg-gradient-to-br from-yellow-100 to-orange-100',
    'bg-gradient-to-br from-red-100 to-pink-100',
    'bg-gradient-to-br from-indigo-100 to-purple-100',
];

// --- New Category Logic ---

// The filter to show all cards, not an assignable category.
export const ALL_CARDS_FILTER = 'All';

// The default category for new cards. This is an assignable category.
export const DEFAULT_CATEGORY = 'Other';

// The initial list of assignable categories.
export const INITIAL_CATEGORIES = [DEFAULT_CATEGORY] as const;

// Non-deletable categories.
export const PROTECTED_CATEGORIES = [DEFAULT_CATEGORY];

export const STORAGE_KEYS = {
    CARDS: 'knowledge_cards',
    CURRENT_CHAT: 'current_chat',        // 新增：当前对话
    CHAT_ARCHIVES: 'chat_archives',      // 新增：归档对话
    PREFERENCES: 'user_preferences',
    USER_CATEGORIES: 'userCategories', // Explicitly define storage key for categories
} as const;