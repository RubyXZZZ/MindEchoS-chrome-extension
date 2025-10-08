import React, { useState } from 'react';
import { Link, Trash2, Edit2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { KnowledgeCard } from '../../types/card.types';
import { useStore } from '../../store';
import { formatCardDate } from '../../utils/formatters';
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
    const { deleteCard, setEditingCard, setShowAddModal, showCardNumbers } = useStore();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [copied, setCopied] = useState(false);

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

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(card.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleCardClick = () => {
        // Prevent collapse when user is selecting text
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            return;
        }

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
                backdrop-blur-sm bg-opacity-90 relative
            `}
            onClick={handleCardClick}
        >
            {/* Card Number Badge - Middle of visible area when overlapped (title area) */}
            {showCardNumbers && (
                <div className="absolute -left-[12px] top-[25px] bg-gray-200/85 text-gray-600 px-1 py-0.5 text-[9px] font-mono font-medium shadow-sm z-10 rounded-r-sm border-r border-gray-300/30">
                    {String(card.displayNumber).padStart(2, '0')}
                </div>
            )}

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
                    <p className="text-xs text-gray-700 line-clamp-3 leading-tight pr-2 mb-3">
                        {card.content}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-600 flex-shrink-0 mt-auto">
                    <div className="flex items-center gap-2">
                        <span>
                            {formatCardDate(card.timestamp)}
                        </span>
                        {card.url && (
                            <a
                                href={card.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-0.5 hover:text-blue-600 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                title="Open URL"
                            >
                                <Link className="w-3 h-3" />
                            </a>
                        )}
                    </div>

                    {!isManageMode && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleCopy}
                                className={`p-1 rounded transition-colors ${
                                    copied
                                        ? 'bg-green-100 text-green-600'
                                        : 'hover:bg-white/50 text-gray-600'
                                }`}
                                title={copied ? 'Copied!' : 'Copy content'}
                            >
                                {copied ? (
                                    <Check className="w-3.5 h-3.5" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                )}
                            </button>
                            <button
                                onClick={handleEdit}
                                className="p-1 hover:bg-white/50 rounded transition-colors"
                                title="Edit"
                            >
                                <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-1 hover:bg-white/50 rounded transition-colors"
                                title="Delete"
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
                                    title={isExpanded ? "Collapse" : "Expand"}
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

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Card"
                message="Delete this card? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
};