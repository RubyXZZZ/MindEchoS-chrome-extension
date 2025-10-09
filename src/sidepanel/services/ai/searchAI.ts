// services/ai/searchAI.ts
// AI-powered semantic card search - OPTIMIZED VERSION

import type { CardForSearch } from '../../types/ai.types';
import type { PromptSession } from '../../types/ai.types';

class SearchAI {
    private static instance: SearchAI | null = null;
    private session: PromptSession | null = null;
    private isInitializing: boolean = false;

    private constructor() {}

    static getInstance(): SearchAI {
        if (!SearchAI.instance) {
            SearchAI.instance = new SearchAI();
        }
        return SearchAI.instance;
    }

    /**
     * 确保 session 已创建（复用）
     */
    private async ensureSession(): Promise<PromptSession> {
        // 如果已有 session，直接返回
        if (this.session) {
            return this.session;
        }

        // 防止并发初始化
        if (this.isInitializing) {
            // 等待初始化完成
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.ensureSession();
        }

        this.isInitializing = true;

        try {
            // 检查 API 可用性
            if (!('LanguageModel' in self)) {
                throw new Error('LanguageModel not available');
            }

            const availability = await LanguageModel.availability();
            if (availability === 'no') {
                throw new Error('LanguageModel not available');
            }

            // 创建轻量级 session（专用于搜索）
            this.session = await LanguageModel.create({
                temperature: 0.2,
                topK: 5
            });

            return this.session;
        } catch (error) {
            console.error('[SearchAI] Failed to create session:', error);
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * 搜索卡片（复用 session）
     */
    async search(cards: CardForSearch[], query: string): Promise<string[]> {
        const trimmedQuery = query.trim();
        if (!trimmedQuery || cards.length === 0) {
            return [];
        }

        try {
            // 确保 session 存在（复用）
            const session = await this.ensureSession();

            // 构建卡片列表
            const cardList = cards
                .map(c => `${c.displayNumber}. ${c.title}: ${c.content.substring(0, 80)}`)
                .join('\n');

            // 构建搜索提示
            const prompt = `You are a semantic search assistant. Find the most relevant knowledge cards for the user's query.

CARDS:
${cardList}

USER QUERY: "${trimmedQuery}"

MATCHING CRITERIA:
- Match direct keywords
- Match synonyms or related terms
- Match conceptually similar topics
- Match use cases or problems solved
- Match across languages if applicable

Be thorough in finding semantic matches, but rank by true relevance.

OUTPUT:
- Return ONLY the card numbers, comma-separated, most relevant first
- Format: "2, 5, 8" (numbers only, no extra text)
- If no matches: "none"

RESULT:`;

            // 执行搜索（带超时）
            const searchPromise = session.prompt(prompt);
            const timeoutPromise = new Promise<string>((_, reject) =>
                setTimeout(() => reject(new Error('Search timeout')), 8000)
            );

            const result = await Promise.race([searchPromise, timeoutPromise]);

            // 解析结果
            return this.parseSearchResult(result, cards);

        } catch (error) {
            console.error('[SearchAI] Search failed:', error);

            // 如果出错，销毁 session 以便下次重建
            if (this.session) {
                this.session.destroy();
                this.session = null;
            }

            return [];
        }
    }

    /**
     * 解析搜索结果
     */
    private parseSearchResult(result: string, cards: CardForSearch[]): string[] {
        const resultLower = result.toLowerCase().trim();

        if (resultLower === 'none' || resultLower.includes('no cards') || resultLower.includes('no match')) {
            return [];
        }

        // 提取数字
        const numbers = result
            .split(',')
            .map((n: string) => parseInt(n.trim()))
            .filter((n: number) => !isNaN(n) && n >= 0);

        if (numbers.length === 0) {
            return [];
        }

        // 转换为卡片 ID
        const matchedIds: string[] = [];
        numbers.forEach((num: number) => {
            const card = cards.find(c => c.displayNumber === num);
            if (card) {
                matchedIds.push(card.id);
            }
        });

        return matchedIds;
    }

    /**
     * 手动销毁 session（通常不需要调用）
     */
    destroy() {
        if (this.session) {
            this.session.destroy();
            this.session = null;
        }
    }
}

// 导出便捷函数
export const aiSearchCards = async (
    cards: CardForSearch[],
    query: string
): Promise<string[]> => {
    const searchAI = SearchAI.getInstance();
    return searchAI.search(cards, query);
};

// 导出销毁函数（如果需要）
export const destroySearchSession = () => {
    const searchAI = SearchAI.getInstance();
    searchAI.destroy();
};