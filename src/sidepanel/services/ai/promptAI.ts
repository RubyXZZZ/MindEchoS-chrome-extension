// services/ai/promptAI.ts
// Chrome Prompt API 实现

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

// 集中管理所有功能的 Prompts
export const FUNCTION_PROMPTS = {
    understand: {
        getPrompt: (cardCount: number) => `Help me understand the card content simply and effectively. Follow these guidelines:

- Start with the main idea and explain key concepts clearly
- Use analogies or short examples to make it easy to grasp
- ${cardCount > 1 ? 'Show how the cards relate or differ' : 'Analyze relationships among keypoints'}
- Keep under 250 words total`
    },

    compare: {
        getPrompt: (cardCount: number) => `Compare the selected ${cardCount} cards systematically.

1. State the primary relationship between the cards' topics.
2. Use a comparison table or bullets showing key distinctions.
3. Highlight pros/cons and when to use each option.
4. Be concise. Keep under 300 words.`
    },

    quiz: {
        getPrompt: (cardCount: number) => `Generate ${Math.min(2 + cardCount, 5)} multiple-choice questions to test understanding of the card content.

Requirements:
- Test comprehension, not memorization
- Each question has EXACTLY 3 options (A, B, C) - never use D
- Clear question stems

Format (follow strictly):
Q1: [question]
A) [option]
B) [option]
C) [option]

Q2: [question]
A) [option]
B) [option]
C) [option]

-------
Answers:
Q1: B (brief one-sentence explanation)
Q2: A (brief one-sentence explanation)

All answers must be provided at the end after "-------", not after each question.`
    },

    write: {
        summary: `Create a summary based on the selected cards.

Requirements:
1. Main point (1 sentence) + Key findings (3-5 bullets) + Conclusion/takeaway
2. 150-200 words maximum
3. Opening thesis + bullet points + bold critical terms
4. Focus on what decision-makers need to know

Output a concise, actionable summary.`,

        outline: `Create a structural outline based on the selected cards.

Requirements:
1. Main Topics: Identify the main topics and use them as top-level bullet points.
2. Sub-points: List supporting details or examples as nested bullet points under the relevant topic.
3. Use Keywords: Use short phrases and keywords, not full sentences.

Output a skeleton framework ready to be filled in.`,

        draft: `Generate a report draft based on the selected cards.

Requirements:
1. About Structure: Introduction (2-3 sentences) + Main Body (2-3 sections with headers) + Conclusion (2-3 sentences)
2. About Content: Combine the key ideas from the cards and context into logical and smooth paragraphs.Maintain a neutral tone. Avoid repetition or filler.
3. About Format: Use ## headers, 2-3 sentences per paragraph, bullets for lists
4. About Length: 350 words maximum.


Output an initial version requiring editing and refinement.`
    }
};

export class PromptAI {
    private static instance: PromptAI | null = null;
    private session: PromptSession | null = null;
    private currentCards: Array<{ title: string; content: string; url?: string }> = [];

    private constructor() {}

    static getInstance(): PromptAI {
        if (!PromptAI.instance) {
            PromptAI.instance = new PromptAI();
        }
        return PromptAI.instance;
    }

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

    async createSession(
        cards: Array<{ title: string; content: string; url?: string }> = []
    ): Promise<boolean> {
        try {
            const availability = await this.checkAvailability();
            if (availability === 'no') {
                return false;
            }

            const validCards = Array.isArray(cards) ? cards : [];

            if (this.session && JSON.stringify(this.currentCards) === JSON.stringify(validCards)) {
                console.log('[PromptAI] Reusing existing session');
                return true;
            }

            if (this.session) {
                this.session.destroy();
                this.session = null;
            }

            this.currentCards = validCards;

            const systemPrompt = this.getSystemPrompt(validCards);

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

            console.log('[PromptAI] Session created with', validCards.length, 'cards');
            if (this.session?.inputQuota) {
                console.log('[PromptAI] Token quota:', this.session.inputQuota);
            }

            return true;
        } catch (error) {
            console.error('[PromptAI] Failed to create session:', error);
            return false;
        }
    }

    private getSystemPrompt(cards: Array<{ title: string; content: string; url?: string }>): string {
        const validCards = Array.isArray(cards) ? cards : [];

        const cardContext = validCards.length > 0
            ? `\n\n## Knowledge Cards Context:\n${validCards.map((c, index) =>
                `**Card ${index + 1}: ${c.title}**\n${c.content}${c.url ? `\nSource: ${c.url}` : ''}`
            ).join('\n\n')}\n\nUse these cards as the knowledge base for your response.`
            : '';

        const systemPrompt = `You are an intelligent assistant helping users work with their knowledge cards.

Format Rules (Narrow Chrome Extension):
- Paragraphs: 2-3 sentences maximum
- Lists: Use bullet points
- Tables: If >3 columns needed, transpose (swap rows/columns) so columns < rows
- Style: Direct and concise, no filler
${cardContext}`;

        return systemPrompt;
    }

    async sendMessageStreaming(
        message: string,
        onChunk: (chunk: string) => void,
        signal?: AbortSignal
    ): Promise<string> {
        if (!this.session) {
            throw new Error('Session not created. Call createSession first.');
        }

        try {
            if (this.session.inputUsage && this.session.inputQuota) {
                const usage = (this.session.inputUsage / this.session.inputQuota) * 100;
                if (usage > 95) {
                    await this.createSession(this.currentCards);
                }
            }

            const stream = this.session.promptStreaming(message, { signal });
            let accumulatedText = '';

            for await (const chunk of stream) {
                if (signal?.aborted) break;
                if (chunk && chunk.length > 0) {
                    accumulatedText += chunk;
                    onChunk(accumulatedText);
                }
            }

            if (!accumulatedText) {
                throw new Error('No content generated');
            }

            return accumulatedText;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw error;
            }
            console.error('[PromptAI] Streaming error:', error);
            throw error;
        }
    }

    async sendMessage(message: string, signal?: AbortSignal): Promise<string> {
        if (!this.session) {
            throw new Error('Session not created.');
        }

        try {
            return await this.session.prompt(message, { signal });
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw error;
            }
            throw error;
        }
    }

    getTokenUsage(): { used: number; quota: number; percentage: number } | null {
        if (!this.session?.inputUsage || !this.session?.inputQuota) {
            return null;
        }

        return {
            used: this.session.inputUsage,
            quota: this.session.inputQuota,
            percentage: (this.session.inputUsage / this.session.inputQuota) * 100
        };
    }

    async cloneSession(): Promise<boolean> {
        if (!this.session) return false;

        try {
            const clonedSession = await this.session.clone();
            this.session.destroy();
            this.session = clonedSession;
            return true;
        } catch (error) {
            return false;
        }
    }

    destroySession() {
        if (this.session) {
            this.session.destroy();
            this.session = null;
            this.currentCards = [];
            console.log('[PromptAI] Session destroyed');
        }
    }

    async getParams(): Promise<any> {
        try {
            if ('LanguageModel' in self && LanguageModel.params) {
                return await LanguageModel.params();
            }
        } catch (error) {
            console.error('[PromptAI] Failed to get params:', error);
        }
        return null;
    }
}