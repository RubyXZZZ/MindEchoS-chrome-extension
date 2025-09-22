import React, { useState } from 'react';
import { X, Sparkles, Globe, FileText, Video } from 'lucide-react';
import { useStore } from '../../store';
import { KnowledgeCard } from '../../types/card.types';
import { CARD_COLORS } from '../../utils/constants';

export const AddCardModal: React.FC = () => {
    const { showAddModal, setShowAddModal, addCard, cards } = useStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [url, setUrl] = useState('');
    const [tags, setTags] = useState('');
    const [category, setCategory] = useState('Technology');
    const [source, setSource] = useState<'manual' | 'webpage' | 'selection' | 'video'>('manual');

    if (!showAddModal) return null;

    const handleSubmit = () => {
        if (!title.trim() || !content.trim()) return;

        const newCard: KnowledgeCard = {
            id: Date.now().toString(),
            title,
            summary: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            content,
            url: url || 'https://example.com',
            timestamp: Date.now(),
            priority: 3,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
            category,
            color: CARD_COLORS[cards.length % CARD_COLORS.length],
            source,
        };

        addCard(newCard);
        handleClose();
    };

    const handleClose = () => {
        setShowAddModal(false);
        setTitle('');
        setContent('');
        setUrl('');
        setTags('');
        setCategory('Technology');
        setSource('manual');
    };

    const handleCapture = async () => {
        // Placeholder for capture functionality
        if (source === 'webpage') {
            // Will implement: Capture current tab content
            console.log('Capturing webpage content...');
            // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            //   // Capture logic here
            // });
        } else if (source === 'selection') {
            // Will implement: Get selected text from page
            console.log('Getting selected text...');
            // chrome.tabs.executeScript({ code: 'window.getSelection().toString()' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-5 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">添加知识卡片</h3>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Source Selection */}
                <div className="mb-4">
                    <label className="text-sm text-gray-700 block mb-2">内容来源</label>
                    <div className="grid grid-cols-4 gap-2">
                        <button
                            onClick={() => setSource('manual')}
                            className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                                source === 'manual'
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <FileText className="w-4 h-4 mb-1" />
                            <span className="text-xs">手动</span>
                        </button>
                        <button
                            onClick={() => setSource('webpage')}
                            className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                                source === 'webpage'
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Globe className="w-4 h-4 mb-1" />
                            <span className="text-xs">网页</span>
                        </button>
                        <button
                            onClick={() => setSource('selection')}
                            className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                                source === 'selection'
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <FileText className="w-4 h-4 mb-1" />
                            <span className="text-xs">选中</span>
                        </button>
                        <button
                            onClick={() => setSource('video')}
                            className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                                source === 'video'
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Video className="w-4 h-4 mb-1" />
                            <span className="text-xs">视频</span>
                        </button>
                    </div>
                </div>

                {source !== 'manual' && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <button
                            onClick={handleCapture}
                            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                            {source === 'webpage' && '捕获当前页面'}
                            {source === 'selection' && '获取选中内容'}
                            {source === 'video' && '提取视频字幕'}
                        </button>
                    </div>
                )}

                <div className="space-y-3">
                    <div>
                        <label className="text-sm text-gray-700 block mb-1">标题</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            placeholder="输入卡片标题..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700 block mb-1">内容</label>
                        <textarea
                            className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                            placeholder="输入卡片内容..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700 block mb-1">URL（可选）</label>
                        <input
                            type="url"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700 block mb-1">标签（逗号分隔）</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            placeholder="React, TypeScript, Frontend"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700 block mb-1">分类</label>
                        <select
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="Technology">Technology</option>
                            <option value="Design">Design</option>
                            <option value="Business">Business</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim() || !content.trim()}
                        className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                            title.trim() && content.trim()
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <Sparkles className="w-3 h-3" />
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};
