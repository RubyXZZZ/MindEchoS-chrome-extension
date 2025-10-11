

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

// This specific type is removed as categories are now dynamic strings managed by the store.
// The available categories are sourced from constants and user-added data.

// For AI Search functionality
export interface CardForSearch {
    id: string;
    displayNumber: number;
    title: string;
    content: string;
}