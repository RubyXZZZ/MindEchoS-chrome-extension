import React from 'react';
import { Clock, Link, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { KnowledgeCard } from '../../types/card.types';
import { useStore } from '../../store';
import { formatTime } from '../../utils/formatters';

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

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('确定要删除这张卡片吗？')) {
            deleteCard(card.id);
        }
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
                ${isExpanded ? 'shadow-2xl ring-2 ring-emerald-500/50 h-[300px]' : 'h-[180px]'} 
                ${isOverlapping && !isManageMode ? 'cursor-pointer' : ''}
                backdrop-blur-sm bg-opacity-90 flex flex-col
            `}
            onClick={handleCardClick}
        >
            <div className="p-4 flex-grow flex flex-col overflow-hidden">
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
                        <h3 className="text-sm font-semibold text-gray-900 flex-1">
                            {card.title}
                        </h3>
                    </div>
                    <span className="px-2 py-0.5 bg-white/60 rounded-full text-gray-700 font-medium text-[10px] ml-2">
                        {card.category || 'Other'}
                    </span>
                </div>

                {/* Content Area: Switches between preview and full view */}
                <div className="flex-grow overflow-hidden">
                    {isExpanded ? (
                        // Expanded view: Full, scrollable content
                        <div className="mt-3 pt-3 border-t border-gray-200/50 h-full">
                            <div className="text-xs text-gray-700 whitespace-pre-wrap h-full overflow-y-auto pr-2">
                                {card.content}
                            </div>
                        </div>
                    ) : (
                        // Collapsed view: Truncated preview
                        <p className="text-xs text-gray-700 line-clamp-3">
                            {card.content}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-600 mt-3 flex-shrink-0">
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
        </div>
    );
};