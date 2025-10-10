// src/views/CardsView.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, X, Check, CheckSquare, Square } from 'lucide-react';
import { useStore } from '../store';
import { CardItem } from '../components/cards/CardItem';
import { ALL_CARDS_FILTER, DEFAULT_CATEGORY, PROTECTED_CATEGORIES, STORAGE_KEYS, SAMPLE_CARD_ID } from '../utils/constants';
import { AIRobotIcon } from '../components/layout/AIRobotIcon';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { aiSearchCards } from '../services/ai/searchAI';

interface CardsViewProps {
    manageModeState?: {
        isManageMode: boolean;
        selectedCards: string[];
    };
    onCardSelect?: (cardId: string) => void;
}

const CARD_OFFSET = 50;
const EXPANDED_CARD_HEIGHT = 400;
const COLLAPSED_CARD_HEIGHT = 180;

export const CardsView: React.FC<CardsViewProps> = ({
                                                        manageModeState,
                                                        onCardSelect
                                                    }) => {
    const {
        cards,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        expandedCard,
        setExpandedCard,
        userCategories,
        addCategory,
        triggerDeleteCategory,
        setShowAddModal,
        selectedCardsForChat,
        setSelectedCardsForChat,
        setCurrentView,
        messages,
        clearMessages,
        showDeleteCategoryModal,
        categoryToDelete,
        cancelDeleteCategory,
        deleteCategoryAndCards,
        moveCardsToOtherAndDeleteCategory
    } = useStore();

    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryValue, setNewCategoryValue] = useState('');

    // AI selection mode (for selecting cards to chat)
    const [aiSelectionMode, setAiSelectionMode] = useState(false);
    const [aiSelectedCards, setAiSelectedCards] = useState<string[]>([]);
    const [showNewChatDialog, setShowNewChatDialog] = useState(false);

    // AI search mode
    const [aiSearchMode, setAiSearchMode] = useState(false);
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [aiMatchedCardIds, setAiMatchedCardIds] = useState<string[]>([]);

    const filteredCards = useMemo(() => {
        return cards.filter(card => {
            // Exclude sample card in AI selection mode
            if (aiSelectionMode && card.id === SAMPLE_CARD_ID) {
                return false;
            }

            const cardCategory = card.category || DEFAULT_CATEGORY;

            // AI Search Mode: filter by AI-matched results
            if (aiSearchMode && aiMatchedCardIds.length > 0) {
                const matchesAI = aiMatchedCardIds.includes(card.id);
                const matchesCategory = selectedCategory === ALL_CARDS_FILTER || cardCategory === selectedCategory;
                return matchesAI && matchesCategory;
            }

            // Normal Search Mode: keyword matching
            const matchesSearch = !searchQuery ||
                card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                card.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cardCategory.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = selectedCategory === ALL_CARDS_FILTER || cardCategory === selectedCategory;

            return matchesSearch && matchesCategory;
        }).sort((a, b) => {
            // AI search: sort by relevance order
            if (aiSearchMode && aiMatchedCardIds.length > 0) {
                const indexA = aiMatchedCardIds.indexOf(a.id);
                const indexB = aiMatchedCardIds.indexOf(b.id);
                if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                }
            }
            // Default: sort by timestamp
            return a.timestamp - b.timestamp;
        });
    }, [cards, searchQuery, selectedCategory, aiSelectionMode, aiSearchMode, aiMatchedCardIds]);

    const categoryCounts = useMemo(() => {
        const counts: { [key: string]: number } = { [ALL_CARDS_FILTER]: cards.length };
        cards.forEach(card => {
            const category = card.category || DEFAULT_CATEGORY;
            counts[category] = (counts[category] || 0) + 1;
        });
        return counts;
    }, [cards]);

    const handleCardSelect = useCallback((cardId: string) => {
        if (aiSelectionMode) {
            setAiSelectedCards(prev =>
                prev.includes(cardId)
                    ? prev.filter(id => id !== cardId)
                    : [...prev, cardId]
            );
        } else {
            onCardSelect?.(cardId);
        }
    }, [aiSelectionMode, onCardSelect]);

    const handleExpandCard = useCallback((cardId: string) => {
        setExpandedCard(expandedCard === cardId ? null : cardId);
    }, [expandedCard, setExpandedCard]);

    const handleAddNewCategory = () => {
        const trimmedValue = newCategoryValue.trim();
        if (trimmedValue) {
            addCategory(trimmedValue);
            setNewCategoryValue('');
            setShowNewCategoryInput(false);
        }
    };

    const handleCancelNewCategory = () => {
        setShowNewCategoryInput(false);
        setNewCategoryValue('');
    };

    // AI Robot mode handlers
    const handleAiRobotClick = () => {
        setAiSelectionMode(true);
        setAiSelectedCards([]);
    };

    const handleAiSelectionCancel = () => {
        setAiSelectionMode(false);
        setAiSelectedCards([]);
    };

    const handleAiSelectAll = () => {
        const allValidCardIds = filteredCards
            .filter(card => card.id !== SAMPLE_CARD_ID)
            .map(card => card.id);
        setAiSelectedCards(allValidCardIds);
    };

    const handleAiDeselectAll = () => {
        setAiSelectedCards([]);
    };

    // Manage mode handlers
    const handleManageSelectAll = () => {
        const allValidCardIds = filteredCards
            .filter(card => card.id !== SAMPLE_CARD_ID)
            .map(card => card.id);

        allValidCardIds.forEach(id => {
            if (!manageModeState?.selectedCards.includes(id)) {
                onCardSelect?.(id);
            }
        });
    };

    const handleManageDeselectAll = () => {
        manageModeState?.selectedCards.forEach(id => {
            onCardSelect?.(id);
        });
    };

    const allCardsSelected = useMemo(() => {
        if (!manageModeState?.isManageMode) return false;
        const selectableCards = filteredCards.filter(card => card.id !== SAMPLE_CARD_ID);
        return selectableCards.length > 0 &&
            selectableCards.every(card => manageModeState.selectedCards.includes(card.id));
    }, [manageModeState, filteredCards]);

    // AI Search handlers
    const handleToggleAiSearch = () => {
        if (aiSearchMode) {
            setAiSearchMode(false);
            setAiMatchedCardIds([]);
        } else {
            setAiSearchMode(true);
            setAiMatchedCardIds([]);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setAiMatchedCardIds([]);
    };

    const handleAiSearch = async () => {
        const trimmedQuery = searchQuery.trim();

        if (!trimmedQuery) {
            setAiMatchedCardIds([]);
            return;
        }

        setIsAiSearching(true);
        try {
            const searchableCards = cards
                .filter(c => c.id !== SAMPLE_CARD_ID)
                .map(c => ({
                    id: c.id,
                    displayNumber: c.displayNumber,
                    title: c.title,
                    content: c.content
                }));

            const matchedIds = await aiSearchCards(searchableCards, trimmedQuery);
            setAiMatchedCardIds(matchedIds);
        } catch (error) {
            console.error('[CardsView] AI search failed:', error);
            setAiMatchedCardIds([]);
        } finally {
            setIsAiSearching(false);
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && aiSearchMode && searchQuery.trim()) {
            handleAiSearch();
        }
    };

    const handleAiSelectionConfirm = async () => {
        const validSelectedCards = aiSelectedCards.filter(id => id !== SAMPLE_CARD_ID);

        if (validSelectedCards.length === 0) {
            alert('Please select at least one card');
            return;
        }

        const result = await chrome.storage.local.get(STORAGE_KEYS.CURRENT_CHAT);
        const savedMessages = result[STORAGE_KEYS.CURRENT_CHAT]?.messages || [];
        const currentMessages = messages.length > 0 ? messages : savedMessages;

        const hasRealConversation = currentMessages.length > 0;

        if (hasRealConversation) {
            setAiSelectedCards(validSelectedCards);
            setShowNewChatDialog(true);
        } else {
            setSelectedCardsForChat(validSelectedCards);
            setAiSelectionMode(false);
            setAiSelectedCards([]);
            setTimeout(() => {
                setCurrentView('chat');
            }, 0);
        }
    };

    const handleContinueChat = async () => {
        const combinedCards = [...new Set([...selectedCardsForChat, ...aiSelectedCards])];

        setSelectedCardsForChat(combinedCards);

        await chrome.storage.local.set({
            [STORAGE_KEYS.CURRENT_CHAT]: {
                messages,
                selectedCards: combinedCards,
                lastUpdated: Date.now()
            }
        });

        setShowNewChatDialog(false);
        setAiSelectionMode(false);
        setAiSelectedCards([]);

        setCurrentView('chat');
    };

    const handleStartNewChat = async () => {
        clearMessages();
        setSelectedCardsForChat(aiSelectedCards);
        await chrome.storage.local.remove(STORAGE_KEYS.CURRENT_CHAT);
        setCurrentView('chat');
        setShowNewChatDialog(false);
        setAiSelectionMode(false);
        setAiSelectedCards([]);
    };

    // Calculate card positions for overlapping layout
    const { cardPositions, containerHeight } = useMemo(() => {
        if (filteredCards.length === 0) {
            return { cardPositions: {}, containerHeight: 400 };
        }
        const positions: { [key: string]: number } = {};
        const expandedIndex = expandedCard ? filteredCards.findIndex(c => c.id === expandedCard) : -1;
        filteredCards.forEach((card, index) => {
            let top = index * CARD_OFFSET;
            if (expandedIndex !== -1 && index > expandedIndex) {
                top += EXPANDED_CARD_HEIGHT - CARD_OFFSET;
            }
            positions[card.id] = top;
        });
        const lastCard = filteredCards[filteredCards.length - 1];
        const lastCardTop = positions[lastCard.id] || 0;
        const lastCardHeight = lastCard.id === expandedCard ? EXPANDED_CARD_HEIGHT : COLLAPSED_CARD_HEIGHT;
        const height = lastCardTop + lastCardHeight + 40;
        return { cardPositions: positions, containerHeight: Math.max(height, 400) };
    }, [filteredCards, expandedCard]);

    const filterOptions = useMemo(() =>
            [...new Set([ALL_CARDS_FILTER, ...userCategories, DEFAULT_CATEGORY])],
        [userCategories]);

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Search & Filter Bar */}
            <div className="flex-shrink-0 px-4 py-2 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-10">
                {/* Search Input */}
                <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={aiSearchMode ? "AI Search (Press Enter to search)..." : "Search cards..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        disabled={isAiSearching}
                        className={`w-full pl-9 pr-24 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                            aiSearchMode
                                ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300 focus:ring-purple-500/30'
                                : 'bg-gray-50 border-gray-200 focus:ring-emerald-500/30'
                        } disabled:opacity-60`}
                    />

                    {/* Right side controls */}
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
                        {/* Clear button - shows when search query exists */}
                        {searchQuery && (
                            <button
                                onClick={handleClearSearch}
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                title="Clear search"
                            >
                                <X className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                        )}

                        {/* Match count (AI mode with results) */}
                        {aiSearchMode && aiMatchedCardIds.length > 0 && !isAiSearching && (
                            <div className="text-[10px] text-purple-600 font-medium bg-purple-100 px-1.5 py-0.5 rounded">
                                {aiMatchedCardIds.length}
                            </div>
                        )}

                        {/* AI Toggle Switch */}
                        <button
                            onClick={handleToggleAiSearch}
                            disabled={isAiSearching}
                            className={`relative inline-flex items-center h-5 w-11 rounded-full transition-colors ${
                                aiSearchMode
                                    ? 'bg-purple-500'
                                    : 'bg-gray-400'
                            } disabled:opacity-50`}
                            title={aiSearchMode ? 'Disable AI search' : 'Enable AI search'}
                        >
                            <span
                                className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                    aiSearchMode ? 'translate-x-[26px]' : 'translate-x-0.5'
                                }`}
                            />
                            <span className={`absolute text-[9px] font-bold text-white transition-opacity ${
                                aiSearchMode ? 'left-2' : 'right-2'
                            }`}>
                                {isAiSearching ? (
                                    <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'AI'
                                )}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Category Filter Tags */}
                <div className="flex gap-1.5 flex-wrap items-center">
                    {filterOptions.map(filter => (
                        <div key={filter} className="relative group">
                            <button
                                onClick={() => setSelectedCategory(filter)}
                                className={`px-3 py-1 text-xs rounded-full transition-all flex items-center ${
                                    selectedCategory === filter
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {filter}
                                <span className="ml-1.5 text-inherit/70">
                                    ({categoryCounts[filter] || 0})
                                </span>
                            </button>
                            {/* Delete category button (Manage mode only) */}
                            {manageModeState?.isManageMode && !PROTECTED_CATEGORIES.includes(filter) && filter !== ALL_CARDS_FILTER && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        triggerDeleteCategory(filter);
                                    }}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                    title={`Delete category "${filter}"`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                    {/* Add new category input (Normal mode only) */}
                    {!manageModeState?.isManageMode && (
                        showNewCategoryInput ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={newCategoryValue}
                                    onChange={(e) => setNewCategoryValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && newCategoryValue.trim() && handleAddNewCategory()}
                                    className="w-24 px-2 py-1 bg-white border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    placeholder="New category"
                                    autoFocus
                                />
                                <button
                                    onClick={handleAddNewCategory}
                                    disabled={!newCategoryValue.trim()}
                                    className={`p-1 rounded-full transition-colors ${
                                        newCategoryValue.trim()
                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                    title="Confirm"
                                >
                                    <Check className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={handleCancelNewCategory}
                                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    title="Cancel"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowNewCategoryInput(true)}
                                className="flex items-center justify-center w-6 h-6 bg-gray-200 text-gray-500 rounded-full hover:bg-gray-300"
                                title="Add new category"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-transparent to-white/30 relative">
                {filteredCards.length > 0 ? (
                    <div className="relative px-2 pt-1 pb-4" style={{ minHeight: `${containerHeight}px` }}>
                        {filteredCards.map((card, index) => {
                            const isExpanded = expandedCard === card.id;
                            const topPosition = cardPositions[card.id] ?? 0;
                            const isAiSelected = aiSelectionMode && aiSelectedCards.includes(card.id);

                            return (
                                <div
                                    key={card.id}
                                    className="absolute left-2.5 top-1 right-1.5 transition-transform duration-300 ease-in-out will-change-transform"
                                    style={{ transform: `translateY(${topPosition}px)`, zIndex: isExpanded ? 50 : index + 1 }}
                                >
                                    <CardItem
                                        card={card}
                                        isManageMode={aiSelectionMode || manageModeState?.isManageMode || false}
                                        isSelected={isAiSelected || manageModeState?.selectedCards.includes(card.id) || false}
                                        onSelect={handleCardSelect}
                                        isExpanded={isExpanded}
                                        onExpand={() => handleExpandCard(card.id)}
                                        isOverlapping={true}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-4">
                        <div className="bg-gray-100 rounded-full p-4 mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">{searchQuery || selectedCategory !== ALL_CARDS_FILTER ? 'No matching cards found' : 'No knowledge cards yet'}</p>
                        <p className="text-gray-400 text-xs">{searchQuery || selectedCategory !== ALL_CARDS_FILTER ? 'Try other keywords or categories' : 'Click the button below to create your first card'}</p>
                    </div>
                )}

                {/* AI Robot Button (Left Bottom) */}
                {!aiSelectionMode && !manageModeState?.isManageMode && (
                    <button
                        onClick={handleAiRobotClick}
                        className="fixed bottom-2 left-2 hover:scale-105 active:scale-95 transition-transform z-20 group"
                        title="Select cards for AI chat"
                    >
                        <AIRobotIcon size={48} />
                        <span className="absolute bottom-2 left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Select cards for AI chat
                        </span>
                    </button>
                )}

                {/* AI Selection Mode Buttons */}
                {aiSelectionMode && (
                    <div className="fixed bottom-2 left-2 right-2 flex gap-2 z-20">
                        <div className="flex gap-2">
                            <button
                                onClick={handleAiSelectionCancel}
                                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={aiSelectedCards.length === filteredCards.filter(c => c.id !== SAMPLE_CARD_ID).length ? handleAiDeselectAll : handleAiSelectAll}
                                className="px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors font-medium border border-blue-300"
                            >
                                {aiSelectedCards.length === filteredCards.filter(c => c.id !== SAMPLE_CARD_ID).length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <button
                            onClick={handleAiSelectionConfirm}
                            disabled={aiSelectedCards.length === 0}
                            className="ml-auto px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <AIRobotIcon size={20} />
                            Confirm ({aiSelectedCards.length})
                        </button>
                    </div>
                )}

                {/* Right Bottom: Add Card or Select All (Manage) */}
                {!aiSelectionMode && (
                    manageModeState?.isManageMode ? (
                        <button
                            onClick={allCardsSelected ? handleManageDeselectAll : handleManageSelectAll}
                            className="fixed bottom-2 right-2 px-3 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 hover:scale-105 transition-all flex items-center gap-1.5 z-20 font-medium text-sm"
                            title={allCardsSelected ? 'Deselect all cards' : 'Select all cards'}
                        >
                            {allCardsSelected ? (
                                <>
                                    <Square className="w-4 h-4" />
                                    Deselect
                                </>
                            ) : (
                                <>
                                    <CheckSquare className="w-4 h-4" />
                                    Select All
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="fixed bottom-2 right-2 w-10 h-10 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 hover:scale-105 transition-all flex items-center justify-center z-20"
                            title="Add new card"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    )
                )}

                {/* Selected Cards Count (Manage mode) */}
                {manageModeState?.isManageMode && manageModeState.selectedCards.length > 0 && (
                    <div className="fixed bottom-2 left-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-20">
                        Selected {manageModeState.selectedCards.length} card{manageModeState.selectedCards.length > 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* New Chat Dialog */}
            {showNewChatDialog && createPortal(
                <ConfirmDialog
                    isOpen={showNewChatDialog}
                    title={`Add ${aiSelectedCards.length} Card${aiSelectedCards.length > 1 ? 's' : ''} to Chat?`}
                    message={
                        <div className="space-y-2">
                            <p className="text-sm text-gray-700">
                                You have an ongoing conversation with {messages.length} message{messages.length > 1 ? 's' : ''}.
                            </p>
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                                💡 <strong>Tip:</strong> To save the current conversation, use the Archive button in Chat view first.
                            </div>
                        </div>
                    }
                    confirmText="Continue & Add Cards"
                    cancelText="Start New (Discard Current)"
                    onConfirm={handleContinueChat}
                    onCancel={handleStartNewChat}
                    confirmButtonStyle="primary"
                />,
                document.body
            )}

            {/* Delete Category Dialog */}
            {showDeleteCategoryModal && createPortal(
                <ConfirmDialog
                    isOpen={showDeleteCategoryModal}
                    title="Delete Category"
                    message={
                        <div className="space-y-2">
                            <p className="text-sm text-gray-700">
                                Delete category "<strong>{categoryToDelete}</strong>"?
                            </p>
                            <p className="text-xs text-gray-500">
                                Choose how to handle cards in this category:
                            </p>
                        </div>
                    }
                    confirmText="Delete Tag & All Cards"
                    cancelText="Cancel"
                    onConfirm={deleteCategoryAndCards}
                    onCancel={cancelDeleteCategory}
                    confirmButtonStyle="danger"
                    additionalActions={[
                        {
                            text: "Delete Tag Only (Move to 'Other')",
                            onClick: moveCardsToOtherAndDeleteCategory,
                            className: "bg-emerald-500 text-white hover:bg-emerald-600"
                        }
                    ]}
                />,
                document.body
            )}
        </div>
    );
};