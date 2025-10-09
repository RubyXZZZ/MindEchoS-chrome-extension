// types/chat.types.ts

// export type FunctionMode = 'understand' | 'compare' | 'quiz' | 'write' | 'chat';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    mode: 'chat';
    status?: 'pending' | 'accepted';
    triggeredBy?: string;
}

export interface ChatArchive {
    id: string;
    title: string;
    messages: ChatMessage[];
    selectedCards: string[];
    createdAt: number;
    archivedAt: number;
}