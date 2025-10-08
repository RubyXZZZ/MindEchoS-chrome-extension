import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Calendar, MessageSquare, Archive as ArchiveIcon, Hash, RotateCcw, Check } from 'lucide-react';
import { useStore } from '../store';
import { formatTime } from '../utils/formatters';
import { STORAGE_KEYS } from '../utils/constants';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';

export const SettingsView: React.FC = () => {
    const {
        chatArchives,
        loadChatArchives,
        loadArchive,
        deleteArchive,
        setCurrentView,
        showCardNumbers,
        setShowCardNumbers,
        resetCardNumbers
    } = useStore();

    // Check if entering from History button, default open archives tab
    const [activeTab, setActiveTab] = useState<'general' | 'archives'>(() => {
        const openTab = localStorage.getItem('openSettingsTab');
        if (openTab === 'archives') {
            localStorage.removeItem('openSettingsTab');
            return 'archives';
        }
        return 'general';
    });

    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

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

    const handleResetCardNumbers = async () => {
        setShowResetConfirm(false);
        try {
            await resetCardNumbers();
            setResetSuccess(true);
            setTimeout(() => setResetSuccess(false), 2000);
        } catch (error) {
            console.error('[SettingsView] Error resetting card numbers:', error);
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
                        {/* About Section */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">About</h3>
                            <p className="text-xs text-gray-600 mb-2">
                                Knowledge Cards - AI-powered knowledge management
                            </p>
                            <p className="text-xs text-gray-500">
                                Version 1.0.0
                            </p>
                        </div>

                        {/* AI Features Section */}
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

                        {/* Card Display Settings */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Hash className="w-4 h-4 text-gray-600" />
                                <h3 className="text-sm font-semibold text-gray-900">Card Display</h3>
                            </div>

                            <div className="space-y-3">
                                {/* Show Card Numbers Toggle */}
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="text-sm text-gray-700 font-medium">Show Card Numbers</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Display sequential numbers on cards</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showCardNumbers}
                                            onChange={(e) => setShowCardNumbers(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                {/* Reset Card Numbers Button */}
                                <div className="pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => setShowResetConfirm(true)}
                                        disabled={resetSuccess}
                                        className={`w-full px-4 py-2 text-sm rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                                            resetSuccess
                                                ? 'bg-green-50 text-green-700 border border-green-200'
                                                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                        } disabled:cursor-default`}
                                    >
                                        {resetSuccess ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Reset Complete
                                            </>
                                        ) : (
                                            <>
                                                <RotateCcw className="w-4 h-4" />
                                                Reset Card Numbers
                                            </>
                                        )}
                                    </button>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Renumber all cards sequentially based on creation time. This will eliminate any gaps in numbering.
                                    </p>
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

            {/* Reset Confirm Dialog */}
            <ConfirmDialog
                isOpen={showResetConfirm}
                title="Reset Card Numbers"
                message="Renumber all cards sequentially based on creation time? This will eliminate any gaps in numbering. This action cannot be undone."
                confirmText="Reset"
                cancelText="Cancel"
                onConfirm={handleResetCardNumbers}
                onCancel={() => setShowResetConfirm(false)}
            />
        </div>
    );
};