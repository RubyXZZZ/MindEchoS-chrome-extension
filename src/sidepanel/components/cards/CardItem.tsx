import React, { useState } from 'react';
import { Clock, Link, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { KnowledgeCard } from '../../types/card.types';
import { useStore } from '../../store';
import { formatTime } from '../../utils/formatters';
import { MarkdownRenderer } from '../cards/MarkdownRenderer';
import { ConfirmDialog } from '../modals/ConfirmDialog';

interface CardItemProps {
    card: KnowledgeCard;
    isManageMode: boolean;
    isSelected: boolean;
    onSelect: (cardId: string) => void;
    isExpanded: boolean;
    onExpand: () => void;
    isOverlapping?: boolean;
}

export const CardItem: React.FC<CardItemProps> = ({
                                                      card,
                                                      isManageMode,
                                                      isSelected,
                                                      onSelect,
                                                      isExpanded,
                                                      onExpand,
                                                      isOverlapping = false
                                                  }) => {
    const { deleteCard, setEditingCard, setShowAddModal } = useStore();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        deleteCard(card.id);
        setShowDeleteConfirm(false);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCard(card.id);
        setShowAddModal(true);
    };

    const handleCardClick = () => {
        if (!isManageMode && isOverlapping) {
            onExpand();
        }
    };

    return (
        <div
            className={`
                ${card.color} 
                rounded-xl shadow-lg hover:shadow-xl transition-all border border-white/50 
                ${isExpanded ? 'shadow-2xl ring-2 ring-emerald-500/50 h-[400px]' : 'h-[180px]'} 
                ${isOverlapping && !isManageMode ? 'cursor-pointer' : ''}
                backdrop-blur-sm bg-opacity-90
            `}
            onClick={handleCardClick}
        >
            {/* 父容器 padding：左16 右8 上12 下4（收缩时更紧凑） */}
            <div className="pl-4 pr-2 pt-3 pb-1 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-2 flex-shrink-0">
                    <div className="flex items-start flex-1">
                        {isManageMode && (
                            <label className="flex items-center mt-1 mr-2">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onSelect(card.id);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                                />
                            </label>
                        )}
                        <h3 className="text-base text-gray-900 flex-1 leading-tight">
                            {card.title}
                        </h3>
                    </div>
                    <span className="px-2 py-0.5 bg-white/60 rounded-full text-gray-700 font-medium text-[10px] ml-2">
                        {card.category || 'Other'}
                    </span>
                </div>

                {/* Content Area */}
                {isExpanded ? (
                    // 展开状态：14px，紧凑行距
                    <div
                        className="flex-1 min-h-0 pt-2 border-t border-gray-200/50 overflow-y-auto pb-3 mb-2 custom-scrollbar -mr-1"
                        style={{ scrollbarGutter: 'stable' }}
                    >
                        <MarkdownRenderer
                            content={card.content}
                            className="text-sm leading-snug"
                        />
                    </div>
                ) : (
                    // 折叠状态：12px，紧凑型，增大底部间距
                    <p className="text-xs text-gray-700 line-clamp-3 leading-tight pr-2 mb-3">
                        {card.content}
                    </p>
                )}

                {/* Footer - 使用 mt-auto 固定在底部 */}
                <div className="flex items-center justify-between text-[10px] text-gray-600 flex-shrink-0 mt-auto">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {formatTime(card.timestamp)}
                        </span>
                        {card.url && (
                            <a
                                href={card.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-0.5 hover:text-blue-600"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Link className="w-3 h-3" />
                            </a>
                        )}
                    </div>

                    {!isManageMode && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleEdit}
                                className="p-1 hover:bg-white/50 rounded transition-colors"
                                title="编辑"
                            >
                                <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-1 hover:bg-white/50 rounded transition-colors"
                                title="删除"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                            {isOverlapping && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onExpand();
                                    }}
                                    className="p-1 hover:bg-white/50 rounded transition-colors"
                                    title={isExpanded ? "收起" : "展开"}
                                >
                                    {isExpanded ? (
                                        <ChevronUp className="w-3.5 h-3.5 text-gray-600" />
                                    ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 删除确认对话框 */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Card"
                message={`Delete this card? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
};
