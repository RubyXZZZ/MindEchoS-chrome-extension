import { useEffect } from 'react';
import { useStore } from '../store';
import { ChromeStorageService } from '../services/storage/chromeStorage';

export function useCards() {
    const { cards, setCards } = useStore();

    useEffect(() => {
        // Auto-save cards when changed
        if (cards.length > 0) {
            ChromeStorageService.saveCards(cards);
        }
    }, [cards]);

    return { cards, setCards };
}
