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
     * 总结选中的文本
     */
    async summarizeSelection(text: string, _url: string): Promise<SummarizeResult> {
        if (!text || text.length < 10) {
            return {
                success: false,
                error: '文本太短，无法总结'
            };
        }

        console.log('[SummarizeAI] Starting selection summarization, text length:', text.length);

        // 生成标题
        let title = '';
        const titleSummarizer = await this.createSummarizer({
            type: 'headline',
            format: 'plain-text',
            length: 'short'
        });

        if (titleSummarizer) {
            try {
                console.log('[SummarizeAI] Generating title...');
                title = await titleSummarizer.summarize(text);
                console.log('[SummarizeAI] Title generated:', title);
                titleSummarizer.destroy();
            } catch (error) {
                console.error('[SummarizeAI] Title generation failed:', error);
                title = text.substring(0, 50) + '...';
                titleSummarizer.destroy();
            }
        } else {
            console.log('[SummarizeAI] Title summarizer unavailable, using fallback');
            title = text.substring(0, 50) + '...';
        }

        // 生成内容总结
        const contentLength = this.getContentLength(text.length);
        console.log('[SummarizeAI] Content length setting:', contentLength);

        const contentSummarizer = await this.createSummarizer({
            type: 'key-points',
            format: 'plain-text',
            length: contentLength
        });

        if (contentSummarizer) {
            try {
                console.log('[SummarizeAI] Generating content summary...');
                const content = await contentSummarizer.summarize(text);
                console.log('[SummarizeAI] Content summary generated, length:', content.length);
                contentSummarizer.destroy();

                return {
                    success: true,
                    title: title,
                    content: content
                };
            } catch (error) {
                console.error('[SummarizeAI] Content summary generation failed:', error);
                contentSummarizer.destroy();
            }
        }

        // 降级处理
        console.log('[SummarizeAI] Using fallback for content');
        return {
            success: true,
            title: title || text.substring(0, 50) + '...',
            content: text.substring(0, 500) + (text.length > 500 ? '...' : '')
        };
    }

    /**
     * 总结网页内容
     */
    async summarizeWebpage(pageContent: {
        title: string;
        content: string;
        url: string;
    }): Promise<SummarizeResult> {
        if (!pageContent.content || pageContent.content.length < 10) {
            return {
                success: false,
                error: '网页内容太少，无法总结'
            };
        }

        console.log('[SummarizeAI] Starting webpage summarization, content length:', pageContent.content.length);

        // 生成更好的标题
        let betterTitle = pageContent.title;
        const titleSummarizer = await this.createSummarizer({
            type: 'headline',
            format: 'plain-text',
            length: 'medium'
        });

        if (titleSummarizer) {
            try {
                console.log('[SummarizeAI] Generating webpage title...');
                betterTitle = await titleSummarizer.summarize(pageContent.content);
                console.log('[SummarizeAI] Webpage title generated:', betterTitle);
                titleSummarizer.destroy();
            } catch (error) {
                console.error('[SummarizeAI] Webpage title generation failed:', error);
                titleSummarizer.destroy();
            }
        }

        // 生成内容总结
        const contentLength = this.getContentLength(pageContent.content.length);
        console.log('[SummarizeAI] Webpage content length setting:', contentLength);

        const contentSummarizer = await this.createSummarizer({
            type: 'key-points',
            format: 'plain-text',
            length: contentLength,
            sharedContext: 'This is a webpage content'
        });

        if (contentSummarizer) {
            try {
                console.log('[SummarizeAI] Generating webpage content summary...');
                const summary = await contentSummarizer.summarize(pageContent.content, {
                    context: `From webpage: ${pageContent.url}`
                });
                console.log('[SummarizeAI] Webpage content summary generated, length:', summary.length);
                contentSummarizer.destroy();

                return {
                    success: true,
                    title: betterTitle,
                    content: summary
                };
            } catch (error) {
                console.error('[SummarizeAI] Webpage content summary generation failed:', error);
                contentSummarizer.destroy();
            }
        }

        // 降级处理
        console.log('[SummarizeAI] Using fallback for webpage content');
        return {
            success: true,
            title: betterTitle,
            content: pageContent.content.substring(0, 500) + (pageContent.content.length > 500 ? '...' : '')
        };
    }
}