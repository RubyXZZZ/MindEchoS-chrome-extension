import React, { useState, useEffect, useRef } from 'react';
import { X, Save, FileText, Globe, Video, Loader2 } from 'lucide-react';
import { useStore } from '../../store';
import { KnowledgeCard } from '../../types/card.types';
import { CARD_COLORS, DEFAULT_CATEGORY, ALL_CARDS_FILTER } from '../../utils/constants';
import { useAISummarizer } from '../../hooks/useAISummarizer';
import { CategorySelector } from '../layout/CategorySelector';

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

    // 分别跟踪每个按钮的加载状态
    const [extractingSelection, setExtractingSelection] = useState(false);
    const [extractingWebpage, setExtractingWebpage] = useState(false);
    const [extractError, setExtractError] = useState<string>('');

    // 使用 AI Hook
    const {
        summarizeTextStreaming,
        summarizeWebpageStreaming,
        isProcessing: isAIProcessing,
        isAvailable: isAIAvailable,
        isChecking: isAIChecking
    } = useAISummarizer();

    // 跟踪是否已处理过右键/快捷键的自动 AI 总结
    const hasProcessedAutoAI = useRef(false);

    // 用于累积流式输出的临时状态
    const streamingTitle = useRef('');
    const streamingContent = useRef('');

    // 重置函数
    const resetModal = () => {
        setFormData({ title: '', content: '', category: DEFAULT_CATEGORY, url: '' });
        setExtractError('');
        setExtractingSelection(false);
        setExtractingWebpage(false);
        hasProcessedAutoAI.current = false;
    };

    // 处理右键/快捷键的自动 AI 总结（流式）
    useEffect(() => {
        const processAutoAI = async () => {
            if (!showAddModal || !initialSelection || !initialSelection.needsAISummarize) {
                return;
            }

            if (hasProcessedAutoAI.current) {
                return;
            }

            // 等待 AI 可用性检查完成
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

            // 重置流式累积
            streamingTitle.current = '';
            streamingContent.current = '';

            try {
                await summarizeTextStreaming(
                    initialSelection.text,
                    initialSelection.url,
                    // 标题流式回调 - 接收累积的完整文本
                    (titleChunk) => {
                        console.log('[AddCardModal] Title update:', titleChunk.substring(0, 50));
                        streamingTitle.current = titleChunk;
                        setFormData(prev => ({
                            ...prev,
                            title: titleChunk,
                            category: initialCategory,
                            url: initialSelection.url || ''
                        }));
                    },
                    // 内容流式回调 - 接收累积的完整文本
                    (contentChunk) => {
                        console.log('[AddCardModal] Content update, length:', contentChunk.length);
                        streamingContent.current = contentChunk;
                        setFormData(prev => ({
                            ...prev,
                            content: contentChunk
                        }));
                    }
                );

                // 流式结束后，一次性更新表单
                console.log('[AddCardModal] Streaming completed, updating form');
                setFormData({
                    title: streamingTitle.current || initialSelection.text.substring(0, 50) + '...',
                    content: streamingContent.current || initialSelection.text,
                    category: initialCategory,
                    url: initialSelection.url || ''
                });
            } catch (error) {
                console.error('[AddCardModal] Auto AI streaming error:', error);
                // 出错时使用原文
                setFormData({
                    title: initialSelection.text.substring(0, 50) + '...',
                    content: initialSelection.text,
                    category: initialCategory,
                    url: initialSelection.url || ''
                });
            } finally {
                setExtractingSelection(false);
            }
        };

        processAutoAI();
    }, [showAddModal, initialSelection, summarizeTextStreaming, selectedCategory, isAIChecking, isAIAvailable]);

    // 处理表单初始化（编辑模式或空白卡片）
    useEffect(() => {
        if (!showAddModal) {
            // Modal 关闭时清理
            setTimeout(() => {
                if (editingCard) setEditingCard(null);
                if (initialSelection) setInitialSelection(null);
                resetModal();
            }, 0);
            return;
        }

        // 如果是编辑模式
        if (editingCardData) {
            setFormData({
                title: editingCardData.title,
                content: editingCardData.content,
                category: editingCardData.category || DEFAULT_CATEGORY,
                url: editingCardData.url || ''
            });
            return;
        }

        // 如果是新建，且没有自动 AI 处理的需求（空白卡片）
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
        // 如果 needsAISummarize 为 true，表单会由上面的 useEffect 处理
    }, [showAddModal, editingCardData, editingCard, setEditingCard, initialSelection, setInitialSelection, selectedCategory]);

    // 处理 Selection 按钮点击（手动提取 - 流式）
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

                // 重置流式累积
                streamingTitle.current = '';
                streamingContent.current = '';

                await summarizeTextStreaming(
                    response.data.text,
                    response.data.url,
                    // 标题流式回调 - 接收累积的完整文本
                    (titleChunk) => {
                        streamingTitle.current = titleChunk;
                        setFormData(prev => ({
                            ...prev,
                            title: titleChunk,
                            url: response.data.url || prev.url
                        }));
                    },
                    // 内容流式回调 - 接收累积的完整文本
                    (contentChunk) => {
                        streamingContent.current = contentChunk;
                        setFormData(prev => ({
                            ...prev,
                            content: contentChunk
                        }));
                    }
                );

                // 流式结束后，一次性更新表单
                console.log('[AddCardModal] Selection streaming completed');
                setFormData(prev => ({
                    ...prev,
                    title: streamingTitle.current || response.data.text.substring(0, 50) + '...',
                    content: streamingContent.current || response.data.text,
                    url: response.data.url || prev.url
                }));
            } else {
                setExtractError(response?.error || '无法获取选中内容');
            }
        } catch (error) {
            console.error('[AddCardModal] Failed to extract selection:', error);
            setExtractError('提取失败，请重试');
        } finally {
            setExtractingSelection(false);
        }
    };

    // 处理 Webpage 按钮点击（提取网页内容 - 流式）
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

                // 重置流式累积
                streamingTitle.current = '';
                streamingContent.current = '';

                await summarizeWebpageStreaming(
                    response.data,
                    // 标题流式回调 - 接收累积的完整文本
                    (titleChunk) => {
                        streamingTitle.current = titleChunk;
                        setFormData(prev => ({
                            ...prev,
                            title: titleChunk,
                            url: response.data.url || prev.url
                        }));
                    },
                    // 内容流式回调 - 接收累积的完整文本
                    (contentChunk) => {
                        streamingContent.current = contentChunk;
                        setFormData(prev => ({
                            ...prev,
                            content: contentChunk
                        }));
                    }
                );

                // 流式结束后，一次性更新表单
                console.log('[AddCardModal] Webpage streaming completed');
                setFormData(prev => ({
                    ...prev,
                    title: streamingTitle.current || response.data.title,
                    content: streamingContent.current || response.data.content,
                    url: response.data.url || prev.url
                }));
            } else {
                setExtractError(response?.error || '无法提取网页内容');
            }
        } catch (error) {
            console.error('[AddCardModal] Failed to extract webpage:', error);
            setExtractError('提取失败，请重试');
        } finally {
            setExtractingWebpage(false);
        }
    };

    // 处理 Video 按钮点击（占位）
    const handleExtractVideo = () => {
        setExtractError('视频提取功能开发中，敬请期待');
    };

    const handleSave = async () => {
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

    // 任何按钮正在处理中
    const isAnyLoading = extractingSelection || extractingWebpage || isAIProcessing;

    if (!showAddModal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative z-[10001]">
                <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-semibold">{isEditing ? '编辑知识卡片' : '添加知识卡片'}</h2>
                    <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="输入卡片标题..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">内容</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                        onClick={() => setShowAddModal(false)}
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
    );
};