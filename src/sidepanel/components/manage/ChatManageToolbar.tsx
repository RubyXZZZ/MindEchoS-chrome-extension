// components/manage/ChatManageToolbar.tsx
import React from 'react';
import { History, Folder, Download } from 'lucide-react';
import { useStore } from '../../store';

interface ChatManageToolbarProps {
    onActionComplete: () => void;
}

export const ChatManageToolbar: React.FC<ChatManageToolbarProps> = ({
                                                                        onActionComplete
                                                                    }) => {
    const {
        messages,
        selectedCardsForChat,
        chatArchives,
        archiveCurrentChat,
        setCurrentView
    } = useStore();

    const hasMessages = messages.length > 0;
    const hasArchives = chatArchives.length > 0;

    const handleArchive = async () => {
        if (!hasMessages) return;

        if (window.confirm('Archive this conversation? You can view it later in Settings.')) {
            await archiveCurrentChat();
            onActionComplete();
        }
    };

    const handleExport = () => {
        if (!hasMessages) return;

        const chatData = {
            timestamp: new Date().toISOString(),
            messages: messages,
            selectedCards: selectedCardsForChat
        };

        const dataStr = JSON.stringify(chatData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `chat_export_${Date.now()}.json`);
        linkElement.click();

        console.log('[ChatManageToolbar] Chat exported');
    };

    const handleViewHistory = () => {
        // 设置打开 archives tab 的标记
        localStorage.setItem('openSettingsTab', 'archives');
        setCurrentView('settings');
        onActionComplete();
    };

    return (
        <div className="mt-3 pt-3 border-t border-gray-200">
            {/* Toolbar - 横向布局，拉长按钮 */}
            <div className="flex items-center justify-center gap-2">
                {/* History Button */}
                <button
                    onClick={handleViewHistory}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors min-w-[80px] relative"
                    title="View chat history"
                >
                    <History className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">History</span>
                    {hasArchives && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-purple-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {chatArchives.length}
                        </span>
                    )}
                </button>

                {/* Archive Button */}
                <button
                    onClick={handleArchive}
                    disabled={!hasMessages}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors min-w-[80px]"
                    title="Archive current conversation"
                >
                    <Folder className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Archive</span>
                </button>

                {/* Export Button */}
                <button
                    onClick={handleExport}
                    disabled={!hasMessages}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50 transition-colors min-w-[80px]"
                    title="Export current conversation"
                >
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Export</span>
                </button>
            </div>
        </div>
    );
};