import { useState, DragEvent } from 'react';
import { KnowledgeCard } from '../types/card.types';

interface UseDragAndDropProps {
    cards: KnowledgeCard[];
    onReorder: (cards: KnowledgeCard[]) => void;
}

export function useDragAndDrop({ cards, onReorder }: UseDragAndDropProps) {
    const [draggedCard, setDraggedCard] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: DragEvent, cardId: string) => {
        setDraggedCard(cardId);
        e.dataTransfer.effectAllowed = 'move';

        // Add drag image styling
        const dragImage = e.currentTarget as HTMLElement;
        dragImage.style.opacity = '0.5';
    };

    const handleDragEnd = (e: DragEvent) => {
        const dragElement = e.currentTarget as HTMLElement;
        dragElement.style.opacity = '1';
        setDraggedCard(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e: DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // Only update if different index
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = (e: DragEvent) => {
        // Check if we're leaving the container entirely
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!relatedTarget || !relatedTarget.closest('.card-container')) {
            setDragOverIndex(null);
        }
    };

    const handleDrop = (e: DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (!draggedCard) return;

        const draggedIndex = cards.findIndex(c => c.id === draggedCard);

        // Don't do anything if dropping on same position
        if (draggedIndex === dropIndex) {
            setDraggedCard(null);
            setDragOverIndex(null);
            return;
        }

        // Reorder cards
        const newCards = [...cards];
        const [draggedItem] = newCards.splice(draggedIndex, 1);
        newCards.splice(dropIndex, 0, draggedItem);

        onReorder(newCards);
        setDraggedCard(null);
        setDragOverIndex(null);
    };

    return {
        draggedCard,
        dragOverIndex,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
}
