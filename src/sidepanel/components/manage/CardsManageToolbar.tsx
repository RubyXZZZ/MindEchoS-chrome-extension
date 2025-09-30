import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Download, FolderPlus, MessageSquare } from 'lucide-react';
import { useStore } from '../../store';
import { CategorySelector } from '../layout/CategorySelector';

interface CardsManageToolbarProps {
    selectedCards: string[];
    onActionComplete: () => void;
}

export const CardsManageToolbar: React.FC<CardsManageToolbarProps> = ({
                                                                          selectedCards,
                                                                          onActionComplete
                                                                      }) => {
    const { cards, deleteCard, updateCard, setSelectedCardsForChat, setCurrentView } = useStore();
    const [showCategorySelector, setShowCategorySelector] = useState(false);
    const categoryButtonRef = useRef<HTMLButtonElement>(null);
    const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });

    const handleLinkToChat = () => {
        setSelectedCardsForChat(selectedCards);
        setCurrentView('chat');
        onActionComplete();
    };

    const handleDelete = () => {
        if (window.confirm(`确定要删除 ${selectedCards.length} 张卡片吗？`)) {
            selectedCards.forEach(id => deleteCard(id));
            onActionComplete();
        }
    };

    const handleExport = () => {
        const selectedData = cards.filter(card => selectedCards.includes(card.id));
        const dataStr = JSON.stringify(selectedData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `cards_export_${Date.now()}.json`);
        linkElement.click();
    };

    // 获取选中卡片的分类情况
    const getSelectedCardsCategory = (): string => {
        if (selectedCards.length === 0) return '';

        const selectedCardsData = cards.filter(card => selectedCards.includes(card.id));
        const firstCategory = selectedCardsData[0]?.category;
        const allSame = selectedCardsData.every(card => card.category === firstCategory);

        return allSame ? (firstCategory || 'Other') : '';
    };

    // 处理分类变更
    const handleCategoryChange = async (newCategory: string) => {
        // 批量更新所有选中卡片的分类
        for (const cardId of selectedCards) {
            await updateCard(cardId, { category: newCategory });
        }
        setShowCategorySelector(false);
        onActionComplete();
    };

    // 计算按钮位置
    useEffect(() => {
        if (showCategorySelector && categoryButtonRef.current) {
            const rect = categoryButtonRef.current.getBoundingClientRect();
            setButtonPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right
            });
        }
    }, [showCategorySelector]);

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showCategorySelector &&
                !target.closest('.category-selector-portal') &&
                !categoryButtonRef.current?.contains(target)) {
                setShowCategorySelector(false);
            }
        };

        if (showCategorySelector) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCategorySelector]);

    const currentCategory = getSelectedCardsCategory();

    return (
        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-600">
                已选择 {selectedCards.length} 张卡片
            </span>
            <div className="flex gap-1">
                <button
                    onClick={handleLinkToChat}
                    disabled={selectedCards.length === 0}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 disabled:opacity-50 flex items-center gap-1"
                >
                    <MessageSquare className="w-3 h-3" />
                    AI
                </button>
                <button
                    onClick={handleExport}
                    disabled={selectedCards.length === 0}
                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200 disabled:opacity-50 flex items-center gap-1"
                >
                    <Download className="w-3 h-3" />
                    Export
                </button>
                <button
                    onClick={handleDelete}
                    disabled={selectedCards.length === 0}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 disabled:opacity-50 flex items-center gap-1"
                >
                    <Trash2 className="w-3 h-3" />
                    Delete
                </button>

                {/* 分类按钮 */}
                <button
                    ref={categoryButtonRef}
                    onClick={() => setShowCategorySelector(!showCategorySelector)}
                    disabled={selectedCards.length === 0}
                    className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
                        showCategorySelector
                            ? 'bg-orange-200 text-orange-700'
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    } disabled:opacity-50`}
                >
                    <FolderPlus className="w-3 h-3" />
                    Category
                </button>

                {/* 使用Portal渲染CategorySelector到body */}
                {showCategorySelector && createPortal(
                    <div
                        className="category-selector-portal"
                        style={{
                            position: 'fixed',
                            top: `${buttonPosition.top}px`,
                            right: `${buttonPosition.right}px`,
                            zIndex: 999999,
                            minWidth: '240px'
                        }}
                    >
                        <CategorySelector
                            value={currentCategory}
                            onChange={handleCategoryChange}
                            placeholder={currentCategory === '' ? '选择分类' : currentCategory}
                            dropDirection="down"
                            manageMode={true}  // 使用管理模式
                            onCancel={() => setShowCategorySelector(false)}  // 取消时关闭
                        />
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};