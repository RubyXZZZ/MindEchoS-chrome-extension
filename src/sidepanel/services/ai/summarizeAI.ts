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
    async checkAvailability(): Promise<'readily' | 'downloadable' | 'unavailable'> {
        try {
            if (!('Summarizer' in self)) {
                console.warn('Summarizer API not supported');
                return 'unavailable';
            }

            const availability = await Summarizer.availability();
            console.log('Summarizer availability:', availability);
            return availability;
        } catch (error) {
            console.error('Error checking Summarizer availability:', error);
            return 'unavailable';
        }
    }

    /**
     * 创建 summarizer 实例
     */
    private async createSummarizer(options: SummarizerOptions): Promise<SummarizerInstance | null> {
        try {
            const availability = await this.checkAvailability();

            if (availability === 'unavailable') {
                return null;
            }

            const optionsWithMonitor: SummarizerOptions = {
                ...options,
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        const percent = (e.loaded * 100);
                        console.log(`Downloaded ${percent.toFixed(2)}%`);
                    });
                }
            };

            const summarizer = await Summarizer.create(optionsWithMonitor);
            return summarizer;
        } catch (error) {
            console.error('Failed to create summarizer:', error);
            return null;
        }
    }

    /**
     * 根据文本长度决定总结长度
     */
    private getContentLength(textLength: number): 'short' | 'medium' | 'long' {
        if (textLength <= 300) return 'short';
        if (textLength <= 1000) return 'medium';
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

        // 生成标题
        let title = '';
        const titleSummarizer = await this.createSummarizer({
            type: 'headline',
            format: 'plain-text',
            length: 'short'
        });

        if (titleSummarizer) {
            try {
                title = await titleSummarizer.summarize(text);
                titleSummarizer.destroy();
            } catch (error) {
                console.error('Failed to generate title:', error);
                title = text.substring(0, 50) + '...';
                titleSummarizer.destroy();
            }
        } else {
            title = text.substring(0, 50) + '...';
        }

        // 生成内容总结
        const contentLength = this.getContentLength(text.length);
        const contentSummarizer = await this.createSummarizer({
            type: 'key-points',
            format: 'plain-text',
            length: contentLength
        });

        if (contentSummarizer) {
            try {
                const content = await contentSummarizer.summarize(text);
                contentSummarizer.destroy();

                return {
                    success: true,
                    title: title,
                    content: content
                };
            } catch (error) {
                console.error('Failed to generate content summary:', error);
                contentSummarizer.destroy();
            }
        }

        // 降级处理
        return {
            success: true,
            title: title || text.substring(0, 50) + '...',
            content: text.substring(0, 500) + '...'
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

        // 生成更好的标题
        let betterTitle = pageContent.title;
        const titleSummarizer = await this.createSummarizer({
            type: 'headline',
            format: 'plain-text',
            length: 'medium'
        });

        if (titleSummarizer) {
            try {
                betterTitle = await titleSummarizer.summarize(pageContent.content);
                titleSummarizer.destroy();
            } catch (error) {
                console.error('Failed to generate title:', error);
                titleSummarizer.destroy();
            }
        }

        // 生成内容总结
        const contentLength = this.getContentLength(pageContent.content.length);
        const contentSummarizer = await this.createSummarizer({
            type: 'key-points',
            format: 'plain-text',
            length: contentLength,
            sharedContext: 'This is a webpage content'
        });

        if (contentSummarizer) {
            try {
                const summary = await contentSummarizer.summarize(pageContent.content, {
                    context: `From webpage: ${pageContent.url}`
                });
                contentSummarizer.destroy();

                return {
                    success: true,
                    title: betterTitle,
                    content: summary
                };
            } catch (error) {
                console.error('Failed to generate content summary:', error);
                contentSummarizer.destroy();
            }
        }

        // 降级处理
        return {
            success: true,
            title: betterTitle,
            content: pageContent.content.substring(0, 500) + '...'
        };
    }
}