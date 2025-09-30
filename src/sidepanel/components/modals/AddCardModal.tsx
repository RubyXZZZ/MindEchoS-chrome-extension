import React, { useState, useEffect } from 'react';
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

    const [isExtracting, setIsExtracting] = useState(false);
    const [extractError, setExtractError] = useState<string>('');

    // 使用 AI Hook
    const { summarizeText, summarizeWebpage, isProcessing: isAIProcessing, isAvailable: isAIAvailable } = useAISummarizer();

    useEffect(() => {
        if (showAddModal) {
            if (editingCardData) {
                setFormData({
                    title: editingCardData.title,
                    content: editingCardData.content,
                    category: editingCardData.category || DEFAULT_CATEGORY,
                    url: editingCardData.url || ''
                });
            } else if (initialSelection) {
                // 如果有初始选择（从右键菜单或快捷键），使用 AI 总结后的内容
                let initialCategory = DEFAULT_CATEGORY;
                if (selectedCategory !== ALL_CARDS_FILTER) {
                    initialCategory = selectedCategory;
                }
                setFormData({
                    title: initialSelection.title || '',
                    content: initialSelection.text || '',
                    category: initialCategory,
                    url: initialSelection.url || ''
                });
            } else {
                // 新建空白卡片
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
            setExtractError('');
        } else {
            // 只在 Modal 关闭时重置
            if (editingCard) {
                setTimeout(() => setEditingCard(null), 0);
            }
            if (initialSelection) {
                setTimeout(() => setInitialSelection(null), 0);
            }
            setFormData({ title: '', content: '', category: DEFAULT_CATEGORY, url: '' });
            setExtractError('');
        }
    }, [showAddModal, editingCardData, initialSelection, selectedCategory, editingCard, setEditingCard, setInitialSelection]);

    // 处理 Selection 按钮点击
    const handleExtractSelection = async () => {
        setIsExtracting(true);
        setExtractError('');

        try {
            const response = await chrome.runtime.sendMessage({
                command: 'GET_ACTIVE_TAB_SELECTION'
            });

            if (response && response.success) {
                const summarized = await summarizeText(
                    response.data.text,
                    response.data.url
                );

                if (summarized.success) {
                    setFormData({
                        ...formData,
                        title: summarized.title || '',
                        content: summarized.content || response.data.text,
                        url: response.data.url || formData.url
                    });
                } else {
                    setExtractError(summarized.error || '总结失败');
                }
            } else {
                setExtractError(response?.error || '无法获取选中内容');
            }
        } catch (error) {
            console.error('Failed to extract selection:', error);
            setExtractError('提取失败，请重试');
        } finally {
            setIsExtracting(false);
        }
    };

    // 处理 Webpage 按钮点击
    const handleExtractWebpage = async () => {
        setIsExtracting(true);
        setExtractError('');

        try {
            const response = await chrome.runtime.sendMessage({
                command: 'EXTRACT_CURRENT_WEBPAGE'
            });

            if (response && response.success) {
                const summarized = await summarizeWebpage(response.data);

                if (summarized.success) {
                    setFormData({
                        ...formData,
                        title: summarized.title || response.data.title,
                        content: summarized.content || response.data.content,
                        url: response.data.url || formData.url
                    });
                } else {
                    setExtractError(summarized.error || '总结失败');
                }
            } else {
                setExtractError(response?.error || '无法提取网页内容');
            }
        } catch (error) {
            console.error('Failed to extract webpage:', error);
            setExtractError('提取失败，请重试');
        } finally {
            setIsExtracting(false);
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

    const isLoading = isExtracting || isAIProcessing;

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
                                {isAIAvailable && (
                                    <span className="ml-2 text-xs text-green-600">AI 可用</span>
                                )}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={handleExtractSelection}
                                    disabled={isLoading}
                                    className="relative px-3 py-2.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <FileText className="w-4 h-4" />
                                    )}
                                    <span>Selection</span>
                                </button>

                                <button
                                    onClick={handleExtractWebpage}
                                    disabled={isLoading}
                                    className="px-3 py-2.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Globe className="w-4 h-4" />
                                    )}
                                    <span>Webpage</span>
                                </button>

                                <button
                                    onClick={handleExtractVideo}
                                    disabled={isLoading}
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

                            {isAIProcessing && (
                                <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    正在使用 AI 智能提取和总结内容...
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

                    {/* 分类选择器 - 向上展开 */}
                    <div className="relative" style={{ zIndex: 50 }}>
                        <label className="block text-sm font-medium mb-1 text-gray-700">分类</label>
                        <CategorySelector
                            value={formData.category}
                            onChange={(category) => setFormData({ ...formData, category })}
                            dropDirection="up"  // 设置为向上展开
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