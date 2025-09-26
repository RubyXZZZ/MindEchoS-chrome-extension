

import { KnowledgeCard } from '../../types/card.types';
import { ChatMessage, ChatMode } from '../../types/chat.types';

/**
 * Chrome AI Prompt API wrapper
 * Handles AI chat and prompt generation
 * Uses Chrome's built-in Language Model API
 */

interface PromptSession {
    prompt(text: string): Promise<string>;
    destroy(): void;
}

interface LanguageModelCapabilities {
    available: 'readily' | 'after-download' | 'no';
}

export class PromptsAI {
    private static session: PromptSession | null = null;
    private static isInitializing = false;

    /**
     * Check if Chrome AI Language Model is available
     */
    static async checkCapabilities(): Promise<boolean> {
        // Check for Chrome AI availability
        if (!('ai' in self) || !('languageModel' in (self as any).ai)) {
            console.log('Chrome AI Language Model not available');
            return false;
        }

        try {
            const capabilities = await (self as any).ai.languageModel.capabilities();
            return capabilities.available !== 'no';
        } catch (error) {
            console.error('Failed to check language model capabilities:', error);
            return false;
        }
    }

    /**
     * Create or get existing prompt session
     */
    static async getSession(): Promise<PromptSession | null> {
        // Return existing session if available
        if (this.session) {
            return this.session;
        }

        // Prevent multiple initialization attempts
        if (this.isInitializing) {
            // Wait a bit for initialization to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.session;
        }

        this.isInitializing = true;

        try {
            // Check if API is available
            const isAvailable = await this.checkCapabilities();
            if (!isAvailable) {
                this.isInitializing = false;
                return null;
            }

            // Get capabilities
            const capabilities: LanguageModelCapabilities = await (self as any).ai.languageModel.capabilities();

            if (capabilities.available === 'after-download') {
                console.log('Downloading language model...');
            }

            // Create session with options
            const sessionOptions = {
                temperature: 0.8,
                topK: 50,
                systemPrompt: `You are a helpful AI assistant for a knowledge management system. 
          You help users organize, understand, and explore their knowledge cards.
          Respond in the same language as the user (Chinese or English).
          Be concise but informative.`
            };

            this.session = await (self as any).ai.languageModel.create(sessionOptions);
            this.isInitializing = false;
            return this.session;
        } catch (error) {
            console.error('Failed to create language model session:', error);
            this.isInitializing = false;
            return null;
        }
    }

    /**
     * Generate response for chat
     */
    static async generateResponse(
        message: string,
        context?: {
            mode: ChatMode;
            cards?: KnowledgeCard[];
            history?: ChatMessage[];
        }
    ): Promise<string> {
        try {
            // Get or create session
            const session = await this.getSession();

            if (!session) {
                return this.getFallbackResponse(message, context);
            }

            // Build context-aware prompt
            const prompt = this.buildPrompt(message, context);

            // Generate response using Chrome AI
            const response = await session.prompt(prompt);

            return response;
        } catch (error) {
            console.error('Prompt generation failed:', error);

            // If session failed, try to recreate it
            this.session = null;

            return this.getFallbackResponse(message, context);
        }
    }

