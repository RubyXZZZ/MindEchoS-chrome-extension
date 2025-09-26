
import React, { useState, useMemo } from 'react';
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
        setExpandedCard
    } = useStore();

    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [customCategories] = useState<string[]>(['Personal', 'Work']);

    const defaultCategories = ['All', 'Technology', 'Design', 'Business', 'Other'];
    const allCategories = [...defaultCategories, ...customCategories];

    const activeSearchQuery = searchQuery || localSearchQuery;

    // Filter cards and ensure newest cards appear at bottom
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

        // Sort by timestamp - oldest first (so newest appear at bottom)
        return filtered.sort((a, b) => a.timestamp - b.timestamp);
    }, [cards, activeSearchQuery, selectedCategory]);

    const handleCardSelect = (cardId: string) => {
        if (onCardSelect) {
            onCardSelect(cardId);
        }
    };

    // Auto-scroll to expanded card
    const scrollToCard = (cardId: string) => {
        setTimeout(() => {
            const element = document.querySelector(`[data-card-id="${cardId}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const handleExpandCard = (cardId: string | null) => {
        setExpandedCard(cardId);
        if (cardId) {
            scrollToCard(cardId);
        }
    };

    // Calculate container height for overlapping cards
    const containerHeight = useMemo(() => {
        if (filteredCards.length === 0) return 400;

        const cardHeight = 180; // Approximate collapsed card height
        const overlap = 50; // Pixels of overlap between cards
        const expandedHeight = 400; // Expanded card height
        const expandedIndex = filteredCards.findIndex(c => c.id === expandedCard);

        let totalHeight = 100; // Base padding

        filteredCards.forEach((card, index) => {
            if (card.id === expandedCard) {
                totalHeight += expandedHeight;
            } else if (expandedIndex >= 0 && index > expandedIndex) {
                totalHeight += overlap;
            } else {
                totalHeight += index === 0 ? cardHeight : overlap;
            }
        });

        return Math.max(totalHeight, 400);
    }, [filteredCards, expandedCard]);

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Fixed Search and Filters Header */}
            <div className="flex-shrink-0 px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-100">
                {/* Search Bar */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="搜索卡片..."
                        value={activeSearchQuery}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (setSearchQuery) {
                                setSearchQuery(value);
                            } else {
                                setLocalSearchQuery(value);
                            }
                        }}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                </div>

                {/* Category Filters */}
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
                  ({cards.filter(c => c.category === category).length})
                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Cards Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-transparent to-white/30">
                {filteredCards.length > 0 ? (
                    <div className="relative px-2 py-4" style={{ minHeight: `${containerHeight}px` }}>
                        {filteredCards.map((card, index) => {
                            const isExpanded = expandedCard === card.id;

                            // Calculate position - cards stack with overlap
                            let topPosition = 0;
                            const cardHeight = 180;
                            const overlap = 50;
                            const expandedHeight = 400;

                            for (let i = 0; i < index; i++) {
                                if (i === filteredCards.length - 1) {
                                    topPosition += cardHeight;
                                } else if (filteredCards[i].id === expandedCard) {
                                    topPosition += expandedHeight;
                                } else {
                                    topPosition += overlap;
                                }
                            }

                            // If current card is expanded, next cards should be tight against it
                            // No extra spacing needed

                            return (
                                <div
                                    key={card.id}
                                    data-card-id={card.id}
                                    className={`absolute transition-all duration-300 ${
                                        isExpanded ? 'z-50' : ''
                                    }`}
                                    style={{
                                        top: `${topPosition}px`,
                                        left: '4px',
                                        right: '4px',
                                        // Newer cards (higher index) have HIGHER z-index to appear on TOP
                                        zIndex: isExpanded ? 50 : index + 1,
                                    }}
                                >
                                    <CardItem
                                        card={card}
                                        isManageMode={manageModeState?.isManageMode || false}
                                        isSelected={manageModeState?.selectedCards.includes(card.id) || false}
                                        onSelect={handleCardSelect}
                                        isExpanded={isExpanded}
                                        onExpand={() => handleExpandCard(isExpanded ? null : card.id)}
                                        isOverlapping={true}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // Empty state
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

            {/* Floating Add Button */}
            <button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-4 right-4 w-12 h-12 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center z-20"
                title="添加新卡片"
            >
                <Plus className="w-5 h-5" />
            </button>

            {/* Card Count */}
            {filteredCards.length > 0 && (
                <div className="fixed bottom-4 left-4 px-2 py-1 bg-black/70 text-white text-xs rounded-lg z-20">
                    {filteredCards.length} / {cards.length} 卡片
                </div>
            )}

            {/* Add Card Modal */}
            <AddCardModal />
        </div>
    );
};