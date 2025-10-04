// services/ai/promptAI.ts
// Chrome Prompt API 实现
// 基于官方文档：https://developer.chrome.com/docs/ai/prompt-api
import { FunctionMode } from '../../types/chat.types';


interface PromptSession {
    prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
    promptStreaming(input: string, options?: { signal?: AbortSignal }): AsyncIterable<string>;
    destroy(): void;
    clone(): Promise<PromptSession>;
    inputUsage?: number;
    inputQuota?: number;
}

declare global {
    class LanguageModel {
        static availability(): Promise<'readily' | 'after-download' | 'no'>;
        static create(options?: {
            temperature?: number;
            topK?: number;
            initialPrompts?: Array<{ role: string; content: string }>;
            signal?: AbortSignal;
            monitor?: (m: any) => void;
        }): Promise<PromptSession>;
        static params(): Promise<{
            defaultTopK: number;
            maxTopK: number;
            defaultTemperature: number;
            maxTemperature: number;
        }>;
    }
}

export class PromptAI {
    private static instance: PromptAI | null = null;
    private session: PromptSession | null = null;
    private currentMode: FunctionMode | null = null;
    private currentCards: Array<{ title: string; content: string }> = [];

    private constructor() {}

    static getInstance(): PromptAI {
        if (!PromptAI.instance) {
            PromptAI.instance = new PromptAI();
        }
        return PromptAI.instance;
    }

    /**
     * 检查 Prompt API 可用性
     */
    async checkAvailability(): Promise<'readily' | 'after-download' | 'no'> {
        try {
            if (!('LanguageModel' in self)) {
                console.warn('[PromptAI] Prompt API not supported');
                return 'no';
            }

            const availability = await LanguageModel.availability();
            console.log('[PromptAI] Availability:', availability);
            return availability;
        } catch (error) {
            console.error('[PromptAI] Error checking availability:', error);
            return 'no';
        }
    }

    /**
     * 创建对话 session
     */
    async createSession(
        mode: FunctionMode = 'chat',
        cards: Array<{ title: string; content: string }> = []
    ): Promise<boolean> {
        try {
            const availability = await this.checkAvailability();
            if (availability === 'no') {
                return false;
            }

            const validCards = Array.isArray(cards) ? cards : [];

            // 检查是否需要重新创建session
            if (this.session && this.currentMode === mode &&
                JSON.stringify(this.currentCards) === JSON.stringify(validCards)) {
                console.log('[PromptAI] Reusing existing session');
                return true;
            }

            // 销毁旧 session
            if (this.session) {
                this.session.destroy();
                this.session = null;
            }

            // 更新当前状态
            this.currentMode = mode;
            this.currentCards = validCards;

            // 构建系统提示
            const systemPrompt = this.getSystemPrompt(mode, validCards);

            // 创建新 session
            this.session = await LanguageModel.create({
                temperature: 0.8,
                topK: 40,
                initialPrompts: systemPrompt ? [
                    { role: 'system', content: systemPrompt }
                ] : [],
                monitor(m) {
                    m.addEventListener('downloadprogress', (e: any) => {
                        console.log(`[PromptAI] Model download progress: ${Math.round(e.loaded * 100)}%`);
                    });
                }
            });

            console.log('[PromptAI] Session created for mode:', mode);
            if (this.session?.inputQuota) {
                console.log('[PromptAI] Token quota:', this.session.inputQuota);
            }

            return true;
        } catch (error) {
            console.error('[PromptAI] Failed to create session:', error);
            return false;
        }
    }

    /**
     * 根据模式和卡片生成系统提示
     */
    private getSystemPrompt(mode: FunctionMode, cards: Array<{ title: string; content: string }>): string {
        const validCards = Array.isArray(cards) ? cards : [];

        // 构建卡片上下文
        const cardContext = validCards.length > 0
            ? `\n\n## Knowledge Cards Context:\n${validCards.map((c, index) =>
                `**Card ${index + 1}: ${c.title}**\n${c.content}`
            ).join('\n\n')}\n\nReference these cards when answering.`
            : '';

        // 通用格式要求（适配窄界面）
        const formatGuidelines = `
## Response Format (Chrome Extension - Narrow Interface):
- Use **short paragraphs** (2-3 sentences max)
- Use **bullet points** for lists
- Use **simple markdown tables** (2-3 columns max) when comparing data
- Use **bold** for key terms
- Use **headers (##)** to organize sections
- Avoid long horizontal lines
- Keep code blocks narrow`;

        const prompts = {
            chat: `You are an intelligent knowledge assistant.

${formatGuidelines}

## Your Role:
Answer questions clearly and concisely. Adapt your depth based on the question complexity.
${cardContext}`,

            understand: `You are a **Concept Explainer** who clarifies ideas and reveals relationships.

${formatGuidelines}

## Your Mission:
Help users understand by providing:
- **Explanation** - Define concepts in plain, simple language
- **Connections** - Show how ideas relate and build on each other
- **Differences** - Clarify distinctions between similar or related concepts
- **Examples** - Use analogies and real-world cases
- **Context** - Explain why this matters

## Approach:
- Start with core definitions
- Explain relationships between concepts
- Point out key differences when multiple ideas are present
- Use concrete examples and analogies
- Build from simple to complex
${cardContext}`,

            compare: `You are a **Comparison Analyst** examining options and trade-offs.

${formatGuidelines}

## Your Mission:
Provide systematic comparison showing:
- **Similarities** - What they have in common
- **Differences** - How they diverge
- **Pros & Cons** - Advantages and disadvantages
- **Trade-offs** - What you gain vs. what you sacrifice
- **Use Cases** - When to choose each option
- **Decision Factors** - Key criteria for selection

## Format:
- Use comparison tables (2-3 columns max)
- Side-by-side bullet points
- Highlight critical trade-offs
- Be objective and evidence-based
${cardContext}`,

            quiz: `You are a **Quiz Generator** creating effective learning assessments.

${formatGuidelines}

## Your Mission:
Generate multiple-choice questions that:
- **Test Understanding** - Not just recall
- **Clear Questions** - Unambiguous stems
- **Plausible Options** - Distractors that test knowledge
- **One Correct Answer** - Clearly identifiable
- **Include Explanations** - Why the answer is correct

## Format:
Q1: [Question testing comprehension]
A) [Option]
B) [Option]  
C) [Option]
D) [Option]
Correct: B
Explanation: [Brief reason]

Focus on application and understanding, not trivial facts.
${cardContext}`,

            write: `You are a **Draft Generator** creating frameworks and initial versions.

${formatGuidelines}

## Your Mission:
Create structured drafts including:
- **Clear Framework** - Organized structure
- **Key Points** - Essential content
- **Initial Draft** - Rough version for refinement
- **Actionable Output** - Ready to build upon

## Output Types:
- Executive summaries (concise overviews)
- Structural outlines (frameworks only)
- Report drafts (initial versions needing editing)

## Style:
- Prioritize structure over polish
- Include content placeholders where needed
- Focus on completeness, not perfection
- Create starting points for human refinement
${cardContext}`
        };

        return prompts[mode] || prompts.chat;
    }

