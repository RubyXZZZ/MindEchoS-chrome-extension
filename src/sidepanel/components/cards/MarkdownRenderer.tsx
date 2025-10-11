// markdown for card

import React from 'react';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    const renderContent = (text: string): React.ReactNode => {
        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        let listItems: string[] = [];
        let listKey = 0;

        const flushList = () => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1 my-2">
                        {listItems.map((item, idx) => (
                            <li key={idx}>
                                {cleanText(item)}
                            </li>
                        ))}
                    </ul>
                );
                listItems = [];
            }
        };

        // delete unneeded markdown symbols
        const cleanText = (str: string): string => {
            return str
                .replace(/\*\*/g, '')  // 去除粗体符号 **
                .replace(/\*/g, '')    // 去除斜体符号 *
                .replace(/`/g, '')     // 去除代码符号 `
                .replace(/^#+\s+/, ''); // 去除标题符号 #
        };

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();

            // empty line
            if (!trimmedLine) {
                flushList();
                return;
            }

            // bullet list (* - •)
            const listMatch = trimmedLine.match(/^[*\-•]\s+(.+)$/);
            if (listMatch) {
                listItems.push(listMatch[1]);
                return;
            }

            // regular paragraph
            flushList();
            elements.push(
                <p key={index} className="mb-2">
                    {cleanText(trimmedLine)}
                </p>
            );
        });

        // flush any remaining list
        flushList();

        return elements.length > 0 ? elements : text;
    };

    return (
        <div className={`markdown-content ${className}`}>
            {renderContent(content)}
        </div>
    );
};