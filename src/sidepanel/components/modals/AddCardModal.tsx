import React, { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { useStore } from '../../store';
import { KnowledgeCard } from '../../types/card.types';
import { CARD_COLORS } from '../../utils/constants';

export const AddCardModal: React.FC = () => {
    const { showAddModal, setShowAddModal, addCard, updateCard, cards, editingCard, setEditingCard, initialContent, setInitialContent } = useStore();

    const editingCardData = editingCard ? cards.find(c => c.id === editingCard) : null;

    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content: '',
        category: 'Other',
        url: ''
    });

    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryInput, setNewCategoryInput] = useState('');
    const [customCategories, setCustomCategories] = useState<string[]>(['Personal', 'Work']);
    const [extractedType, setExtractedType] = useState<string>('');

    const defaultCategories = ['Technology', 'Design', 'Business', 'Other'];
    const allCategories = [...defaultCategories, ...customCategories];

    useEffect(() => {
        if (showAddModal) {
            if (editingCardData) {
                // Load editing card data
                setFormData({
                    title: editingCardData.title,
                    summary: editingCardData.summary || '',
                    content: editingCardData.content,
                    category: editingCardData.category || 'Other',
                    url: editingCardData.url || ''
                });
            } else if (initialContent) {
                // New card from selection
                setFormData({
                    title: '',
                    summary: initialContent.substring(0, 200) || '',
                    content: initialContent,
                    category: 'Other',
                    url: ''
                });
                setInitialContent(null);
            }
        } else {
            // Reset form when modal closes
            setFormData({
                title: '',
                summary: '',
                content: '',
                category: 'Other',
                url: ''
            });
            setShowCategoryDropdown(false);
            setShowNewCategoryInput(false);
            setNewCategoryInput('');
            setEditingCard(null);
            setExtractedType('');
            if (initialContent) {
                setInitialContent(null);
            }
        }
    }, [showAddModal, editingCardData, initialContent, setEditingCard, setInitialContent]);

    const handleAddCategory = () => {
        if (newCategoryInput.trim() && !allCategories.includes(newCategoryInput.trim())) {
            setCustomCategories([...customCategories, newCategoryInput.trim()]);
            setFormData({ ...formData, category: newCategoryInput.trim() });
            setNewCategoryInput('');
            setShowNewCategoryInput(false);
            setShowCategoryDropdown(false);
        }
    };

    const handleExtract = async (type: string) => {
        setExtractedType(type);
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { action: 'extractContent', type }, (response) => {
                    if (response && response.content) {
                        setFormData(prev => ({
                            ...prev,
                            title: response.title || prev.title,
                            content: response.content || prev.content,
                            summary: response.content?.substring(0, 200) || prev.summary,
                            url: response.url || tab.url || prev.url
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('Failed to extract content:', error);
        }
    };

    const handleSave = () => {
        if (!formData.title.trim()) {
            alert('请输入标题');
            return;
        }

        if (editingCardData) {
            // Update existing card
            updateCard(editingCardData.id, {
                title: formData.title,
                summary: formData.summary || formData.content.substring(0, 200),
                content: formData.content,
                url: formData.url,
                category: formData.category
            });
        } else {
            // Create new card
            const colorIndex = cards.length % CARD_COLORS.length;

            const newCard: KnowledgeCard = {
                id: Date.now().toString(),
                title: formData.title,
                summary: formData.summary || formData.content.substring(0, 200),
                content: formData.content,
                url: formData.url,
                tags: [], // Empty tags since we use categories
                category: formData.category,
                color: CARD_COLORS[colorIndex],
                timestamp: Date.now()
            };

            addCard(newCard);
        }

        setShowAddModal(false);
    };

    if (!showAddModal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        {editingCardData ? '编辑知识卡片' : '添加知识卡片'}
                    </h2>
                    <button onClick={() => setShowAddModal(false)}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Extract Section - Only show when adding new card, not editing */}
                    {!editingCardData && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">提取内容</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => handleExtract('selection')}
                                    className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex flex-col items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Selection
                                </button>
                                <button
                                    onClick={() => handleExtract('webpage')}
                                    className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex flex-col items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                    Webpage
                                </button>
                                <button
                                    onClick={() => handleExtract('video')}
                                    className="px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors flex flex-col items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Video
                                </button>
                            </div>
                            {extractedType && (
                                <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                                    已提取 {extractedType} 内容
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">标题 *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="输入卡片标题..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">摘要</label>
                        <textarea
                            value={formData.summary}
                            onChange={(e) => setFormData({...formData, summary: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            rows={2}
                            placeholder="简短描述..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">内容</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            rows={6}
                            placeholder="详细内容..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">URL</label>
                        <input
                            type="url"
                            value={formData.url}
                            onChange={(e) => setFormData({...formData, url: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="https://..."
                        />
                    </div>

                    {/* Category Section */}
                    <div>
                        <label className="block text-sm font-medium mb-1">分类</label>

                        <div className="relative">
                            <button
                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                className="w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between hover:bg-gray-50"
                            >
                                <span>{formData.category}</span>
                                <span className="text-gray-400">▼</span>
                            </button>

                            {showCategoryDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                    {allCategories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => {
                                                setFormData({ ...formData, category: cat });
                                                setShowCategoryDropdown(false);
                                            }}
                                            className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors"
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => {
                                            setShowNewCategoryInput(true);
                                            setShowCategoryDropdown(false);
                                        }}
                                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 text-emerald-600 font-medium flex items-center gap-1 border-t"
                                    >
                                        <Plus className="w-3 h-3" />
                                        添加新分类
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* New Category Input */}
                        {showNewCategoryInput && (
                            <div className="mt-2 flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryInput}
                                    onChange={(e) => setNewCategoryInput(e.target.value)}
                                    placeholder="新分类名称"
                                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                                    autoFocus
                                />
                                <button
                                    onClick={handleAddCategory}
                                    className="px-3 py-2 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors"
                                >
                                    确定
                                </button>
                                <button
                                    onClick={() => {
                                        setShowNewCategoryInput(false);
                                        setNewCategoryInput('');
                                    }}
                                    className="px-3 py-2 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    取消
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-emerald-600 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {editingCardData ? '保存更改' : '保存'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};