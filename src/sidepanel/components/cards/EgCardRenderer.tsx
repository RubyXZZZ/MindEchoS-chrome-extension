// components/common/EnhancedMarkdownRenderer.tsx
// Enhanced Markdown renderer for Example Card with better structure

import React from 'react';

interface EgCardRendererProps {
    content: string;
    className?: string;
}

export const EgCardRenderer: React.FC<EgCardRendererProps> = ({
                                                                                      content,
                                                                                      className = ''
                                                                                  }) => {
    const renderInlineMarkdown = (text: string): React.ReactNode => {
        const parts: React.ReactNode[] = [];
        let remaining = text;
        let key = 0;

        while (remaining.length > 0) {
            // Bold (**text**)
            const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/);
            if (boldMatch) {
                if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
                parts.push(<strong key={key++} className="font-semibold text-gray-900">{boldMatch[2]}</strong>);
                remaining = remaining.slice(boldMatch[0].length);
                continue;
            }

            // Code (`text`)
            const codeMatch = remaining.match(/^(.*?)`(.+?)`/);
            if (codeMatch) {
                if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>);
                parts.push(
                    <code key={key++} className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded font-mono">
                        {codeMatch[2]}
                    </code>
                );
                remaining = remaining.slice(codeMatch[0].length);
                continue;
            }

            // No more markdown
            parts.push(<span key={key++}>{remaining}</span>);
            break;
        }

        return parts;
    };

    const renderContent = (): React.ReactNode => {
        const lines = content.split('\n');
        const elements: React.ReactNode[] = [];
        let currentList: string[] = [];
        let currentIndentedList: string[] = [];
        let listKey = 0;

        const flushList = () => {
            if (currentIndentedList.length > 0) {
                // Flush indented list first
                elements.push(
                    <ul key={`list-indent-${listKey++}`} className="list-disc list-inside space-y-1 my-1 pl-6">
                        {currentIndentedList.map((item, idx) => (
                            <li key={idx}>
                                {renderInlineMarkdown(item)}
                            </li>
                        ))}
                    </ul>
                );
                currentIndentedList = [];
            }

            if (currentList.length > 0) {
                elements.push(
                    <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1 my-2">
                        {currentList.map((item, idx) => (
                            <li key={idx}>
                                {renderInlineMarkdown(item)}
                            </li>
                        ))}
                    </ul>
                );
                currentList = [];
            }
        };

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // Empty line
            if (!trimmed) {
                flushList();
                return;
            }

            // Horizontal rule
            if (trimmed === '---') {
                flushList();
                elements.push(<hr key={index} className="my-3 border-t border-gray-200" />);
                return;
            }

            // Heading (##)
            const headingMatch = trimmed.match(/^##\s+(.+)$/);
            if (headingMatch) {
                flushList();
                elements.push(
                    <h3 key={index} className="font-bold text-gray-900 mt-3 mb-2 first:mt-0">
                        {renderInlineMarkdown(headingMatch[1])}
                    </h3>
                );
                return;
            }

            // List item (- or •)
            const listMatch = trimmed.match(/^[-•]\s+(.+)$/);
            if (listMatch) {
                currentList.push(listMatch[1]);
                return;
            }

            // Regular paragraph (including emoji tips)
            flushList();
            elements.push(
                <p key={index} className="mb-2">
                    {renderInlineMarkdown(trimmed)}
                </p>
            );
        });

        // Flush any remaining list
        flushList();

        return elements;
    };

    return (
        <div className={`enhanced-markdown ${className}`}>
            {renderContent()}
        </div>
    );
};