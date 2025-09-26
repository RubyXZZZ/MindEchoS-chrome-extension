/**
 * General AI configuration and utilities
 */

export interface AICapabilities {
    available: 'readily' | 'after-download' | 'no';
}

export interface AIConfig {
    summarizer?: {
        type: 'tl;dr' | 'key-points' | 'teaser' | 'headline';
        format: 'plain-text' | 'markdown';
        length: 'short' | 'medium' | 'long';
    };
    prompt?: {
        temperature?: number;
        topK?: number;
        maxTokens?: number;
    };
}

export class AIService {
    static async checkAvailability(): Promise<{
        summarizer: boolean;
        prompt: boolean;
    }> {
        return {
            summarizer: 'ai' in self && 'summarizer' in (self as any).ai,
            prompt: 'ai' in self && 'languageModel' in (self as any).ai
        };
    }

    static getDefaultConfig(): AIConfig {
        return {
            summarizer: {
                type: 'tl;dr',
                format: 'plain-text',
                length: 'medium'
            },
            prompt: {
                temperature: 0.7,
                topK: 40,
                maxTokens: 1000
            }
        };
    }
}
