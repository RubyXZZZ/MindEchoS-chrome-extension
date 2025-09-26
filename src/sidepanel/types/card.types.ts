// src/types/card.types.ts
export interface KnowledgeCard {
    id: string;
    title: string;
    summary: string;
    content: string;
    url: string;
    timestamp: number;
    tags: string[];
    category?: string;
    relatedCards?: string[];
    color?: string;
    source?: 'webpage' | 'selection' | 'video' | 'manual';
    favicon?: string;
}

export type CardCategory = 'All' | 'Technology' | 'Design' | 'Business' | 'Other';




