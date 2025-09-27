
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { useStore } from '../store';
import { CardItem } from '../components/cards/CardItem';
import { AddCardModal } from '../components/modals/AddCardModal';

interface CardsViewProps {
    manageModeState?: {
        isManageMode: boolean;
        selectedCards: string[];
    };
    onCardSelect?: (cardId: string) => void;
}

// Constants for layout
const CARD_OFFSET = 50; // Visible height of a collapsed card, creating an overlap effect
const EXPANDED_CARD_HEIGHT = 400; // Height of an expanded card
const COLLAPSED_CARD_HEIGHT = 180; // Full height of a collapsed card
const defaultCategories = ['All', 'Technology', 'Design', 'Business', 'Other'];

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
        setShowAddModal,
        expandedCard,
        setExpandedCard,
        setInitialContent
    } = useStore();

    const handlePendingSelection = useCallback(async () => {
        const data = await chrome.storage.session.get('pendingSelection');
        if (data.pendingSelection) {
            setInitialContent(data.pendingSelection);
            setShowAddModal(true);
            await chrome.storage.session.remove('pendingSelection');
        }
    }, [setInitialContent, setShowAddModal]);

    // Effect to handle new selections when the panel is already open.
    useEffect(() => {
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'session' && changes.pendingSelection?.newValue) {
                handlePendingSelection();
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);

        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    }, [handlePendingSelection]);

    // Effect to handle selections when the panel is first opened.
    useEffect(() => {
        handlePendingSelection();
    }, [handlePendingSelection]);


    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [customCategories] = useState<string[]>(['Personal', 'Work']);

    const allCategories = useMemo(() => [...defaultCategories, ...customCategories], [customCategories]);

    const activeSearchQuery = searchQuery || localSearchQuery;

    const filteredCards = useMemo(() => {
        const filtered = cards.filter(card => {
            const matchesSearch = !activeSearchQuery ||
                card.title.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
                card.content.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
                card.summary?.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
                (card.category?.toLowerCase() || '').includes(activeSearchQuery.toLowerCase());

            const matchesCategory = selectedCategory === 'All' || card.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        return filtered.sort((a, b) => a.timestamp - b.timestamp);
    }, [cards, activeSearchQuery, selectedCategory]);

    const categoryCounts = useMemo(() => {
        const counts: { [key: string]: number } = {};
        cards.forEach(card => {
            if (card.category) {
                counts[card.category] = (counts[card.category] || 0) + 1;
            }
        });
        return counts;
    }, [cards]);

    const handleCardSelect = useCallback((cardId: string) => {
        onCardSelect?.(cardId);
    }, [onCardSelect]);

    const handleExpandCard = useCallback((cardId: string) => {
        const newExpandedCard = expandedCard === cardId ? null : cardId;
        setExpandedCard(newExpandedCard);
    }, [expandedCard, setExpandedCard]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery?.(value);
        if (!setSearchQuery) {
            setLocalSearchQuery(value);
        }
    }, [setSearchQuery]);

    const { cardPositions, containerHeight } = useMemo(() => {
        const positions: { [key: string]: number } = {};
        const expandedIndex = expandedCard ? filteredCards.findIndex(c => c.id === expandedCard) : -1;

        filteredCards.forEach((card, index) => {
            let top = index * CARD_OFFSET;

            if (expandedIndex !== -1 && index > expandedIndex) {
                const expansionShift = EXPANDED_CARD_HEIGHT - CARD_OFFSET;
                top += expansionShift;
            }
            positions[card.id] = top;
        });

        let height = 400; // Minimum height
        if (filteredCards.length > 0) {
            const lastCardId = filteredCards[filteredCards.length - 1].id;
            const lastCardTop = positions[lastCardId] || 0;
            const lastCardHeight = lastCardId === expandedCard ? EXPANDED_CARD_HEIGHT : COLLAPSED_CARD_HEIGHT;
            height = lastCardTop + lastCardHeight + 40; // Add 40px for bottom padding
        }

        return { cardPositions: positions, containerHeight: Math.max(height, 400) };
    }, [filteredCards, expandedCard]);

    return (
        <div className="flex-1 flex flex-col h-full">
            <div className="flex-shrink-0 px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="搜索卡片..."
                        value={activeSearchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {allCategories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1 text-xs rounded-full transition-all ${
                                selectedCategory === category
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {category}
                            {category !== 'All' && (
                                <span className="ml-1">
                                    ({categoryCounts[category] || 0})
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-transparent to-white/30">
                {filteredCards.length > 0 ? (
                    <div className="relative px-2 py-4" style={{ minHeight: `${containerHeight}px` }}>
                        {filteredCards.map((card, index) => {
                            const isExpanded = expandedCard === card.id;
                            const topPosition = cardPositions[card.id] ?? 0;

                            return (
                                <div
                                    key={card.id}
                                    data-card-id={card.id}
                                    className="absolute left-2 right-2 transition-transform duration-300 ease-in-out will-change-transform"
                                    style={{
                                        transform: `translateY(${topPosition}px)`,
                                        zIndex: isExpanded ? 50 : index + 1,
                                    }}
                                >
                                    <CardItem
                                        card={card}
                                        isManageMode={manageModeState?.isManageMode || false}
                                        isSelected={manageModeState?.selectedCards.includes(card.id) || false}
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
                        <p className="text-gray-500 text-sm mb-2">
                            {activeSearchQuery || selectedCategory !== 'All'
                                ? '没有找到匹配的卡片'
                                : '还没有知识卡片'}
                        </p>
                        <p className="text-gray-400 text-xs mb-4">
                            {activeSearchQuery || selectedCategory !== 'All'
                                ? '试试其他搜索词或分类'
                                : '点击下方按钮创建第一张卡片'}
                        </p>
                        {(!activeSearchQuery && selectedCategory === 'All') && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                                创建第一张卡片
                            </button>
                        )}
                    </div>
                )}
            </div>

            <button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-4 right-4 w-12 h-12 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center z-50"
                title="添加新卡片"
            >
                <Plus className="w-5 h-5" />
            </button>

            {filteredCards.length > 0 && (
                <div className="fixed bottom-4 left-4 px-2 py-1 bg-black/70 text-white text-xs rounded-lg z-50">
                    {filteredCards.length} / {cards.length} 卡片
                </div>
            )}

            <AddCardModal />
        </div>
    );
};