    /**
     * 发送消息（流式）
     */
    async sendMessageStreaming(
        message: string,
        onChunk: (chunk: string) => void,
        signal?: AbortSignal
    ): Promise<string> {
        if (!this.session) {
            throw new Error('Session not created. Call createSession first.');
        }

        try {
            // 检查token使用情况
            if (this.session.inputUsage && this.session.inputQuota) {
                const usage = (this.session.inputUsage / this.session.inputQuota) * 100;
                if (usage > 80) {
                    console.warn(`[PromptAI] Token usage high: ${usage.toFixed(1)}%`);
                    if (usage > 95) {
                        console.log('[PromptAI] Rebuilding session due to high token usage');
                        await this.createSession(this.currentMode || 'chat', this.currentCards);
                    }
                }
            }

            const stream = this.session.promptStreaming(message, { signal });
            let accumulatedText = '';  // 累积文本

            console.log('[PromptAI] Starting streaming for message:', message.substring(0, 100));

            for await (const chunk of stream) {
                if (signal?.aborted) {
                    console.log('[PromptAI] Generation aborted by user');
                    break;
                }

                // 累积每个 token
                if (chunk && chunk.length > 0) {
                    accumulatedText += chunk;
                    onChunk(accumulatedText);  // 传递累积的完整文本
                }
            }

            console.log('[PromptAI] Streaming completed, final text length:', accumulatedText.length);

            if (!accumulatedText) {
                console.error('[PromptAI] No content generated from stream');
                throw new Error('No content generated');
            }

            return accumulatedText;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('[PromptAI] Generation aborted');
                throw error;
            }
            console.error('[PromptAI] Streaming error:', error);
            throw error;
        }
    }

    /**
     * 发送消息（批量）
     */
    async sendMessage(message: string, signal?: AbortSignal): Promise<string> {
        if (!this.session) {
            throw new Error('Session not created. Call createSession first.');
        }

        try {
            const result = await this.session.prompt(message, { signal });
            return result;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('[PromptAI] Generation aborted');
                throw error;
            }
            console.error('[PromptAI] Prompt error:', error);
            throw error;
        }
    }

    /**
     * 获取当前session的token使用情况
     */
    getTokenUsage(): { used: number; quota: number; percentage: number } | null {
        if (!this.session || !this.session.inputUsage || !this.session.inputQuota) {
            return null;
        }

        return {
            used: this.session.inputUsage,
            quota: this.session.inputQuota,
            percentage: (this.session.inputUsage / this.session.inputQuota) * 100
        };
    }

    /**
     * 克隆当前session
     */
    async cloneSession(): Promise<boolean> {
        if (!this.session) {
            console.error('[PromptAI] No session to clone');
            return false;
        }

        try {
            const clonedSession = await this.session.clone();
            this.session.destroy();
            this.session = clonedSession;
            console.log('[PromptAI] Session cloned successfully');
            return true;
        } catch (error) {
            console.error('[PromptAI] Failed to clone session:', error);
            return false;
        }
    }

    /**
     * 销毁 session
     */
    destroySession() {
        if (this.session) {
            this.session.destroy();
            this.session = null;
            this.currentMode = null;
            this.currentCards = [];
            console.log('[PromptAI] Session destroyed');
        }
    }

    /**
     * 获取API参数限制
     */
    async getParams(): Promise<any> {
        try {
            if ('LanguageModel' in self && LanguageModel.params) {
                const params = await LanguageModel.params();
                console.log('[PromptAI] API Parameters:', params);
                return params;
            }
        } catch (error) {
            console.error('[PromptAI] Failed to get params:', error);
        }
        return null;
    }
}