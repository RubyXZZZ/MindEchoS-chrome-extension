
// Chrome AI APIs Type Definitions (Chrome 138+)
// - Summarizer API: https://developer.chrome.com/docs/ai/summarizer-api
// - Prompt API: https://developer.chrome.com/docs/ai/prompt-api

// ============= Summarizer API Types =============

export interface SummarizerMonitor {
    addEventListener(event: 'downloadprogress', callback: (e: { loaded: number; total: number }) => void): void;
}

export interface SummarizerOptions {
    sharedContext?: string;
    type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
    format?: 'markdown' | 'plain-text';
    length?: 'short' | 'medium' | 'long';
    outputLanguage?: 'en' | 'es' | 'ja';
    monitor?: (m: SummarizerMonitor) => void;
}

export interface SummarizerInstance {
    summarize(text: string, options?: { context?: string }): Promise<string>;
    summarizeStreaming(text: string, options?: { context?: string }): AsyncIterable<string>;
    destroy(): void;
}

export interface SummarizeResult {
    success: boolean;
    title?: string;
    content?: string;
    error?: string;
}

// ============= Prompt API Types =============

export interface PromptAPIMonitor {
    addEventListener(event: 'downloadprogress', callback: (e: { loaded: number; total: number }) => void): void;
}

export interface PromptSessionOptions {
    temperature?: number;
    topK?: number;
    initialPrompts?: Array<{ role: string; content: string; prefix?: boolean }>;
    signal?: AbortSignal;
    monitor?: (m: PromptAPIMonitor) => void;
    expectedInputs?: Array<{
        type: 'text' | 'image' | 'audio';
        languages?: string[];
    }>;
    expectedOutputs?: Array<{
        type: 'text';
        languages?: string[];
    }>;
}

export interface PromptSession {
    prompt(input: string, options?: {
        signal?: AbortSignal;
        responseConstraint?: unknown;
        omitResponseConstraintInput?: boolean;
    }): Promise<string>;
    promptStreaming(input: string, options?: {
        signal?: AbortSignal;
        responseConstraint?: unknown;
        omitResponseConstraintInput?: boolean;
    }): AsyncIterable<string>;
    append(messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string | Array<{ type: string; value: unknown }>;
    }>): Promise<void>;
    destroy(): void;
    clone(options?: { signal?: AbortSignal }): Promise<PromptSession>;
    inputUsage?: number;
    inputQuota?: number;
}

export interface LanguageModelParams {
    defaultTopK: number;
    maxTopK: number;
    defaultTemperature: number;
    maxTemperature: number;
}

export type AIAvailability = 'readily' | 'after-download' | 'no';

// ============= Search AI Types =============

export interface CardForSearch {
    id: string;
    displayNumber: number;
    title: string;
    content: string;
}

// ============= Global Declarations =============

declare global {
    // Summarizer API
    class Summarizer {
        static availability(): Promise<AIAvailability>;
        static create(options?: SummarizerOptions): Promise<SummarizerInstance>;
    }

    // Prompt API
    class LanguageModel {
        static availability(): Promise<AIAvailability>;
        static create(options?: PromptSessionOptions): Promise<PromptSession>;
        static params(): Promise<LanguageModelParams>;
    }
}


export {};