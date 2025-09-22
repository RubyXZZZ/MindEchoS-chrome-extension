import React from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../../store';

export const FloatingActionButton: React.FC = () => {
    const { currentView, setShowAddModal } = useStore();

    if (currentView !== 'cards') return null;

    return (
        <button
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-6 right-6 w-12 h-12 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 hover:scale-110 transition-all flex items-center justify-center z-20"
        >
            <Plus className="w-5 h-5" />
        </button>
    );
};