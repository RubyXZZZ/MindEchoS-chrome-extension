import React, { useState } from 'react';
import { Clock, Link2, Edit2, Trash2, Save, X, GripVertical } from 'lucide-react';
import { KnowledgeCard } from '../../types/card.types';
import { formatDate, getHostname } from '../../utils/formatters';
import { useStore } from '../../store';

interface CardItemProps {
    card: KnowledgeCard;
    index: number;
    isDragOver: boolean;
    onDragStart: (e: React.DragEvent, cardId: string) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    isLastVisible?: boolean;
}

export const CardItem: React.FC<CardItemProps> = ({
                                                      card,
                                                      index,
                                                      isDragOver,
                                                      onDragStart,
                                                      onDragOver,
                                                      onDrop,
                                                      isLastVisible = false,
                                                  }) => {
    const {
        expandedCard,
        setExpandedCard,
        editingCard,
        setEditingCard,
        updateCard,
        deleteCard
    } = useStore();

    const [editContent, setEditContent] = useState('');
    const [additionalContent, setAdditionalContent] = useState('');
    const [hoveredCard, setHoveredCard] = useState(false);

    const isExpanded = expandedCard === card.id;
    const isEditing = editingCard === card.id;

    const handleEditSave = () => {
        let newContent = editContent;
        if (additionalContent.trim()) {
            newContent += '\n\n' + additionalContent.trim();
        }
        const newSummary = newContent.substring(0, 100) + (newContent.length > 100 ? '...' : '');

        updateCard(card.id, {
            content: newContent,
            summary: newSummary
        });

        setEditingCard(null);
        setEditContent('');
        setAdditionalContent('');
    };

    const handleDelete = () => {
        if (window.confirm('确定要删除这张卡片吗？')) {
            deleteCard(card.id);
            setExpandedCard(null);
        }
    };

    const handleCardClick = () => {
        if (!isEditing) {
            setExpandedCard(isExpanded ? null : card.id);
        }
    };

    const handleEditStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCard(card.id);
        setEditContent(card.content);
    };

    return (
        <div
            className={`transition-all duration-500 cursor-pointer ${
                isDragOver ? 'opacity-50' : ''
            } ${hoveredCard && !isExpanded ? 'transform -translate-y-0.5' : ''}`}
            draggable={!isExpanded && !isEditing}
            onDragStart={(e) => onDragStart(e, card.id)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
            onMouseEnter={() => setHoveredCard(true)}
            onMouseLeave={() => setHoveredCard(false)}
            onClick={handleCardClick}
        >
            <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all ${
                isExpanded ? 'shadow-2xl' : 'shadow-lg hover:shadow-xl'
            }`}>
                {/* Card Header */}
                <div className={`${card.color} ${isExpanded ? 'p-4' : 'p-3'} transition-all`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            {!isExpanded && !isEditing && (
                                <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                            )}
                            <h3 className={`font-semibold text-gray-800 flex-1 ${
                                isExpanded ? 'text-base' : 'text-sm'
                            }`}>
                                {card.title}
                            </h3>
                        </div>

                        {isExpanded && (
                            <div className="flex items-center gap-1">
                                {!isEditing ? (
                                    <>
                                        <button
                                            onClick={handleEditStart}
                                            className="p-1 hover:bg-white/30 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete();
                                            }}
                                            className="p-1 hover:bg-white/30 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditSave();
                                        }}
                                        className="p-1 hover:bg-white/30 rounded-lg transition-colors"
                                    >
                                        <Save className="w-4 h-4 text-green-600" />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedCard(null);
                                        setEditingCard(null);
                                    }}
                                    className="p-1 hover:bg-white/30 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {card.tags.slice(0, isExpanded ? card.tags.length : 3).map(tag => (
                            <span key={tag} className={`px-2 py-0.5 bg-white/50 text-gray-700 rounded-full ${
                                isExpanded ? 'text-xs' : 'text-[10px]'
                            }`}>
                {tag}
              </span>
                        ))}
                        {!isExpanded && card.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-white/40 text-gray-600 text-[10px] rounded-full">
                +{card.tags.length - 3}
              </span>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                {!isExpanded && (
                    <div className={`bg-white/80 ${isLastVisible ? 'p-4' : 'px-3 pb-2'}`}>
                        <p className={`text-gray-600 ${
                            isLastVisible ? 'text-sm leading-relaxed whitespace-pre-wrap' : 'text-xs line-clamp-2'
                        }`}>
                            {isLastVisible ? card.content : card.summary}
                        </p>

                        {isLastVisible && (
                            <div className="bg-gray-50 rounded-lg p-3 mt-4">
                                <div className="flex items-center justify-between text-xs text-gray-600">
                                    <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                        {formatDate(card.timestamp)}
                    </span>
                                        <span className="text-gray-400">•</span>
                                        <span className="truncate max-w-[150px]">
                      {getHostname(card.url)}
                    </span>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(card.url, '_blank');
                                        }}
                                        className="px-2 py-1 hover:bg-white rounded-md transition-colors flex items-center gap-1"
                                    >
                                        <Link2 className="w-3 h-3 text-gray-500" />
                                        <span className="text-xs text-gray-500">访问</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="p-4 bg-white">
                        {!isEditing ? (
                            <>
                                <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                                    {card.content}
                                </p>

                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                        <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                          {formatDate(card.timestamp)}
                      </span>
                                            <span className="text-gray-400">•</span>
                                            <span className="truncate max-w-[150px]">
                        {getHostname(card.url)}
                      </span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(card.url, '_blank');
                                            }}
                                            className="px-2 py-1 hover:bg-white rounded-md transition-colors flex items-center gap-1"
                                        >
                                            <Link2 className="w-3 h-3 text-gray-500" />
                                            <span className="text-xs text-gray-500">访问</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-600 block mb-1">编辑原内容</label>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                                        rows={4}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-600 block mb-1">添加新内容（另起一段）</label>
                                    <textarea
                                        value={additionalContent}
                                        onChange={(e) => setAdditionalContent(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        placeholder="在此添加新段落..."
                                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingCard(null);
                                            setEditContent('');
                                            setAdditionalContent('');
                                        }}
                                        className="flex-1 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditSave();
                                        }}
                                        className="flex-1 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600"
                                    >
                                        保存
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};