// services/ai/searchAI.ts
// AI-powered semantic card search - DEBUG VERSION

interface CardForSearch {
    id: string;
    displayNumber: number;
    title: string;
    content: string;
}

/**
 * Search cards using AI semantic matching
 */
export const aiSearchCards = async (
    cards: CardForSearch[],
    query: string
): Promise<string[]> => {
    console.log('[SearchAI] Function called with:', {
        cardsCount: cards.length,
        query
    });

    try {
        // Check if Prompt API is available
        if (!('LanguageModel' in self)) {
            console.warn('[SearchAI] LanguageModel not available');
            return [];
        }

        const trimmedQuery = query.trim();
        if (!trimmedQuery || cards.length === 0) {
            console.log('[SearchAI] Empty query or no cards');
            return [];
        }

        console.log('[SearchAI] Creating session...');

        // Create lightweight session for search
        const session = await (self as any).LanguageModel.create({
            temperature: 0.2,
            topK: 5
        });

        console.log('[SearchAI] Session created');

        // Build card list
        const cardList = cards
            .map(c => `${c.displayNumber}. ${c.title}: ${c.content.substring(0, 80)}`)
            .join('\n');

        console.log('[SearchAI] Card list built:', cardList.substring(0, 200) + '...');

        // Construct search prompt
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

        console.log('[SearchAI] Sending prompt...');

        // Execute search with timeout (8 seconds)
        const searchPromise = session.prompt(prompt);
        const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('Search timeout')), 8000)
        );

        const result = await Promise.race([searchPromise, timeoutPromise]);

        console.log('[SearchAI] Raw AI result:', result);

        // Cleanup
        session.destroy();

        // Parse result
        const resultLower = result.toLowerCase().trim();
        if (resultLower === 'none' || resultLower.includes('no cards') || resultLower.includes('no match')) {
            console.log('[SearchAI] No matches found');
            return [];
        }

        // Extract numbers
        const numbers = result
            .split(',')
            .map((n: string) => parseInt(n.trim()))
            .filter((n: number) => !isNaN(n) && n >= 0);

        console.log('[SearchAI] Extracted numbers:', numbers);

        if (numbers.length === 0) {
            console.log('[SearchAI] No valid numbers in result');
            return [];
        }

        // Convert numbers to card IDs
        const matchedIds: string[] = [];
        numbers.forEach((num: number) => {
            const card = cards.find(c => c.displayNumber === num);
            if (card) {
                matchedIds.push(card.id);
                console.log(`[SearchAI] Matched: Card ${num} → ${card.title}`);
            } else {
                console.warn(`[SearchAI] Card ${num} not found`);
            }
        });

        console.log('[SearchAI] Final matched IDs:', matchedIds);
        return matchedIds;

    } catch (error) {
        console.error('[SearchAI] Search failed:', error);
        return [];
    }
};

console.log('[SearchAI] Module loaded, aiSearchCards exported');