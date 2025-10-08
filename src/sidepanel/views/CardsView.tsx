// src/views/CardsView.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, X, Check } from 'lucide-react';
import { useStore } from '../store';
import { CardItem } from '../components/cards/CardItem';
import { ALL_CARDS_FILTER, DEFAULT_CATEGORY, PROTECTED_CATEGORIES, STORAGE_KEYS } from '../utils/constants';
import { AIRobotIcon } from '../components/layout/AIRobotIcon';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';

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
        archiveCurrentChat,
        saveCurrentChat
    } = useStore();

    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryValue, setNewCategoryValue] = useState('');

    // AI selection mode
    const [aiSelectionMode, setAiSelectionMode] = useState(false);
    const [aiSelectedCards, setAiSelectedCards] = useState<string[]>([]);
    const [showNewChatDialog, setShowNewChatDialog] = useState(false);

    const filteredCards = useMemo(() => {
        return cards.filter(card => {
            const cardCategory = card.category || DEFAULT_CATEGORY;

            const matchesSearch = !searchQuery ||
                card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                card.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cardCategory.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = selectedCategory === ALL_CARDS_FILTER || cardCategory === selectedCategory;

            return matchesSearch && matchesCategory;
        }).sort((a, b) => a.timestamp - b.timestamp);
    }, [cards, searchQuery, selectedCategory]);

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

    // AI Robot Button Handlers
    const handleAiRobotClick = () => {
        setAiSelectionMode(true);
        setAiSelectedCards([]);
    };

    const handleAiSelectionCancel = () => {
        setAiSelectionMode(false);
        setAiSelectedCards([]);
    };

    const handleAiSelectionConfirm = async () => {
        if (aiSelectedCards.length === 0) {
            alert('Please select at least one card');
            return;
        }

        // Check if there's an existing conversation in storage
        const result = await chrome.storage.local.get(STORAGE_KEYS.CURRENT_CHAT);
        const hasExistingConversation = result[STORAGE_KEYS.CURRENT_CHAT]?.messages?.length > 0 || messages.length > 0;

        if (hasExistingConversation) {
            // Show dialog to choose action
            setShowNewChatDialog(true);
        } else {
            // Direct to chat with selected cards
            setSelectedCardsForChat(aiSelectedCards);
            setAiSelectionMode(false);
            setAiSelectedCards([]);
            // Use setTimeout to ensure state is updated before navigation
            setTimeout(() => {
                setCurrentView('chat');
            }, 0);
        }
    };

    const handleContinueChat = async () => {
        // Add new cards to existing selected cards (remove duplicates)
        const combinedCards = [...new Set([...selectedCardsForChat, ...aiSelectedCards])];

        // Update state
        setSelectedCardsForChat(combinedCards);

        // Save to storage using store's method
        await saveCurrentChat();

        setShowNewChatDialog(false);
        setAiSelectionMode(false);
        setAiSelectedCards([]);

        // Navigate after ensuring state is persisted
        setCurrentView('chat');
    };

    const handleDeleteAndNewChat = async () => {
        clearMessages();
        setSelectedCardsForChat(aiSelectedCards);
        await chrome.storage.local.remove(STORAGE_KEYS.CURRENT_CHAT);
        setCurrentView('chat');
        setShowNewChatDialog(false);
        setAiSelectionMode(false);
        setAiSelectedCards([]);
    };

    const handleArchiveAndNewChat = async () => {
        await archiveCurrentChat();
        setSelectedCardsForChat(aiSelectedCards);
        setCurrentView('chat');
        setShowNewChatDialog(false);
        setAiSelectionMode(false);
        setAiSelectedCards([]);
    };

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
            <div className="flex-shrink-0 px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-10">
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search cards..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                </div>
                <div className="flex gap-2 flex-wrap items-center">
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

            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-transparent to-white/30 relative">
                {filteredCards.length > 0 ? (
                    <div className="relative px-2 py-4" style={{ minHeight: `${containerHeight}px` }}>
                        {filteredCards.map((card, index) => {
                            const isExpanded = expandedCard === card.id;
                            const topPosition = cardPositions[card.id] ?? 0;
                            const isAiSelected = aiSelectionMode && aiSelectedCards.includes(card.id);

                            return (
                                <div
                                    key={card.id}
                                    className="absolute left-2 right-2 transition-transform duration-300 ease-in-out will-change-transform"
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
                        className="fixed bottom-4 left-4 hover:scale-105 active:scale-95 transition-transform z-20 group"
                        title="Select cards for AI chat"
                    >
                        <AIRobotIcon size={48} />
                        <span className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Select cards for AI chat
                        </span>
                    </button>
                )}

                {/* AI Selection Mode: Confirm/Cancel Buttons */}
                {aiSelectionMode && (
                    <div className="fixed bottom-4 left-4 flex gap-2 z-20">
                        <button
                            onClick={handleAiSelectionCancel}
                            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAiSelectionConfirm}
                            disabled={aiSelectedCards.length === 0}
                            className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <AIRobotIcon size={20} />
                            Confirm ({aiSelectedCards.length})
                        </button>
                    </div>
                )}

                {/* Add New Card Button (Right Bottom) */}
                {!aiSelectionMode && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="fixed bottom-4 right-4 w-12 h-12 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center z-20"
                        title="Add new card"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* New Chat Dialog */}
            {showNewChatDialog && createPortal(
                <ConfirmDialog
                    isOpen={showNewChatDialog}
                    title="Start New Chat with Selected Cards?"
                    message="You have an existing conversation. What would you like to do?"
                    confirmText="Delete & Start New"
                    cancelText="Continue Current Chat"
                    onConfirm={handleDeleteAndNewChat}
                    onCancel={handleContinueChat}
                    cancelButtonStyle="primary"
                    additionalActions={[
                        {
                            text: 'Archive & Start New',
                            onClick: handleArchiveAndNewChat,
                            className: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }
                    ]}
                />,
                document.body
            )}
        </div>
    );
};