export const CARD_COLORS = [
    'bg-gradient-to-br from-purple-100 to-pink-100',
    'bg-gradient-to-br from-blue-100 to-cyan-100',
    'bg-gradient-to-br from-green-100 to-emerald-100',
    'bg-gradient-to-br from-yellow-100 to-orange-100',
    'bg-gradient-to-br from-red-100 to-pink-100',
    'bg-gradient-to-br from-indigo-100 to-purple-100',
];

export const CARD_CATEGORIES = ['All', 'Technology', 'Design', 'Business', 'Other'] as const;

export const STORAGE_KEYS = {
    CARDS: 'knowledge_cards',
    CHAT_HISTORY: 'chat_history',
    PREFERENCES: 'user_preferences',
} as const;