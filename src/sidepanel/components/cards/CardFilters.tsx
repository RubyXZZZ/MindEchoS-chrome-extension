import React from 'react';
import { useStore } from '../../store';
import { CARD_CATEGORIES } from '../../utils/constants';

export const CardFilters: React.FC = () => {
    const { selectedCategory, setSelectedCategory } = useStore();

    return (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CARD_CATEGORIES.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                        selectedCategory === cat
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
};