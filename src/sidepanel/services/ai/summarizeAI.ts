// services/ai/summarizeAI.ts
// Chrome Summarizer API 实现 (Chrome 138+)
// 基于官方文档：https://developer.chrome.com/docs/ai/summarizer-api

import type {
    SummarizerOptions,
    SummarizerInstance,
    SummarizeResult
} from '../../types/ai.types';

export class SummarizeAI {
    private static instance: SummarizeAI | null = null;

    private constructor() {}

    static getInstance(): SummarizeAI {
        if (!SummarizeAI.instance) {
            SummarizeAI.instance = new SummarizeAI();
        }
        return SummarizeAI.instance;
    }

    /**
     * 检查 Summarizer API 是否可用
     */
    async checkAvailability(): Promise<'readily' | 'after-download' | 'no'> {
        try {
            if (!('Summarizer' in self)) {
                console.warn('[SummarizeAI] Summarizer API not supported');
                return 'no';
            }

            const availability = await Summarizer.availability();
            console.log('[SummarizeAI] Availability:', availability);
            return availability;
        } catch (error) {
            console.error('[SummarizeAI] Error checking availability:', error);
            return 'no';
        }
    }

    /**
     * 创建 summarizer 实例
     */
    private async createSummarizer(options: SummarizerOptions): Promise<SummarizerInstance | null> {
        try {
            const availability = await this.checkAvailability();

            if (availability === 'no') {
                console.warn('[SummarizeAI] API not available');
                return null;
            }

            if (availability === 'after-download') {
                console.log('[SummarizeAI] Model download may be required...');
            }

            const optionsWithMonitor: SummarizerOptions = {
                ...options,
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        const percent = Math.round(e.loaded * 100);
                        console.log(`[SummarizeAI] Downloaded ${percent}%`);
                    });
                }
            };

            console.log('[SummarizeAI] Creating summarizer with options:', options);
            const summarizer = await Summarizer.create(optionsWithMonitor);
            console.log('[SummarizeAI] Summarizer created successfully');
            return summarizer;
        } catch (error) {
            console.error('[SummarizeAI] Failed to create summarizer:', error);
            return null;
        }
    }

    /**
     * 根据文本长度决定总结长度
     */
    private getContentLength(textLength: number): 'short' | 'medium' | 'long' {
        if (textLength <= 500) return 'short';
        if (textLength <= 2000) return 'medium';
        return 'long';
    }

    /**
     * 流式总结选中的文本
     */
    async summarizeSelectionStreaming(
        text: string,
        _url: string,
        onTitleChunk: (chunk: string) => void,
        onContentChunk: (chunk: string) => void
    ): Promise<SummarizeResult> {
        if (!text || text.length < 10) {
            return {
                success: false,
                error: '文本太短，无法总结'
            };
        }

        console.log('[SummarizeAI] Starting STREAMING summarization, text length:', text.length);

        // 生成标题（流式）
        let title = '';
        const titleSummarizer = await this.createSummarizer({
            type: 'headline',
            format: 'plain-text',
            length: 'short'
        });

        if (titleSummarizer) {
            try {
                console.log('[SummarizeAI] Streaming title generation...');
                const stream = titleSummarizer.summarizeStreaming(text);

                for await (const chunk of stream) {
                    title += chunk;
                    onTitleChunk(title);
                }

                console.log('[SummarizeAI] Title streaming completed:', title);
                titleSummarizer.destroy();
            } catch (error) {
                console.error('[SummarizeAI] Title streaming failed:', error);
                title = text.substring(0, 50) + '...';
                onTitleChunk(title);
                titleSummarizer.destroy();
            }
        } else {
            title = text.substring(0, 50) + '...';
            onTitleChunk(title);
        }

        // 生成内容总结（流式）
        const contentLength = this.getContentLength(text.length);
        console.log('[SummarizeAI] Streaming content generation, length:', contentLength);

        const contentSummarizer = await this.createSummarizer({
            type: 'key-points',
            format: 'markdown',
            length: contentLength
        });

        if (contentSummarizer) {
            try {
                let content = '';
                const stream = contentSummarizer.summarizeStreaming(text);

                for await (const chunk of stream) {
                    content += chunk;
                    onContentChunk(content);
                }

                console.log('[SummarizeAI] Content streaming completed, length:', content.length);
                contentSummarizer.destroy();

                return {
                    success: true,
                    title: title,
                    content: content
                };
            } catch (error) {
                console.error('[SummarizeAI] Content streaming failed:', error);
                contentSummarizer.destroy();
            }
        }

        // 降级处理
        console.log('[SummarizeAI] Using fallback for content');
        const fallbackContent = text.substring(0, 500) + (text.length > 500 ? '...' : '');
        onContentChunk(fallbackContent);

        return {
            success: true,
            title: title || text.substring(0, 50) + '...',
            content: fallbackContent
        };
    }

    /**
     * 流式总结网页内容
     */
    async summarizeWebpageStreaming(
        pageContent: {
            title: string;
            content: string;
            url: string;
        },
        onTitleChunk: (chunk: string) => void,
        onContentChunk: (chunk: string) => void
    ): Promise<SummarizeResult> {
        if (!pageContent.content || pageContent.content.length < 10) {
            return {
                success: false,
                error: '网页内容太少，无法总结'
            };
        }

        console.log('[SummarizeAI] Starting STREAMING webpage summarization, content length:', pageContent.content.length);

        // 生成更好的标题（流式）- 从空字符串开始
        let betterTitle = '';
        const titleSummarizer = await this.createSummarizer({
            type: 'headline',
            format: 'plain-text',
            length: 'short'
        });

        if (titleSummarizer) {
            try {
                console.log('[SummarizeAI] Streaming webpage title generation...');
                const stream = titleSummarizer.summarizeStreaming(pageContent.content);

                for await (const chunk of stream) {
                    betterTitle += chunk;
                    onTitleChunk(betterTitle);
                }

                console.log('[SummarizeAI] Webpage title streaming completed:', betterTitle);
                titleSummarizer.destroy();
            } catch (error) {
                console.error('[SummarizeAI] Webpage title streaming failed:', error);
                betterTitle = pageContent.title;
                onTitleChunk(betterTitle);
                titleSummarizer.destroy();
            }
        } else {
            betterTitle = pageContent.title;
            onTitleChunk(betterTitle);
        }

        // 生成内容总结（流式）
        const contentLength = this.getContentLength(pageContent.content.length);
        console.log('[SummarizeAI] Streaming webpage content generation, length:', contentLength);

        const contentSummarizer = await this.createSummarizer({
            type: 'key-points',
            format: 'markdown',
            length: contentLength,
            sharedContext: 'This is a webpage content'
        });

        if (contentSummarizer) {
            try {
                let summary = '';
                const stream = contentSummarizer.summarizeStreaming(pageContent.content, {
                    context: `From webpage: ${pageContent.url}`
                });

                for await (const chunk of stream) {
                    summary += chunk;
                    onContentChunk(summary);
                }

                console.log('[SummarizeAI] Webpage content streaming completed, length:', summary.length);
                contentSummarizer.destroy();

                return {
                    success: true,
                    title: betterTitle,
                    content: summary
                };
            } catch (error) {
                console.error('[SummarizeAI] Webpage content streaming failed:', error);
                contentSummarizer.destroy();
            }
        }

        // 降级处理
        console.log('[SummarizeAI] Using fallback for webpage content');
        const fallbackContent = pageContent.content.substring(0, 500) + (pageContent.content.length > 500 ? '...' : '');
        onContentChunk(fallbackContent);

        return {
            success: true,
            title: betterTitle || pageContent.title,
            content: fallbackContent
        };
    }
}