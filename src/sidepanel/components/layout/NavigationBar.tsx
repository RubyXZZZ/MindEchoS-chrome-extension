import React, { useState } from 'react';
import { Layers, Settings2, Trash2, Download, FolderPlus, MessageSquare, X } from 'lucide-react';
import { useStore } from '../../store';

// Export for CardsView to use
export interface ManageModeState {
    isManageMode: boolean;
    selectedCards: string[];
}

export const NavigationBar: React.FC<{
    manageModeState?: ManageModeState;
    onManageModeChange?: (state: ManageModeState) => void;
}> = ({ manageModeState, onManageModeChange }) => {
    const {
        currentView,
        setCurrentView,
        cards,
        deleteCard,
        setSelectedCardsForChat,
        updateCard
    } = useStore();

    // Local state (can be overridden by props)
    const [localManageMode, setLocalManageMode] = useState(false);
    const [localSelectedCards, setLocalSelectedCards] = useState<string[]>([]);

    // Use props if provided, otherwise use local state
    const isManageMode = manageModeState?.isManageMode ?? localManageMode;
    const selectedCards = manageModeState?.selectedCards ?? localSelectedCards;

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [customCategories, setCustomCategories] = useState<string[]>(['Personal', 'Work']);
    const [newCategory, setNewCategory] = useState('');

    const defaultCategories = ['Technology', 'Design', 'Business', 'Other'];
    const allCategories = [...defaultCategories, ...customCategories];

    const handleManageClick = () => {
        const newMode = !isManageMode;

        if (onManageModeChange) {
            onManageModeChange({
                isManageMode: newMode,
                selectedCards: newMode ? selectedCards : []
            });
        } else {
            setLocalManageMode(newMode);
            if (!newMode) {
                setLocalSelectedCards([]);
            }
        }
    };

    const handleLinkToChat = () => {
        if (selectedCards.length > 0) {
            setSelectedCardsForChat(selectedCards);
            setCurrentView('chat');
            handleManageClick(); // Exit manage mode
        }
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`确定要删除 ${selectedCards.length} 张卡片吗？`)) {
            selectedCards.forEach(id => deleteCard(id));
            handleManageClick(); // Exit manage mode
        }
    };

    const handleExportSelected = () => {
        const selectedData = cards.filter(card => selectedCards.includes(card.id));
        const dataStr = JSON.stringify(selectedData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `cards_export_${Date.now()}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleAddToCategory = () => {
        setShowCategoryModal(true);
    };

    const handleCategorySelect = (category: string) => {
        selectedCards.forEach(cardId => {
            updateCard(cardId, { category });
        });
        setShowCategoryModal(false);
        handleManageClick(); // Exit manage mode
    };

    const handleAddCustomCategory = () => {
        if (newCategory.trim() && !allCategories.includes(newCategory.trim())) {
            setCustomCategories([...customCategories, newCategory.trim()]);
            setNewCategory('');
        }
    };

    const handleDeleteCustomCategory = (category: string) => {
        setCustomCategories(customCategories.filter(c => c !== category));
    };

    return (
        <>
            <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        {/* Logo and Title */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                                <Layers className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-base font-semibold text-gray-900">知识卡片</h1>
                        </div>

                        {/* View Switcher */}
                        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                            <button
                                onClick={() => setCurrentView('cards')}
                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    currentView === 'cards'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                知识卡片
                            </button>
                            <button
                                onClick={() => setCurrentView('chat')}
                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    currentView === 'chat'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                AI对话
                            </button>
                        </div>

                        {/* Manage Button */}
                        <button
                            onClick={handleManageClick}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                                isManageMode
                                    ? 'bg-gray-800 text-white hover:bg-gray-900'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                            }`}
                        >
                            {isManageMode ? (
                                <>
                                    <X className="w-3 h-3" />
                                    <span>取消</span>
                                </>
                            ) : (
                                <>
                                    <Settings2 className="w-3 h-3" />
                                    <span>Manage</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Management Toolbar */}
                    {isManageMode && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-600">
                已选择 {selectedCards.length} 张卡片
              </span>

                            <div className="flex gap-1">
                                <button
                                    onClick={handleLinkToChat}
                                    disabled={selectedCards.length === 0}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                >
                                    <MessageSquare className="w-3 h-3" />
                                    卡片对话
                                </button>

                                <button
                                    onClick={handleDeleteSelected}
                                    disabled={selectedCards.length === 0}
                                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    删除
                                </button>

                                <button
                                    onClick={handleExportSelected}
                                    disabled={selectedCards.length === 0}
                                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                >
                                    <Download className="w-3 h-3" />
                                    导出
                                </button>

                                <button
                                    onClick={handleAddToCategory}
                                    disabled={selectedCards.length === 0}
                                    className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                >
                                    <FolderPlus className="w-3 h-3" />
                                    分类
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-4 max-w-sm w-full">
                        <h3 className="text-sm font-semibold mb-3">选择分类</h3>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {allCategories.map(category => (
                                <div key={category} className="flex items-center justify-between">
                                    <button
                                        onClick={() => handleCategorySelect(category)}
                                        className="flex-1 text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg"
                                    >
                                        {category}
                                    </button>
                                    {customCategories.includes(category) && (
                                        <button
                                            onClick={() => handleDeleteCustomCategory(category)}
                                            className="p-1 hover:bg-red-100 rounded text-red-500"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 pt-3 border-t flex gap-2">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="新分类名称"
                                className="flex-1 px-3 py-1.5 text-sm border rounded-lg"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                            />
                            <button
                                onClick={handleAddCustomCategory}
                                className="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600"
                            >
                                添加
                            </button>
                        </div>

                        <button
                            onClick={() => setShowCategoryModal(false)}
                            className="w-full mt-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                        >
                            取消
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};