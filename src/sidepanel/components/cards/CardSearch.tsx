import React from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../../store';

export const CardSearch: React.FC = () => {
    const { searchQuery, setSearchQuery } = useStore();

    return (
        <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
                type="text"
                placeholder="搜索卡片..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
    );
};

