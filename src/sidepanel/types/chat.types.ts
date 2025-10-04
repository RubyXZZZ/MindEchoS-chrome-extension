// types/chat.types.ts

export type FunctionMode = 'understand' | 'compare' | 'quiz' | 'write' | 'chat';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    mode: 'chat';  // 简化为固定值
    status?: 'pending' | 'accepted' | 'rejected';
    rejectionReason?: string;
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