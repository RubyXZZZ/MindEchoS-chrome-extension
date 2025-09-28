import React, { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { useStore } from '../../store';
import { KnowledgeCard } from '../../types/card.types';
import { CARD_COLORS, DEFAULT_CATEGORY, ALL_CARDS_FILTER } from '../../utils/constants';

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
        userCategories,
        addCategory,
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

    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryInput, setNewCategoryInput] = useState('');

    const assignableCategories = [...new Set(userCategories), DEFAULT_CATEGORY];

    useEffect(() => {
        if (showAddModal) {
            if (editingCardData) {
                setFormData({
                    title: editingCardData.title,
                    content: editingCardData.content,
                    category: editingCardData.category || DEFAULT_CATEGORY,
                    url: editingCardData.url || ''
                });
            } else {
                let initialCategory = DEFAULT_CATEGORY;
                if (selectedCategory !== ALL_CARDS_FILTER && assignableCategories.includes(selectedCategory)) {
                    initialCategory = selectedCategory;
                }
                setFormData({
                    title: '',
                    content: initialSelection?.text || '',
                    category: initialCategory,
                    url: initialSelection?.url || ''
                });
            }
        } else {
            setEditingCard(null);
            setInitialSelection(null);
            setShowNewCategoryInput(false);
            setNewCategoryInput('');
            setFormData({ title: '', content: '', category: DEFAULT_CATEGORY, url: '' });
        }
    }, [showAddModal, editingCardData, initialSelection, selectedCategory, setEditingCard, setInitialSelection]);

    const handleAddCategory = async () => {
        const trimmedCategory = newCategoryInput.trim();
        if (trimmedCategory) {
            await addCategory(trimmedCategory);
            setFormData({ ...formData, category: trimmedCategory });
            setNewCategoryInput('');
            setShowNewCategoryInput(false);
        }
    };

    const handleExtract = () => {
        alert('开发中');
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

    if (!showAddModal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-semibold">{isEditing ? '编辑知识卡片' : '添加知识卡片'}</h2>
                    <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5" /></button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-grow">
                    {!isEditing && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">提取内容</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={handleExtract} className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">Selection</button>
                                <button onClick={handleExtract} className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600">Webpage</button>
                                <button onClick={handleExtract} className="px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600">Video</button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">标题</label>
                        <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="输入卡片标题..." />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">内容</label>
                        <textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" rows={8} placeholder="详细内容..." />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">URL</label>
                        <input type="url" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://..." />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">分类</label>
                        <div className="flex gap-2">
                            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="flex-grow w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                {assignableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            {!showNewCategoryInput && (
                                <button onClick={() => setShowNewCategoryInput(true)} className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"><Plus className="w-4 h-4" /></button>
                            )}
                        </div>
                        {showNewCategoryInput && (
                            <div className="mt-2 flex gap-2">
                                <input type="text" value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} placeholder="新分类名称" className="flex-1 px-3 py-2 border rounded-lg text-sm" onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()} autoFocus />
                                <button onClick={handleAddCategory} className="px-3 py-2 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600">添加</button>
                                <button onClick={() => setShowNewCategoryInput(false)} className="px-3 py-2 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300">取消</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end gap-2 flex-shrink-0">
                    <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-emerald-600">
                        <Save className="w-4 h-4" />
                        {isEditing ? '保存更改' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
};
