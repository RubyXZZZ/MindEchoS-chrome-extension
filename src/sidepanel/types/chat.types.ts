export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    status?: 'sending' | 'sent' | 'error';
    relatedCards?: string[];
}

export type ChatMode = 'free' | 'cards' | 'mindmap';