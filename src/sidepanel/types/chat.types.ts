// types/chat.types.ts

export type FunctionMode = 'chat' | 'insight' | 'structure' | 'search' | 'write';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    mode?: FunctionMode;
    status?: 'pending' | 'accepted' | 'rejected';  // AI 消息的状态
    rejectionReason?: string;  // 拒绝理由
    triggeredBy?: string;  // 触发来源（如 Insight, Compare, Explore, Write）
}

// export interface ChatSession {
//     id: string;
//     cardIds: string[];  // 关联的卡片 ID
//     messages: ChatMessage[];
//     mode: FunctionMode;
//     createdAt: number;
// }

export interface ChatArchive {
    id: string;
    title: string;  // 自动从首条消息生成
    messages: ChatMessage[];
    selectedCards: string[];  // 关联的卡片
    createdAt: number;
    archivedAt: number;
}
