// types/ai.types.ts
// Chrome Summarizer API 类型定义 (Chrome 138+)
// 基于官方文档：https://developer.chrome.com/docs/ai/summarizer-api

// ============= Summarizer API Types =============

export interface SummarizerMonitor {
    addEventListener(event: 'downloadprogress', callback: (e: { loaded: number; total: number }) => void): void;
}

export interface SummarizerOptions {
    sharedContext?: string;
    type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
    format?: 'markdown' | 'plain-text';
    length?: 'short' | 'medium' | 'long';
    monitor?: (m: SummarizerMonitor) => void;
}

export interface SummarizerInstance {
    summarize(text: string, options?: { context?: string }): Promise<string>;
    summarizeStreaming(text: string, options?: { context?: string }): ReadableStream<string>;
    destroy(): void;
}

// ============= Result Types =============

export interface SummarizeResult {
    success: boolean;
    title?: string;
    content?: string;
    error?: string;
}

// ============= Global Declarations =============

declare global {
    class Summarizer {
        static availability(): Promise<'readily' | 'downloadable' | 'unavailable'>;
        static create(options?: SummarizerOptions): Promise<SummarizerInstance>;
    }
}

// 导出空对象以确保文件被视为模块
export {};