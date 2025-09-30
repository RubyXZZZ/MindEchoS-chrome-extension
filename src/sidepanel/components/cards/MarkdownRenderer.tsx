// components/common/MarkdownRenderer.tsx
// 极简 Markdown 渲染器 - 只处理列表项

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
                            <li key={idx} className="text-gray-700">
                                {cleanText(item)}
                            </li>
                        ))}
                    </ul>
                );
                listItems = [];
            }
        };

        // 清理文本中的 markdown 符号
        const cleanText = (str: string): string => {
            return str
                .replace(/\*\*/g, '')  // 去除粗体符号 **
                .replace(/\*/g, '')    // 去除斜体符号 *
                .replace(/`/g, '')     // 去除代码符号 `
                .replace(/^#+\s+/, ''); // 去除标题符号 #
        };

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();

            // 空行
            if (!trimmedLine) {
                flushList();
                return;
            }

            // 列表项 (* - •)
            const listMatch = trimmedLine.match(/^[\*\-•]\s+(.+)$/);
            if (listMatch) {
                listItems.push(listMatch[1]);
                return;
            }

            // 普通段落
            flushList();
            elements.push(
                <p key={index} className="text-gray-700 mb-2">
                    {cleanText(trimmedLine)}
                </p>
            );
        });

        // 处理最后可能存在的列表
        flushList();

        return elements.length > 0 ? elements : text;
    };

    return (
        <div className={`markdown-content ${className}`}>
            {renderContent(content)}
        </div>
    );
};