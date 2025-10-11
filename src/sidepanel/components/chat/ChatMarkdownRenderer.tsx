// components/chat/ChatMarkdownRenderer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MoveHorizontal, X } from 'lucide-react';

interface CardReference {
    id: string;
    title: string;
    content: string;
    displayNumber: number;  // ← 添加 displayNumber
}

interface ChatMarkdownRendererProps {
    content: string;
    className?: string;
    cards?: CardReference[];
}

export const ChatMarkdownRenderer: React.FC<ChatMarkdownRendererProps> = ({
                                                                              content,
                                                                              className = '',
                                                                              cards = []
                                                                          }) => {
    const [clickedCard, setClickedCard] = useState<CardReference | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭 tooltip
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                const target = event.target as HTMLElement;
                if (!target.closest('.card-badge')) {
                    setClickedCard(null);
                }
            }
        };

        if (clickedCard) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [clickedCard]);

    const cleanedContent = content.trim();

    if (!cleanedContent) {
        return null;
    }

    const handleCardClick = (card: CardReference, e: React.MouseEvent) => {
        e.stopPropagation();

        if (clickedCard?.id === card.id) {
            setClickedCard(null);
            return;
        }

        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        let left = rect.left + rect.width / 2;
        let top = rect.bottom + 8;

        const tooltipWidth = 320;
        if (left + tooltipWidth / 2 > window.innerWidth) {
            left = window.innerWidth - tooltipWidth / 2 - 10;
        }
        if (left - tooltipWidth / 2 < 10) {
            left = tooltipWidth / 2 + 10;
        }

        const tooltipMaxHeight = 200;
        if (top + tooltipMaxHeight > window.innerHeight && rect.top > tooltipMaxHeight) {
            top = rect.top - 8;
        }

        setTooltipPosition({ x: left, y: top });
        setClickedCard(card);
    };

    const renderContent = (text: string): React.ReactNode => {
        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        let listItems: string[] = [];
        let listKey = 0;
        let inCodeBlock = false;
        let codeLines: string[] = [];
        let codeLanguage = '';
        let inTable = false;
        let tableRows: string[][] = [];
        let tableHeaders: string[] = [];
        let tableKey = 0;

        const flushList = () => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`list-${listKey++}`} className="list-disc pl-5 space-y-1 my-2">
                        {listItems.map((item, idx) => (
                            <li key={idx} className="break-words">
                                {renderInlineFormatting(item)}
                            </li>
                        ))}
                    </ul>
                );
                listItems = [];
            }
        };

        const flushCodeBlock = () => {
            if (codeLines.length > 0) {
                elements.push(
                    <pre key={`code-${elements.length}`} className="bg-gray-800 text-gray-100 rounded-lg p-3 my-2 overflow-x-auto">
                        <code className={`text-xs ${codeLanguage ? `language-${codeLanguage}` : ''}`}>
                            {codeLines.join('\n')}
                        </code>
                    </pre>
                );
                codeLines = [];
                codeLanguage = '';
            }
        };

        const flushTable = () => {
            if (tableHeaders.length > 0 && tableRows.length > 0) {
                elements.push(
                    <div key={`table-${tableKey++}`} className="my-3">
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                <tr>
                                    {tableHeaders.map((header, idx) => (
                                        <th
                                            key={idx}
                                            className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                        >
                                            {renderInlineFormatting(header.trim())}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {tableRows.map((row, rowIdx) => (
                                    <tr key={rowIdx} className="hover:bg-gray-50">
                                        {row.map((cell, cellIdx) => (
                                            <td
                                                key={cellIdx}
                                                className="px-3 py-2 text-xs text-gray-700 break-words"
                                            >
                                                {renderInlineFormatting(cell.trim())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-500 italic">
                            <MoveHorizontal className="w-3 h-3" />
                            <span>Drag to resize panel for better viewing</span>
                        </div>
                    </div>
                );
                tableHeaders = [];
                tableRows = [];
                inTable = false;
            }
        };

        const renderInlineFormatting = (text: string): React.ReactNode => {
            const parts: React.ReactNode[] = [];
            let lastIndex = 0;

            // 匹配 **粗体**、*斜体*、`代码`、URL、Card引用
            const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|(https?:\/\/[^\s<>"{}|\\^`\[\]]+)|(Card\s*#?(\d+)|Card\s+(\d+)))/gi;
            let match;

            while ((match = regex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(text.slice(lastIndex, match.index));
                }

                if (match[2]) {
                    parts.push(<strong key={match.index}>{match[2]}</strong>);
                } else if (match[3]) {
                    parts.push(<em key={match.index}>{match[3]}</em>);
                } else if (match[4]) {
                    parts.push(
                        <code key={match.index} className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-xs">
                            {match[4]}
                        </code>
                    );
                } else if (match[5]) {
                    parts.push(
                        <a
                            key={match.index}
                            href={match[5]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                            {match[5]}
                        </a>
                    );
                } else if (match[6]) {
                    // Card引用 - 轻微高亮但不可点击
                    parts.push(
                        <span
                            key={match.index}
                            className="inline-block text-emerald-700 font-medium"
                        >
                            {match[6]}
                        </span>
                    );
                }

                lastIndex = regex.lastIndex;
            }

            if (lastIndex < text.length) {
                parts.push(text.slice(lastIndex));
            }

            return parts.length > 0 ? parts : text;
        };

        const renderHeader = (level: number, content: string, index: number) => {
            const sizeClasses = {
                1: 'text-lg font-bold',
                2: 'text-base font-bold',
                3: 'text-sm font-semibold',
                4: 'text-sm font-medium',
                5: 'text-xs font-medium',
                6: 'text-xs font-normal',
            };

            const className = `${sizeClasses[level as keyof typeof sizeClasses] || 'text-sm font-medium'} mt-3 mb-2 break-words`;
            const formattedContent = renderInlineFormatting(content);

            switch (level) {
                case 1:
                    return <h1 key={index} className={className}>{formattedContent}</h1>;
                case 2:
                    return <h2 key={index} className={className}>{formattedContent}</h2>;
                case 3:
                    return <h3 key={index} className={className}>{formattedContent}</h3>;
                case 4:
                    return <h4 key={index} className={className}>{formattedContent}</h4>;
                case 5:
                    return <h5 key={index} className={className}>{formattedContent}</h5>;
                case 6:
                    return <h6 key={index} className={className}>{formattedContent}</h6>;
                default:
                    return <h3 key={index} className={className}>{formattedContent}</h3>;
            }
        };

        lines.forEach((line, index) => {
            if (line.trim().startsWith('```')) {
                if (inCodeBlock) {
                    flushCodeBlock();
                    inCodeBlock = false;
                } else {
                    flushList();
                    flushTable();
                    inCodeBlock = true;
                    codeLanguage = line.trim().slice(3).trim();
                }
                return;
            }

            if (inCodeBlock) {
                codeLines.push(line);
                return;
            }

            const trimmedLine = line.trim();

            const tableRowMatch = trimmedLine.match(/^\|(.+)\|$/);
            if (tableRowMatch) {
                if (/^\|[\s|:-]+\|$/.test(trimmedLine)) {
                    return;
                }

                flushList();
                const cells = tableRowMatch[1].split('|').map(c => c.trim());

                if (!inTable) {
                    tableHeaders = cells;
                    inTable = true;
                } else {
                    tableRows.push(cells);
                }
                return;
            } else if (inTable) {
                flushTable();
            }

            if (!trimmedLine) {
                flushList();
                return;
            }

            const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
                flushList();
                const level = headerMatch[1].length;
                elements.push(renderHeader(level, headerMatch[2], index));
                return;
            }

            const listMatch = trimmedLine.match(/^[*\-•]\s+(.+)$/);
            if (listMatch) {
                listItems.push(listMatch[1]);
                return;
            }

            const numberedMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
            if (numberedMatch) {
                flushList();
                elements.push(
                    <p key={index} className="mb-2 break-words">
                        {renderInlineFormatting(trimmedLine)}
                    </p>
                );
                return;
            }

            flushList();
            elements.push(
                <p key={index} className="mb-2 last:mb-0 break-words">
                    {renderInlineFormatting(trimmedLine)}
                </p>
            );
        });

        flushList();
        flushCodeBlock();
        flushTable();

        return elements.length > 0 ? elements : cleanedContent;
    };

    return (
        <>
            {/* Card References Bar - 使用 displayNumber */}
            {cards.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-2 pb-2 border-b border-gray-100">
                    <span className="text-[10px] text-gray-500 font-medium">Context:</span>
                    {cards.map((card) => {
                        const isActive = clickedCard?.id === card.id;

                        return (
                            <button
                                key={card.id}
                                onClick={(e) => handleCardClick(card, e)}
                                className={`card-badge px-2 py-0.5 rounded text-[11px] font-medium border transition-all cursor-help ${
                                    isActive
                                        ? 'bg-gray-700 text-white border-gray-800'
                                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                                }`}
                            >
                                Card {card.displayNumber}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Content */}
            <div className={`chat-markdown whitespace-pre-wrap break-words overflow-wrap-anywhere ${className}`}>
                {renderContent(cleanedContent)}
            </div>

            {/* Card Tooltip */}
            {clickedCard && (
                <div
                    ref={tooltipRef}
                    className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-emerald-300 w-80 max-h-48 overflow-hidden"
                    style={{
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`,
                        transform: tooltipPosition.y < 100 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
                    }}
                >
                    <div className="flex items-center justify-between bg-emerald-50 px-3 py-2 border-b border-emerald-200">
                        <div className="text-xs font-semibold text-emerald-900">
                            #{clickedCard.displayNumber} {clickedCard.title}
                        </div>
                        <button
                            onClick={() => setClickedCard(null)}
                            className="text-emerald-600 hover:text-emerald-800"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="p-3 overflow-y-auto max-h-40">
                        <div className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                            {clickedCard.content}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};