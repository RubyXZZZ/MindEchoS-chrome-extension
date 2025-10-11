// components/manage/ChatManageToolbar.tsx
import React from 'react';
import { History, Save, Download } from 'lucide-react';
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
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
            <div className="flex gap-1">
                <button
                    onClick={handleViewHistory}
                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200 flex items-center gap-1"
                >
                    <History className="w-3 h-3" />
                    History
                    {hasArchives && (
                        <span className="ml-1 px-1.5 py-0.5 bg-purple-200 rounded text-[10px]">
                            {chatArchives.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={handleArchive}
                    disabled={!hasMessages}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 disabled:opacity-50 flex items-center gap-1"
                >
                    <Save className="w-3 h-3" />
                    Archive
                </button>
                <button
                    onClick={handleExport}
                    disabled={!hasMessages}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 disabled:opacity-50 flex items-center gap-1"
                >
                    <Download className="w-3 h-3" />
                    Export
                </button>
            </div>
        </div>
    );
};