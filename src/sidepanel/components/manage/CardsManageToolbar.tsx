import React from 'react';
import { Trash2, Download, FolderPlus, MessageSquare } from 'lucide-react';
import { useStore } from '../../store';

interface CardsManageToolbarProps {
    selectedCards: string[];
    onActionComplete: () => void;
}

export const CardsManageToolbar: React.FC<CardsManageToolbarProps> = ({
                                                                          selectedCards,
                                                                          onActionComplete
                                                                      }) => {
    const { cards, deleteCard, setSelectedCardsForChat, setCurrentView } = useStore();

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

    const handleCategorize = () => {
        // 打开分类模态框
        console.log('Open category modal');
    };

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
                    卡片对话
                </button>
                <button
                    onClick={handleDelete}
                    disabled={selectedCards.length === 0}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 disabled:opacity-50 flex items-center gap-1"
                >
                    <Trash2 className="w-3 h-3" />
                    删除
                </button>
                <button
                    onClick={handleExport}
                    disabled={selectedCards.length === 0}
                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200 disabled:opacity-50 flex items-center gap-1"
                >
                    <Download className="w-3 h-3" />
                    导出
                </button>
                <button
                    onClick={handleCategorize}
                    disabled={selectedCards.length === 0}
                    className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200 disabled:opacity-50 flex items-center gap-1"
                >
                    <FolderPlus className="w-3 h-3" />
                    分类
                </button>
            </div>
        </div>
    );
};
