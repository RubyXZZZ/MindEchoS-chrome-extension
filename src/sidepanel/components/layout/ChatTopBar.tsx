// components/chat/ChatTopBar.tsx
import React, { useState, useMemo } from 'react';
import { Layers, X, Search, CheckSquare, Square } from 'lucide-react';
import { KnowledgeCard } from '../../types/card.types';
import { useStore } from '../../store';
import { ALL_CARDS_FILTER } from '../../utils/constants';

interface ChatTopBarProps {
    selectedCards: KnowledgeCard[];
    allCards: KnowledgeCard[];
    selectedCardIds: string[];
    onToggleCard: (cardId: string) => void;
    onNewChat: () => void;
    isGenerating: boolean;
    isInitializing: boolean;
}

export const ChatTopBar: React.FC<ChatTopBarProps> = ({
                                                          selectedCards,
                                                          allCards,
                                                          selectedCardIds,
                                                          onToggleCard,
                                                          onNewChat,
                                                          isGenerating,
                                                          isInitializing
                                                      }) => {
    const { userCategories } = useStore();
    const [showSelector, setShowSelector] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CARDS_FILTER);

    // Temporary selection state - only applied on confirm
    const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);

    // Use the same category system as CardsView
    const categories = useMemo(() => {
        const allCategories = new Set<string>([ALL_CARDS_FILTER]);

        // Add user categories
        userCategories.forEach(cat => allCategories.add(cat));

        // Add categories from existing cards
        allCards.forEach(card => {
            if (card.id !== 'sample-card-1' && card.category) {
                allCategories.add(card.category);
            }
        });

        return Array.from(allCategories);
    }, [allCards, userCategories]);

    // Filter cards based on search and category
    const filteredCards = useMemo(() => {
        return allCards.filter(card => {
            if (card.id === 'sample-card-1') return false;

            // Category filter
            if (selectedCategory !== ALL_CARDS_FILTER && card.category !== selectedCategory) {
                return false;
            }

            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const titleMatch = card.title.toLowerCase().includes(query);
                const contentMatch = card.content.toLowerCase().includes(query);
                return titleMatch || contentMatch;
            }

            return true;
        });
    }, [allCards, searchQuery, selectedCategory]);

    // Check if all filtered cards are selected
    const allFilteredSelected = filteredCards.length > 0 &&
        filteredCards.every(card => tempSelectedIds.includes(card.id));

    const handleOpen = () => {
        // Initialize temp selection with current selection
        setTempSelectedIds([...selectedCardIds]);
        setShowSelector(true);
    };

    const handleClose = () => {
        setShowSelector(false);
        setSearchQuery('');
        setSelectedCategory(ALL_CARDS_FILTER);
        setTempSelectedIds([]);
    };

    const handleConfirm = () => {
        // Apply temp selection to actual selection
        const toAdd = tempSelectedIds.filter(id => !selectedCardIds.includes(id));
        const toRemove = selectedCardIds.filter(id => !tempSelectedIds.includes(id));

        toRemove.forEach(id => onToggleCard(id));
        toAdd.forEach(id => onToggleCard(id));

        handleClose();
    };

    const handleToggleTemp = (cardId: string) => {
        setTempSelectedIds(prev =>
            prev.includes(cardId)
                ? prev.filter(id => id !== cardId)
                : [...prev, cardId]
        );
    };

    const handleSelectAll = () => {
        if (allFilteredSelected) {
            // Deselect all filtered cards
            setTempSelectedIds(prev =>
                prev.filter(id => !filteredCards.some(card => card.id === id))
            );
        } else {
            // Select all filtered cards
            const allFilteredIds = filteredCards.map(card => card.id);
            setTempSelectedIds(prev => {
                const newSet = new Set([...prev, ...allFilteredIds]);
                return Array.from(newSet);
            });
        }
    };

    return (
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-3 py-2">
            <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-emerald-700">
                    AI Assistant
                </div>

                <button
                    onClick={handleOpen}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                        selectedCards.length > 0
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600'
                            : 'text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                    }`}
                >
                    <Layers className="w-3.5 h-3.5" />
                    {selectedCards.length > 0 ? `${selectedCards.length} Card${selectedCards.length > 1 ? 's' : ''}` : 'Select Cards'}
                </button>

                <button
                    onClick={onNewChat}
                    disabled={isGenerating || isInitializing}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                >
                    + New Chat
                </button>
            </div>

            {/* Card Selector Dropdown - Fixed positioning for sidepanel */}
            {showSelector && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={handleClose}
                    />

                    {/* Dropdown */}
                    <div className="fixed top-12 left-2 right-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-w-md mx-auto">
                        {/* Header with Search */}
                        <div className="flex items-center gap-2 p-3 border-b border-gray-200">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search cards..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={handleClose}
                                className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Category Filter */}
                        <div className="px-3 py-2 border-b border-gray-200">
                            <div className="flex flex-wrap gap-1.5">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                                            selectedCategory === category
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Card List */}
                        <div className="p-3">
                            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                {filteredCards.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-gray-500">No cards found</p>
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="mt-2 text-xs text-emerald-600 hover:text-emerald-700"
                                            >
                                                Clear search
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    filteredCards.map(card => {
                                        const isSelected = tempSelectedIds.includes(card.id);
                                        return (
                                            <label
                                                key={card.id}
                                                className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'bg-emerald-50 border border-emerald-300'
                                                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleTemp(card.id)}
                                                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <p className="text-sm font-medium text-gray-900 truncate flex-1">
                                                            {card.title}
                                                        </p>
                                                        {card.category && (
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-white rounded text-gray-600 flex-shrink-0">
                                                                {card.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 line-clamp-2">
                                                        {card.content}
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })
                                )}
                            </div>

                            {/* Results Summary with Select All */}
                            {filteredCards.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                                    <p className="text-xs text-gray-600">
                                        Showing {filteredCards.length} card{filteredCards.length > 1 ? 's' : ''}
                                        {tempSelectedIds.length > 0 && (
                                            <span className="text-emerald-600 font-medium ml-1">
                                                • {tempSelectedIds.length} selected
                                            </span>
                                        )}
                                    </p>
                                    <button
                                        onClick={handleSelectAll}
                                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                    >
                                        {allFilteredSelected ? (
                                            <>
                                                <CheckSquare className="w-3.5 h-3.5" />
                                                Deselect All
                                            </>
                                        ) : (
                                            <>
                                                <Square className="w-3.5 h-3.5" />
                                                Select All
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-gray-200 flex gap-2">
                            <button
                                onClick={handleClose}
                                className="flex-1 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 px-3 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};