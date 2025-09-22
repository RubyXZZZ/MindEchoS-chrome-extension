import React from 'react';
import { Layers, Plus } from 'lucide-react';
import { useStore } from '../../store';

export const NavigationBar: React.FC = () => {
    const { currentView, setCurrentView, setShowAddModal } = useStore();

    return (
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50">
            <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-base font-semibold text-gray-900">知识卡片</h1>
                    </div>

                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setCurrentView('cards')}
                            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                                currentView === 'cards' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                            }`}
                        >
                            知识卡片
                        </button>
                        <button
                            onClick={() => setCurrentView('chat')}
                            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                                currentView === 'chat' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                            }`}
                        >
                            AI对话
                        </button>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-all flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" />
                        添加卡片
                    </button>
                </div>
            </div>
        </div>
    );
};