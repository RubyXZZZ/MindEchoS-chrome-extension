import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Download, Calendar, MessageSquare, Archive as ArchiveIcon } from 'lucide-react';
import { useStore } from '../store';
import { formatTime } from '../utils/formatters';
import { STORAGE_KEYS } from '../utils/constants';

export const SettingsView: React.FC = () => {
    const {
        chatArchives,
        loadChatArchives,
        loadArchive,
        deleteArchive,
        exportArchive,
        setCurrentView
    } = useStore();

    // 检查是否从 History 按钮进入，默认打开 archives tab
    const [activeTab, setActiveTab] = useState<'general' | 'archives'>(() => {
        const openTab = localStorage.getItem('openSettingsTab');
        if (openTab === 'archives') {
            localStorage.removeItem('openSettingsTab');
            return 'archives';
        }
        return 'general';
    });

    useEffect(() => {
        loadChatArchives();
    }, []);

    const handleLoadArchive = (archiveId: string) => {
        loadArchive(archiveId);
    };

    const handleDeleteArchive = (archiveId: string) => {
        if (window.confirm('Delete this archived conversation? This cannot be undone.')) {
            deleteArchive(archiveId);
        }
    };

    const handleClearAllArchives = async () => {
        if (chatArchives.length === 0) return;

        if (window.confirm(`Delete all ${chatArchives.length} archived conversations? This cannot be undone.`)) {
            try {
                await chrome.storage.local.set({ [STORAGE_KEYS.CHAT_ARCHIVES]: [] });
                await loadChatArchives();
                console.log('[SettingsView] All archives cleared');
            } catch (error) {
                console.error('[SettingsView] Error clearing archives:', error);
            }
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setCurrentView('cards')}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-base font-semibold text-gray-900">Settings</h2>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200">
                <div className="flex px-4">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'general'
                                ? 'border-emerald-500 text-emerald-700'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('archives')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'archives'
                                ? 'border-emerald-500 text-emerald-700'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Archived Chats
                        {chatArchives.length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
                                {chatArchives.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'general' ? (
                    <div className="max-w-2xl mx-auto space-y-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">About</h3>
                            <p className="text-xs text-gray-600 mb-2">
                                Knowledge Cards - AI-powered knowledge management
                            </p>
                            <p className="text-xs text-gray-500">
                                Version 1.0.0
                            </p>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">AI Features</h3>
                            <div className="space-y-2 text-xs text-gray-600">
                                <div className="flex items-center justify-between py-1">
                                    <span>Prompt API</span>
                                    <span className="text-green-600 font-medium">Active</span>
                                </div>
                                <div className="flex items-center justify-between py-1">
                                    <span>Chat Persistence</span>
                                    <span className="text-green-600 font-medium">Enabled</span>
                                </div>
                                <div className="flex items-center justify-between py-1">
                                    <span>Archive Storage</span>
                                    <span className="text-gray-600">{chatArchives.length} conversations</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        {chatArchives.length === 0 ? (
                            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                                <ArchiveIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-600 mb-1">No archived conversations</p>
                                <p className="text-xs text-gray-500">
                                    Archive important conversations to save them for later
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Clear All Button */}
                                <div className="mb-4 flex justify-end">
                                    <button
                                        onClick={handleClearAllArchives}
                                        className="px-3 py-1.5 bg-red-50 text-red-700 text-xs rounded-lg hover:bg-red-100 border border-red-200 font-medium flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Clear All ({chatArchives.length})
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {chatArchives.map(archive => (
                                        <div
                                            key={archive.id}
                                            className="bg-white rounded-lg border border-gray-200 p-4 hover:border-emerald-300 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                                                        {archive.title}
                                                    </h4>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="w-3 h-3" />
                                                        {archive.messages.length} messages
                                                    </span>
                                                        <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                            {formatTime(archive.archivedAt)}
                                                    </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Preview */}
                                            <div className="text-xs text-gray-600 mb-3 line-clamp-2">
                                                {archive.messages[0]?.content}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleLoadArchive(archive.id)}
                                                    className="flex-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs rounded hover:bg-emerald-100 font-medium"
                                                >
                                                    Load Chat
                                                </button>
                                                <button
                                                    onClick={() => exportArchive(archive.id)}
                                                    className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs rounded hover:bg-purple-100 flex items-center gap-1"
                                                >
                                                    <Download className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteArchive(archive.id)}
                                                    className="px-3 py-1.5 bg-red-50 text-red-700 text-xs rounded hover:bg-red-100 flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};