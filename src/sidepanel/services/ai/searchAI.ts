
// Single-stage generous semantic search

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

    private async ensureSession(): Promise<PromptSession> {
        if (this.session) {
            return this.session;
        }

        if (this.isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.ensureSession();
        }

        this.isInitializing = true;

        try {
            if (!('LanguageModel' in self)) {
                throw new Error('LanguageModel not available');
            }

            const availability = await LanguageModel.availability();
            if (availability === 'no') {
                throw new Error('LanguageModel not available');
            }

            // Slightly higher temperature for more generous matching
            this.session = await LanguageModel.create({
                temperature: 0.4,
                topK: 20
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
     * Single-stage generous semantic search
     */
    async search(cards: CardForSearch[], query: string): Promise<string[]> {
        const trimmedQuery = query.trim();
        if (!trimmedQuery || cards.length === 0) {
            return [];
        }

        try {
            const session = await this.ensureSession();

            // Build card list with title + content preview (150 chars)
            const cardList = cards
                .map(c => `${c.displayNumber}. ${c.title}\n   ${c.content.substring(0, 150)}`)
                .join('\n\n');

            const prompt = `You are an intelligent semantic search engine. Find ALL cards related to: "${trimmedQuery}"

CARDS:
${cardList}

Match cards that contain or relate to the query through:
- Direct keywords (exact or partial matches)
- Synonyms
- Related concepts 
- Similar problems or use cases 
- Contextual meaning, even if wording differs

Be VERY generous - include ANY card that could be relevant.
Better to include too many than miss important cards.

Return ALL matching card numbers, most relevant first.
Format: "1, 2, 5, 8"
If truly no matches: "none"

Result:`;

            const result = await Promise.race([
                session.prompt(prompt),
                new Promise<string>((_, reject) =>
                    setTimeout(() => reject(new Error('Search timeout')), 8000)
                )
            ]);

            return this.parseSearchResult(result, cards);

        } catch (error) {
            console.error('[SearchAI] Search failed:', error);

            if (this.session) {
                this.session.destroy();
                this.session = null;
            }

            return [];
        }
    }

    private parseSearchResult(result: string, cards: CardForSearch[]): string[] {
        const resultLower = result.toLowerCase().trim();

        if (resultLower === 'none' || resultLower.includes('no cards') || resultLower.includes('no match')) {
            return [];
        }

        const numbers = result
            .split(',')
            .map((n: string) => parseInt(n.trim()))
            .filter((n: number) => !isNaN(n) && n >= 0);

        if (numbers.length === 0) {
            return [];
        }

        const matchedIds: string[] = [];
        numbers.forEach((num: number) => {
            const card = cards.find(c => c.displayNumber === num);
            if (card) {
                matchedIds.push(card.id);
            }
        });

        return matchedIds;
    }

    destroy() {
        if (this.session) {
            this.session.destroy();
            this.session = null;
        }
    }
}

// Export convenience function
export const aiSearchCards = async (
    cards: CardForSearch[],
    query: string
): Promise<string[]> => {
    const searchAI = SearchAI.getInstance();
    return searchAI.search(cards, query);
};

// Export destroy function if needed
export const destroySearchSession = () => {
    const searchAI = SearchAI.getInstance();
    searchAI.destroy();
};