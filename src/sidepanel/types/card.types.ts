

export interface KnowledgeCard {
    id: string;
    displayNumber: number;
    title: string;
    content: string;
    url: string;
    timestamp: number;
    tags: string[];
    // Category is now a flexible string. The store will manage the available categories.
    category?: string;
    relatedCards?: string[];
    color?: string;
    source?: 'webpage' | 'selection' | 'manual';
    favicon?: string;
}



// For AI Search functionality
export interface CardForSearch {
    id: string;
    displayNumber: number;
    title: string;
    content: string;
}