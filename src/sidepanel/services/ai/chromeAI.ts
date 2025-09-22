
import { SummarizationOptions, PromptOptions } from '../../types/ai.types';

export class ChromeAIService {
    // Initialize Chrome AI APIs (placeholder for now)
    static async initialize(): Promise<void> {
        // Check if Chrome AI APIs are available
        if ('ai' in window && 'summarizer' in (window as Window & { ai: unknown })) {
            console.log('Chrome AI APIs available');
            // Initialize when APIs are available
        } else {
            console.log('Chrome AI APIs not available, using mock mode');
        }
    }

    // Summarize content using Chrome Summarizer API
    static async summarize(
        content: string,
        options: SummarizationOptions = { type: 'key-points' }
    ): Promise<string> {
        // Mock implementation for development
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockSummaries: Record<string, string> = {
            'key-points': `• 主要观点1：${content.substring(0, 50)}...\n• 主要观点2：重要内容\n• 主要观点3：关键结论`,
            'tl;dr': `简要总结：${content.substring(0, 100)}...`,
            'teaser': `精彩内容预览：${content.substring(0, 80)}...`,
            'headline': `标题：${content.substring(0, 30)}`,
        };

        return mockSummaries[options.type];
    }

    // Create prompt session using Chrome Prompt API
    static async createPromptSession(options?: PromptOptions): Promise<void> {
        // Mock implementation
        void options; // Mark as intentionally unused
        console.log('Creating prompt session');
    }

    // Generate response using Chrome Prompt API
    static async prompt(message: string, context?: string): Promise<string> {
        // Mock implementation - will use message and context when Chrome AI APIs are available
        void message; // Mark as intentionally unused
        void context; // Mark as intentionally unused

        await new Promise(resolve => setTimeout(resolve, 1000));

        const responses = [
            '这是一个很好的观点，让我来深入分析...',
            '基于你的知识卡片，我发现了一些有趣的关联...',
            '我正在分析相关内容，这里有一些见解...',
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Check if APIs are available
    static async checkAvailability(): Promise<{
        summarizer: boolean;
        prompting: boolean;
    }> {
        const hasSummarizer = 'ai' in window && 'summarizer' in ((window as Window & { ai: unknown }).ai as object || {});
        const hasPrompting = 'ai' in window && 'languageModel' in ((window as Window & { ai: unknown }).ai as object || {});

        return {
            summarizer: hasSummarizer,
            prompting: hasPrompting,
        };
    }
}

// src/services/ai/prompts.ts
import { KnowledgeCard } from '../../types/card.types';

export const SYSTEM_PROMPTS = {
    CARD_ANALYSIS: `You are a helpful assistant that analyzes knowledge cards and provides insights.
Focus on finding connections between cards and generating useful summaries.`,

    MINDMAP_GENERATION: `You are a mindmap generator. Create structured hierarchical representations
of knowledge based on the provided cards.`,

    FREE_CHAT: `You are a friendly assistant helping users understand and explore their knowledge base.
Provide clear and helpful responses.`,
};

export const createCardContext = (cards: KnowledgeCard[]): string => {
    return cards.map(card =>
        `Title: ${card.title}\nContent: ${card.content}\nTags: ${card.tags.join(', ')}`
    ).join('\n\n');
};
