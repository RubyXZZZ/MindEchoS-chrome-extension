import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Archive as ArchiveIcon, RotateCcw, Check, Keyboard, Settings, HardDrive, Layers } from 'lucide-react';
import { useStore } from '../store';
import { getArchiveCardsSummary } from '../utils/formatters';
import { STORAGE_KEYS } from '../utils/constants';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';

export const SettingsView: React.FC = () => {
    const {
        cards,
        chatArchives,
        loadChatArchives,
        loadArchive,
        deleteArchive,
        setCurrentView,
        resetCardNumbers,
        storageUsed,
        storageLimit,
        updateStorageUsage
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
    const [currentShortcut, setCurrentShortcut] = useState<string>('Not set');

    // Helper functions for storage display
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStoragePercentage = (): number => {
        return Math.round((storageUsed / storageLimit) * 100);
    };

    const getStorageWarningLevel = (): 'safe' | 'warning' | 'danger' => {
        const percentage = getStoragePercentage();
        if (percentage >= 80) return 'danger';
        if (percentage >= 60) return 'warning';
        return 'safe';
    };

    useEffect(() => {
        loadChatArchives();
        updateStorageUsage();

        // 获取当前快捷键
        chrome.commands.getAll((commands) => {
            const extractCommand = commands.find(cmd => cmd.name === 'extract-knowledge');
            if (extractCommand && extractCommand.shortcut) {
                setCurrentShortcut(extractCommand.shortcut);
            }
        });
    }, [loadChatArchives, updateStorageUsage]);

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
                await updateStorageUsage();
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

    const handleOpenShortcutSettings = () => {
        chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
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

                        {/* Card Numbers Section */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Card Numbers</h3>

                            <div className="space-y-3">
                                <p className="text-xs text-gray-600">
                                    All cards are numbered sequentially based on creation time. Use the button below to renumber cards if needed.
                                </p>

                                {/* Reset Card Numbers Button */}
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
                                <p className="text-xs text-gray-500">
                                    Renumber all cards sequentially based on creation time. This will eliminate any gaps in numbering.
                                </p>
                            </div>
                        </div>

                        {/* Keyboard Shortcuts Section */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Keyboard className="w-4 h-4 text-gray-600" />
                                <h3 className="text-sm font-semibold text-gray-900">Keyboard Shortcuts</h3>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 font-medium">Extract Knowledge</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Quickly save selected text as a card
                                        </p>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                        <kbd className="inline-block px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-base font-semibold text-gray-800 shadow-sm leading-relaxed"
                                             style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>
                                            {currentShortcut}
                                        </kbd>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100">
                                    <button
                                        onClick={handleOpenShortcutSettings}
                                        className="w-full px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 border border-blue-200 font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Customize Shortcuts
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Storage Usage Section */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <HardDrive className="w-4 h-4 text-gray-600" />
                                <h3 className="text-sm font-semibold text-gray-900">Storage Usage</h3>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs text-gray-600">
                                    <span>{formatBytes(storageUsed)} used</span>
                                    <span>{formatBytes(storageLimit)} total</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                                            getStorageWarningLevel() === 'danger'
                                                ? 'bg-red-500'
                                                : getStorageWarningLevel() === 'warning'
                                                    ? 'bg-yellow-500'
                                                    : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${getStoragePercentage()}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">
                                        {getStoragePercentage()}% used
                                    </p>
                                    {getStorageWarningLevel() !== 'safe' && (
                                        <p className={`text-xs font-medium ${
                                            getStorageWarningLevel() === 'danger' ? 'text-red-600' : 'text-yellow-600'
                                        }`}>
                                            {getStorageWarningLevel() === 'danger'
                                                ? '⚠️ Storage nearly full'
                                                : '⚠️ Consider cleaning up'}
                                        </p>
                                    )}
                                </div>

                                {getStorageWarningLevel() !== 'safe' && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            Tip: Delete unused cards or clear archived conversations to free up space.
                                        </p>
                                    </div>
                                )}
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
                                    {chatArchives.map(archive => {
                                        const cardsSummary = getArchiveCardsSummary(archive.selectedCards, cards);

                                        return (
                                            <div
                                                key={archive.id}
                                                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-emerald-300 transition-colors"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        {/* 时间标题 */}
                                                        <h4 className="text-sm font-semibold text-gray-900 mb-1.5">
                                                            📅 {archive.title}
                                                        </h4>

                                                        {/* 卡片信息 */}
                                                        {archive.selectedCards.length > 0 && (
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                                                                <Layers className="w-3 h-3 flex-shrink-0" />
                                                                <span className="truncate">{cardsSummary}</span>
                                                            </div>
                                                        )}
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
                                        );
                                    })}
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