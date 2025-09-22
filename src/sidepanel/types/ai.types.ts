// // Chrome Built-in AI API Types
// // Note: 这些类型基于Chrome 129+ 的实验性API
// // 实际使用时需要检查 window.ai 是否可用
//
// export interface ChromeAI {
//     languageModel: {
//         capabilities: () => Promise<AICapabilities>;
//         create: (options?: AISessionOptions) => Promise<AISession>;
//     };
//     summarizer?: {
//         capabilities: () => Promise<SummarizerCapabilities>;
//         create: (options?: SummarizerOptions) => Promise<Summarizer>;
//     };
// }
//
// export interface AICapabilities {
//     available: 'readily' | 'after-download' | 'no';
//     defaultTemperature?: number;
//     defaultTopK?: number;
//     maxTopK?: number;
// }
//
// export interface AISessionOptions {
//     temperature?: number;
//     topK?: number;
//     systemPrompt?: string;
// }
//
// export interface AISession {
//     prompt: (text: string) => Promise<string>;
//     promptStreaming: (text: string) => AsyncIterable<string>;
//     destroy: () => void;
//     tokensSoFar: number;
//     tokensLeft: number;
//     maxTokens: number;
// }
//
// export interface SummarizerCapabilities {
//     available: 'readily' | 'after-download' | 'no';
// }
//
// export interface SummarizerOptions {
//     type?: 'tl;dr' | 'key-points' | 'teaser' | 'headline';
//     format?: 'plain' | 'markdown';
//     length?: 'short' | 'medium' | 'long';
// }
//
// export interface Summarizer {
//     summarize: (text: string) => Promise<string>;
//     summarizeStreaming: (text: string) => AsyncIterable<string>;
//     destroy: () => void;
// }
//
// // Custom AI Service Types
// export interface AIService {
//     isAvailable: () => Promise<boolean>;
//     createSession: (options?: AISessionOptions) => Promise<AISession | null>;
//     generateResponse: (prompt: string, context?: string) => Promise<string>;
//     summarizeContent: (content: string, type?: SummarizerOptions['type']) => Promise<string>;
//     extractKeywords: (text: string) => Promise<string[]>;
// }

// src/types/ai.types.ts
export interface AICapabilities {
    summarization: boolean;
    prompting: boolean;
    translation: boolean;
}

export interface SummarizationOptions {
    type: 'key-points' | 'tl;dr' | 'teaser' | 'headline';
    length?: 'short' | 'medium' | 'long';
    format?: 'plain-text' | 'markdown';
}

export interface PromptOptions {
    systemPrompt?: string;
    temperature?: number;
    topK?: number;
}