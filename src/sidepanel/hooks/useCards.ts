// import { useState, useCallback, useEffect } from 'react';
// import { KnowledgeCard } from '../types/card.types';
// import { useStore } from '../store';
// import { ChromeStorageService } from '../services/storage/chromeStorage';
//
// /**
//  * Hook for managing knowledge cards
//  * Handles CRUD operations, filtering, and persistence
//  */
// export function useCards() {
//     const {
//         cards,
//         setCards,
//         addCard,
//         updateCard,
//         deleteCard,
//         searchQuery,
//         setSearchQuery,
//         selectedCategory,
//         setSelectedCategory
//     } = useStore();
//
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//
//     // Load cards from storage on mount
//     useEffect(() => {
//         loadCards();
//     }, []);
//
//     // Save cards to storage when they change
//     useEffect(() => {
//         if (cards.length > 0) {
//             saveCards();
//         }
//     }, [cards]);
//
//     const loadCards = async () => {
//         setIsLoading(true);
//         setError(null);
//         try {
//             const loadedCards = await ChromeStorageService.loadCards();
//             if (loadedCards) {
//                 setCards(loadedCards);
//             }
//         } catch (err) {
//             setError('Failed to load cards');
//             console.error('Load cards error:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//     const saveCards = async () => {
//         try {
//             await ChromeStorageService.saveCards(cards);
//         } catch (err) {
//             console.error('Save cards error:', err);
//         }
//     };
//
//     // Filter cards based on search and category
//     const filteredCards = useCallback(() => {
//         return cards.filter(card => {
//             const matchesSearch = !searchQuery ||
//                 card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                 card.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                 card.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                 card.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
//
//             const matchesCategory = selectedCategory === 'All' ||
//                 card.category === selectedCategory;
//
//             return matchesSearch && matchesCategory;
//         });
//     }, [cards, searchQuery, selectedCategory]);
//
//     // Get unique categories
//     const getCategories = useCallback(() => {
//         const categories = new Set(cards.map(card => card.category));
//         return ['All', ...Array.from(categories)];
//     }, [cards]);
//
//     // Get cards by category
//     const getCardsByCategory = useCallback((category: string) => {
//         if (category === 'All') return cards;
//         return cards.filter(card => card.category === category);
//     }, [cards]);
//
//     // Get related cards by tags
//     const getRelatedCards = useCallback((cardId: string, limit = 5) => {
//         const targetCard = cards.find(c => c.id === cardId);
//         if (!targetCard || !targetCard.tags || targetCard.tags.length === 0) {
//             return [];
//         }
//
//         return cards
//             .filter(card =>
//                 card.id !== cardId &&
//                 card.tags?.some(tag => targetCard.tags?.includes(tag))
//             )
//             .slice(0, limit);
//     }, [cards]);
//
//     // Bulk operations
//     const deleteMultipleCards = useCallback((cardIds: string[]) => {
//         cardIds.forEach(id => deleteCard(id));
//     }, [deleteCard]);
//
//     const updateMultipleCards = useCallback((cardIds: string[], updates: Partial<KnowledgeCard>) => {
//         cardIds.forEach(id => updateCard(id, updates));
//     }, [updateCard]);
//
//     return {
//         // State
//         cards,
//         filteredCards: filteredCards(),
//         isLoading,
//         error,
//         searchQuery,
//         selectedCategory,
//
//         // Actions
//         addCard,
//         updateCard,
//         deleteCard,
//         deleteMultipleCards,
//         updateMultipleCards,
//         setSearchQuery,
//         setSelectedCategory,
//
//         // Utilities
//         getCategories,
//         getCardsByCategory,
//         getRelatedCards,
//         loadCards,
//         saveCards
//     };
// }
