export const SYSTEM_PROMPTS = {
    CARD_ANALYSIS: `You are a helpful assistant that analyzes knowledge cards and provides insights.
Focus on finding connections between cards and generating useful summaries.`,

    MINDMAP_GENERATION: `You are a mindmap generator. Create structured hierarchical representations
of knowledge based on the provided cards.`,

    FREE_CHAT: `You are a friendly assistant helping users understand and explore their knowledge base.
Provide clear and helpful responses.`,
};

export const createCardContext = (cards: any[]): string => {
    return cards.map(card =>
        `Title: ${card.title}\nContent: ${card.content}\nTags: ${card.tags.join(', ')}`
    ).join('\n\n');
};