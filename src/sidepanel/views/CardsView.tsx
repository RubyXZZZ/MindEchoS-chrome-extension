import React, { useState, useMemo } from 'react';
import { Layers } from 'lucide-react';
import { useStore } from '../store';
import { CardItem } from '../components/cards/CardItem';
import { CardSearch } from '../components/cards/CardSearch';
import { CardFilters } from '../components/cards/CardFilters';

export const CardsView: React.FC = () => {
    const { cards, searchQuery, selectedCategory, expandedCard, setCards } = useStore();
    const [draggedCard, setDraggedCard] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const filteredCards = useMemo(() => {
        return cards.filter(card => {
            const matchesSearch = !searchQuery ||
                card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                card.summary.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || card.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [cards, searchQuery, selectedCategory]);

    const handleDragStart = (e: React.DragEvent, cardId: string) => {
        setDraggedCard(cardId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (!draggedCard) return;

        const draggedIndex = cards.findIndex(c => c.id === draggedCard);
        if (draggedIndex === dropIndex) return;

        const newCards = [...cards];
        const [draggedItem] = newCards.splice(draggedIndex, 1);
        newCards.splice(dropIndex, 0, draggedItem);

        setCards(newCards);
        setDraggedCard(null);
        setDragOverIndex(null);
    };

    // Calculate offsets for stacked cards
    const expandedIndex = expandedCard ? filteredCards.findIndex(c => c.id === expandedCard) : -1;

    const getCardOffset = (index: number): number => {
        let offset = index * 60;
        if (expandedCard && index > expandedIndex) {
            offset = expandedIndex * 60 + 350 + (index - expandedIndex - 1) * 60;
        }
        return offset;
    };

    const containerHeight = expandedCard
        ? Math.max(600, filteredCards.length * 60 + 400)
        : Math.max(400, filteredCards.length * 60 + 150);

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-gray-50/50 to-gray-100/50 backdrop-blur-sm">
            <div className="bg-white/90 backdrop-blur-md px-4 py-3 border-b border-gray-200/50">
                <CardSearch />
                <CardFilters />
            </div>

            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-white/30">
                <div className="relative px-2 py-4" style={{ minHeight: `${containerHeight}px` }}>
                    {filteredCards.map((card, index) => (
                        <div
                            key={card.id}
                            className="absolute transition-all duration-500"
                            style={{
                                transform: `translateY(${getCardOffset(index)}px)`,
                                zIndex: index,
                                left: '4px',
                                right: '4px'
                            }}
                        >
                            <CardItem
                                card={card}
                                index={index}
                                isDragOver={dragOverIndex === index}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                isLastVisible={index === filteredCards.length - 1}
                            />
                        </div>
                    ))}
                </div>

                {filteredCards.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Layers className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm">暂无卡片</p>
                        <p className="text-gray-400 text-xs mt-1">点击右下角添加按钮创建第一张卡片</p>
                    </div>
                )}
            </div>

            {filteredCards.length > 0 && !expandedCard && (
                <div className="absolute bottom-20 right-6 bg-white text-gray-700 text-xs px-3 py-1.5 rounded-lg shadow border border-gray-200">
                    <span className="font-medium">{filteredCards.length}</span> 张卡片
                </div>
            )}
        </div>
    );
};