    /**
     * Build prompt with context
     */
    private static buildPrompt(
        message: string,
        context?: {
            mode: ChatMode;
            cards?: KnowledgeCard[];
            history?: ChatMessage[];
        }
    ): string {
        let prompt = '';

        // Add mode-specific context
        if (context?.mode === 'cards' && context.cards && context.cards.length > 0) {
            prompt += '基于以下知识卡片内容回答问题。\n\n';
            prompt += '相关知识卡片：\n';
            context.cards.forEach((card, index) => {
                prompt += `\n卡片${index + 1}: ${card.title}\n`;
                prompt += `摘要: ${card.summary}\n`;
                if (card.content) {
                    prompt += `内容: ${card.content.substring(0, 500)}\n`;
                }
                if (card.tags && card.tags.length > 0) {
                    prompt += `标签: ${card.tags.join(', ')}\n`;
                }
            });
            prompt += '\n请基于以上卡片内容，';
        } else if (context?.mode === 'mindmap') {
            prompt += '请帮助生成思维导图结构。使用以下格式：\n';
            prompt += '- 主题\n';
            prompt += '  - 分支1\n';
            prompt += '    - 子分支1.1\n';
            prompt += '  - 分支2\n';
            prompt += '    - 子分支2.1\n\n';
            prompt += '用户需求：';
        } else {
            // Free chat mode
            prompt += '作为知识管理助手，';
        }

        // Add recent conversation history for context
        if (context?.history && context.history.length > 0) {
            const recentHistory = context.history.slice(-3); // Last 3 messages
            if (recentHistory.length > 0) {
                prompt += '最近对话：\n';
                recentHistory.forEach(msg => {
                    if (msg.role === 'user') {
                        prompt += `用户: ${msg.content}\n`;
                    } else {
                        prompt += `助手: ${msg.content.substring(0, 200)}...\n`;
                    }
                });
                prompt += '\n';
            }
        }

        // Add the current user message
        prompt += `用户问题：${message}\n`;
        prompt += '助手回复：';

        return prompt;
    }

    /**
     * Fallback response when Chrome AI is not available
     */
    private static getFallbackResponse(
        message: string,
        context?: {
            mode: ChatMode;
            cards?: KnowledgeCard[];
            history?: ChatMessage[];
        }
    ): string {
        // Check if Chrome AI is available at all
        if (!('ai' in self)) {
            return `Chrome AI 功能尚未启用。请确保您使用的是 Chrome 127+ 版本，并在 chrome://flags 中启用以下功能：
      
1. 搜索并启用 "Prompt API for Gemini Nano"
2. 搜索并启用 "Enables optimization guide on device"
3. 重启浏览器
      
启用后，AI 功能将可以正常使用。`;
        }

        // Provide mode-specific fallback responses
        if (context?.mode === 'cards' && context.cards && context.cards.length > 0) {
            const cardTitles = context.cards.map(c => c.title).join('、');
            return `我正在查看您选择的卡片：${cardTitles}。\n\n关于"${message}"，这些卡片包含了相关信息。由于 AI 服务暂时不可用，建议您直接查看卡片内容获取详细信息。`;
        }

        if (context?.mode === 'mindmap') {
            return `思维导图主题：${message}\n\n基础结构：\n- ${message}\n  - 核心概念\n  - 相关要素\n  - 实践应用\n  - 扩展思考\n\n（AI 服务暂时不可用，这是一个基础模板）`;
        }

        // Free chat fallback
        return `收到您的消息："${message}"\n\nAI 服务暂时不可用。请稍后再试，或检查 Chrome AI 设置是否正确配置。`;
    }

    /**
     * Generate mindmap structure
     */
    static async generateMindmap(topic: string): Promise<string> {
        const response = await this.generateResponse(topic, {
            mode: 'mindmap',
            cards: undefined,
            history: []
        });

        return response;
    }

    /**
     * Analyze cards and find patterns
     */
    static async analyzeCards(cards: KnowledgeCard[]): Promise<string> {
        if (cards.length === 0) {
            return '没有卡片可供分析';
        }

        const prompt = `分析这些知识卡片，找出主要主题、关联性和知识结构`;

        return await this.generateResponse(prompt, {
            mode: 'cards',
            cards: cards,
            history: []
        });
    }

    /**
     * Clean up resources
     */
    static destroy(): void {
        if (this.session) {
            try {
                this.session.destroy();
            } catch (error) {
                console.error('Failed to destroy session:', error);
            }
            this.session = null;
        }
        this.isInitializing = false;
    }

    /**
     * Reset session (useful for clearing context)
     */
    static async reset(): Promise<void> {
        this.destroy();
        // Session will be recreated on next use
    }
}