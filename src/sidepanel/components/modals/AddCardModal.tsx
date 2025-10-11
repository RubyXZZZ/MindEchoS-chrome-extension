import React, { useState, useEffect, useRef } from 'react';
import { X, Save, FileText, Globe, Video, Loader2 } from 'lucide-react';
import { useStore } from '../../store';
import { KnowledgeCard } from '../../types/card.types';
import { CARD_COLORS, DEFAULT_CATEGORY, ALL_CARDS_FILTER } from '../../utils/constants';
import { useAISummarizer } from '../../hooks/useAISummarizer';
import { CategorySelector } from '../layout/CategorySelector';
import { ConfirmDialog } from '../modals/ConfirmDialog';

export const AddCardModal: React.FC = () => {
    const {
        showAddModal,
        setShowAddModal,
        addCard,
        updateCard,
        cards,
        editingCard,
        setEditingCard,
        initialSelection,
        setInitialSelection,
        selectedCategory,
    } = useStore();

    const isEditing = !!editingCard;
    const editingCardData = isEditing ? cards.find(c => c.id === editingCard) : null;

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: DEFAULT_CATEGORY,
        url: ''
    });

    const [extractingSelection, setExtractingSelection] = useState(false);
    const [extractingWebpage, setExtractingWebpage] = useState(false);
    const [extractError, setExtractError] = useState<string>('');
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [forceHideLoading, setForceHideLoading] = useState(false);  // 强制隐藏 loading

    const {
        summarizeTextStreaming,
        summarizeWebpageStreaming,
        isProcessing: isAIProcessing,
        isAvailable: isAIAvailable,
        isChecking: isAIChecking
    } = useAISummarizer();

    const hasProcessedAutoAI = useRef(false);
    const streamingTitle = useRef('');
    const streamingContent = useRef('');
    const abortController = useRef<AbortController | null>(null);

    const handleClose = () => {
        const isProcessing = extractingSelection || extractingWebpage || isAIProcessing;

        if (isProcessing) {
            setShowCloseConfirm(true);
        } else {
            setShowAddModal(false);
        }
    };

    const handleConfirmClose = () => {
        setShowCloseConfirm(false);
        hasProcessedAutoAI.current = false;
        setInitialSelection(null);
        chrome.storage.session.remove('pendingSelection');
        setShowAddModal(false);
    };

    const handleCancelClose = () => {
        setShowCloseConfirm(false);
    };

    useEffect(() => {
        const processAutoAI = async () => {
            if (!showAddModal || !initialSelection || !initialSelection.needsAISummarize) {
                return;
            }

            if (hasProcessedAutoAI.current) {
                return;
            }

            if (isAIChecking) {
                console.log('[AddCardModal] Waiting for AI availability check...');
                return;
            }

            console.log('[AddCardModal] Auto-processing AI (STREAMING) for right-click/shortcut');
            console.log('[AddCardModal] AI Available:', isAIAvailable);
            hasProcessedAutoAI.current = true;
            setExtractingSelection(true);

            let initialCategory = DEFAULT_CATEGORY;
            if (selectedCategory !== ALL_CARDS_FILTER) {
                initialCategory = selectedCategory;
            }

            abortController.current = new AbortController();
            const signal = abortController.current.signal;
            streamingTitle.current = '';
            streamingContent.current = '';

            try {
                await summarizeTextStreaming(
                    initialSelection.text,
                    initialSelection.url,
                    (titleChunk) => {
                        if (signal.aborted) return;
                        console.log('[AddCardModal] Title update:', titleChunk.substring(0, 50));
                        streamingTitle.current = titleChunk;
                        setFormData(prev => ({
                            ...prev,
                            title: titleChunk,
                            category: initialCategory,
                            url: initialSelection.url || ''
                        }));
                    },
                    (contentChunk) => {
                        if (signal.aborted) return;
                        console.log('[AddCardModal] Content update, length:', contentChunk.length);
                        streamingContent.current = contentChunk;
                        setFormData(prev => ({
                            ...prev,
                            content: contentChunk
                        }));
                    },
                    signal
                );

                if (!signal.aborted) {
                    console.log('[AddCardModal] Streaming completed, updating form');
                    setFormData({
                        title: streamingTitle.current || initialSelection.text.substring(0, 50) + '...',
                        content: streamingContent.current || initialSelection.text,
                        category: initialCategory,
                        url: initialSelection.url || ''
                    });
                }
            } catch (error: any) {
                if (error.name === 'AbortError' || signal.aborted) {
                    console.log('[AddCardModal] Auto AI streaming aborted by user');
                } else {
                    console.error('[AddCardModal] Auto AI streaming error:', error);
                    setFormData({
                        title: initialSelection.text.substring(0, 50) + '...',
                        content: initialSelection.text,
                        category: initialCategory,
                        url: initialSelection.url || ''
                    });
                }
            } finally {
                setExtractingSelection(false);
                abortController.current = null;
            }
        };

        processAutoAI();
    }, [showAddModal, initialSelection, summarizeTextStreaming, selectedCategory, isAIChecking, isAIAvailable]);

    useEffect(() => {
        if (!showAddModal) {
            // Modal 关闭时立即强制隐藏所有 loading
            setForceHideLoading(true);
            setExtractingSelection(false);
            setExtractingWebpage(false);
            setExtractError('');
            setShowCloseConfirm(false);
            setShowSaveConfirm(false);

            // 延迟清理其他状态
            setTimeout(() => {
                if (editingCard) setEditingCard(null);
                if (initialSelection) setInitialSelection(null);
                hasProcessedAutoAI.current = false;
                streamingTitle.current = '';
                streamingContent.current = '';

                // 中断可能还在运行的 AI
                if (abortController.current) {
                    abortController.current.abort();
                    abortController.current = null;
                }

                chrome.storage.session.remove('pendingSelection');
            }, 0);
            return;
        }

        // Modal 打开时重置强制隐藏标志
        setForceHideLoading(false);

        if (editingCardData) {
            setFormData({
                title: editingCardData.title,
                content: editingCardData.content,
                category: editingCardData.category || DEFAULT_CATEGORY,
                url: editingCardData.url || ''
            });
            return;
        }

        if (!initialSelection || !initialSelection.needsAISummarize) {
            let initialCategory = DEFAULT_CATEGORY;
            if (selectedCategory !== ALL_CARDS_FILTER) {
                initialCategory = selectedCategory;
            }
            setFormData({
                title: '',
                content: '',
                category: initialCategory,
                url: ''
            });
        }
    }, [showAddModal, editingCardData, editingCard, setEditingCard, initialSelection, setInitialSelection, selectedCategory]);

    const handleExtractSelection = async () => {
        setExtractingSelection(true);
        setExtractError('');

        try {
            console.log('[AddCardModal] Manual Selection button clicked (STREAMING)');
            const response = await chrome.runtime.sendMessage({
                command: 'GET_ACTIVE_TAB_SELECTION'
            });

            console.log('[AddCardModal] Content script response:', response);

            if (response && response.success) {
                console.log('[AddCardModal] Calling streaming AI summarizer for selection...');

                abortController.current = new AbortController();
                const signal = abortController.current.signal;
                streamingTitle.current = '';
                streamingContent.current = '';

                await summarizeTextStreaming(
                    response.data.text,
                    response.data.url,
                    (titleChunk) => {
                        if (signal.aborted) return;
                        streamingTitle.current = titleChunk;
                        setFormData(prev => ({
                            ...prev,
                            title: titleChunk,
                            url: response.data.url || prev.url
                        }));
                    },
                    (contentChunk) => {
                        if (signal.aborted) return;
                        streamingContent.current = contentChunk;
                        setFormData(prev => ({
                            ...prev,
                            content: contentChunk
                        }));
                    },
                    signal
                );

                if (!signal.aborted) {
                    console.log('[AddCardModal] Selection streaming completed');
                    setFormData(prev => ({
                        ...prev,
                        title: streamingTitle.current || response.data.text.substring(0, 50) + '...',
                        content: streamingContent.current || response.data.text,
                        url: response.data.url || prev.url
                    }));
                }
            } else {
                setExtractError(response?.error || '无法获取选中内容');
            }
        } catch (error: any) {
            if (error.name === 'AbortError' || abortController.current?.signal.aborted) {
                console.log('[AddCardModal] Selection streaming aborted by user');
            } else {
                console.error('[AddCardModal] Failed to extract selection:', error);
                setExtractError('提取失败，请重试');
            }
        } finally {
            setExtractingSelection(false);
            abortController.current = null;
        }
    };

    const handleExtractWebpage = async () => {
        setExtractingWebpage(true);
        setExtractError('');

        try {
            console.log('[AddCardModal] Manual Webpage button clicked (STREAMING)');
            const response = await chrome.runtime.sendMessage({
                command: 'EXTRACT_CURRENT_WEBPAGE'
            });

            console.log('[AddCardModal] Webpage extract response:', response);

            if (response && response.success) {
                console.log('[AddCardModal] Calling streaming AI webpage summarizer...');

                abortController.current = new AbortController();
                const signal = abortController.current.signal;
                streamingTitle.current = '';
                streamingContent.current = '';

                await summarizeWebpageStreaming(
                    response.data,
                    (titleChunk) => {
                        if (signal.aborted) return;
                        streamingTitle.current = titleChunk;
                        setFormData(prev => ({
                            ...prev,
                            title: titleChunk,
                            url: response.data.url || prev.url
                        }));
                    },
                    (contentChunk) => {
                        if (signal.aborted) return;
                        streamingContent.current = contentChunk;
                        setFormData(prev => ({
                            ...prev,
                            content: contentChunk
                        }));
                    },
                    signal
                );

                if (!signal.aborted) {
                    console.log('[AddCardModal] Webpage streaming completed');
                    setFormData(prev => ({
                        ...prev,
                        title: streamingTitle.current || response.data.title,
                        content: streamingContent.current || response.data.content,
                        url: response.data.url || prev.url
                    }));
                }
            } else {
                setExtractError(response?.error || '无法提取网页内容');
            }
        } catch (error: any) {
            if (error.name === 'AbortError' || abortController.current?.signal.aborted) {
                console.log('[AddCardModal] Webpage streaming aborted by user');
            } else {
                console.error('[AddCardModal] Failed to extract webpage:', error);
                setExtractError('提取失败，请重试');
            }
        } finally {
            setExtractingWebpage(false);
            abortController.current = null;
        }
    };

    const handleExtractVideo = () => {
        setExtractError('视频提取功能开发中，敬请期待');
    };

    const handleSave = async () => {
        const isProcessing = extractingSelection || extractingWebpage || isAIProcessing;

        if (isProcessing) {
            setShowSaveConfirm(true);
            return;
        }

        performSave();
    };

    const performSave = async () => {
        if (!formData.title.trim() && !isEditing) {
            formData.title = formData.content.substring(0, 30) + (formData.content.length > 30 ? '...' : '');
        }
        if (!formData.title.trim()) {
            alert('请输入标题');
            return;
        }

        if (isEditing && editingCardData) {
            await updateCard(editingCardData.id, { ...formData });
        } else {
            const newCard: KnowledgeCard = {
                id: Date.now().toString(),
                ...formData,
                tags: [],
                color: CARD_COLORS[cards.length % CARD_COLORS.length],
                timestamp: Date.now()
            };
            await addCard(newCard);
        }

        setShowAddModal(false);
    };

    const handleConfirmSave = () => {
        setShowSaveConfirm(false);

        if (abortController.current) {
            console.log('[AddCardModal] Aborting AI processing before save');
            abortController.current.abort();
            abortController.current = null;
        }

        hasProcessedAutoAI.current = false;
        setInitialSelection(null);
        chrome.storage.session.remove('pendingSelection');

        performSave();
    };

    const isAnyLoading = !forceHideLoading && (extractingSelection || extractingWebpage || isAIProcessing);

    if (!showAddModal) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative z-[10001]">
                    <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
                        <h2 className="text-lg font-semibold">{isEditing ? '编辑知识卡片' : '添加知识卡片'}</h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-500 hover:text-gray-700"
                            title="关闭"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 space-y-4 overflow-y-auto flex-grow">
                        {!isEditing && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    智能提取内容
                                    {isAIChecking && (
                                        <span className="ml-2 text-xs text-blue-600">🔄 检查 AI 可用性...</span>
                                    )}
                                    {!isAIChecking && isAIAvailable && (
                                        <span className="ml-2 text-xs text-green-600">✓ AI 可用</span>
                                    )}
                                    {!isAIChecking && !isAIAvailable && (
                                        <span className="ml-2 text-xs text-yellow-600">⚠ AI 不可用（将使用原文）</span>
                                    )}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={handleExtractSelection}
                                        disabled={isAnyLoading || isAIChecking}
                                        className="relative px-3 py-2.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {extractingSelection ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <FileText className="w-4 h-4" />
                                        )}
                                        <span>Selection</span>
                                    </button>

                                    <button
                                        onClick={handleExtractWebpage}
                                        disabled={isAnyLoading || isAIChecking}
                                        className="px-3 py-2.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {extractingWebpage ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Globe className="w-4 h-4" />
                                        )}
                                        <span>Webpage</span>
                                    </button>

                                    <button
                                        onClick={handleExtractVideo}
                                        disabled={isAnyLoading || isAIChecking}
                                        className="px-3 py-2.5 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Video className="w-4 h-4" />
                                        <span>Video</span>
                                    </button>
                                </div>

                                {extractError && (
                                    <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                                        {extractError}
                                    </div>
                                )}

                                {isAIChecking && (
                                    <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        正在检查 Chrome AI 可用性...
                                    </div>
                                )}

                                {(extractingSelection || extractingWebpage || isAIProcessing) && !isAIChecking && (
                                    <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        正在使用 Chrome AI 智能提取和总结内容...
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">标题</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="输入卡片标题..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">内容</label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                rows={8}
                                placeholder="详细内容..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">URL</label>
                            <input
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({...formData, url: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="relative" style={{ zIndex: 50 }}>
                            <label className="block text-sm font-medium mb-1 text-gray-700">分类</label>
                            <CategorySelector
                                value={formData.category}
                                onChange={(category) => setFormData({ ...formData, category })}
                                dropDirection="up"
                            />
                        </div>
                    </div>

                    <div className="p-4 border-t flex justify-end gap-2 flex-shrink-0">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-emerald-600 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {isEditing ? '保存更改' : '保存'}
                        </button>
                    </div>
                </div>
            </div>



            {/* 关闭确认对话框 */}
            <ConfirmDialog
                isOpen={showCloseConfirm}
                title="Interrupt AI Processing"
                message="AI is currently generating content. Closing now will stop the process. Do you want to continue?"
                confirmText="Confirm"
                cancelText="Cancel"
                onConfirm={handleConfirmClose}
                onCancel={handleCancelClose}
            />

            {/* 保存确认对话框 */}
            <ConfirmDialog
                isOpen={showSaveConfirm}
                title="Save Incomplete Content"
                message="AI is still generating content. Saving now may produce incomplete content. Are you sure you want to save?"
                confirmText="Save"
                cancelText="Wait"
                onConfirm={handleConfirmSave}
                onCancel={() => setShowSaveConfirm(false)}
            />
        </>
    );
};

