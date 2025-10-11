// chat view - manage mode
import React from 'react';
import { History, Folder } from 'lucide-react';
import { useStore } from '../../store';

interface ChatManageToolbarProps {
    onActionComplete: () => void;
}

export const ChatManageToolbar: React.FC<ChatManageToolbarProps> = ({
                                                                        onActionComplete
                                                                    }) => {
    const {
        messages,
        chatArchives,
        archiveCurrentChat,
        setCurrentView
    } = useStore();

    const hasMessages = messages.length > 0;
    const hasArchives = chatArchives.length > 0;

    const handleArchive = async () => {
        if (!hasMessages) return;

        await archiveCurrentChat();
        onActionComplete();
    };



    const handleViewHistory = () => {

        localStorage.setItem('openSettingsTab', 'archives');
        setCurrentView('settings');
        onActionComplete();
    };

    return (
        <div className="mt-2 pt-2 border-t border-gray-200">
            {/* Toolbar */}
            <div className="flex items-center justify-center gap-1.5">
                {/* History Button */}
                <button
                    onClick={handleViewHistory}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors min-w-[70px] relative"
                    title="View chat history"
                >
                    <History className="w-5 h-3.5" />
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
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors min-w-[70px]"
                    title="Archive current conversation"
                >
                    <Folder className="w-5 h-3.5" />
                    <span className="text-xs font-medium">Archive</span>
                </button>


            </div>
        </div>
    );
};