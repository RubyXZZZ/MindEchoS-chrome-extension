// services/ai/summarizeAI.ts
// Chrome Summarizer API Implementation (Chrome 138+)
// Based on official docs: https://developer.chrome.com/docs/ai/summarizer-api

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

    async checkAvailability(): Promise<'readily' | 'after-download' | 'no'> {
        try {
            if (!('Summarizer' in self)) {
                return 'no';
            }

            const availability = await Summarizer.availability();
            return availability;
        } catch (error) {
            console.error('[SummarizeAI] Availability check failed:', error);
            return 'no';
        }
    }

    private async createSummarizer(options: SummarizerOptions): Promise<SummarizerInstance | null> {
        try {
            const availability = await this.checkAvailability();

            if (availability === 'no') {
                return null;
            }

            const optionsWithMonitor: SummarizerOptions = availability === 'after-download'
                ? {
                    ...options,
                    monitor(m) {
                        m.addEventListener('downloadprogress', (e) => {
                            if (e.loaded > 0) {
                                const percent = Math.round(e.loaded * 100);
                                console.log(`[SummarizeAI] Model download: ${percent}%`);
                            }
                        });
                    }
                }
                : options;

            const summarizer = await Summarizer.create(optionsWithMonitor);
            return summarizer;
        } catch (error) {
            console.error('[SummarizeAI] Failed to create summarizer:', error);
            return null;
        }
    }

    private getContentLength(textLength: number): 'short' | 'medium' | 'long' {
        if (textLength <= 600) return 'short';
        if (textLength <= 2000) return 'medium';
        return 'long';
    }

    async summarizeSelectionStreaming(
        text: string,
        _url: string,
        onTitleChunk: (chunk: string) => void,
        onContentChunk: (chunk: string) => void,
        signal?: AbortSignal,
        skipContentSummary: boolean = false
    ): Promise<SummarizeResult> {
        if (!text || text.length < 10) {
            return {
                success: false,
                error: 'Text too short to summarize'
            };
        }

        if (skipContentSummary) {
            onContentChunk(text);
        }

        let title = '';
        const titleSummarizer = await this.createSummarizer({
            type: 'headline',
            format: 'plain-text',
            length: 'short',
            outputLanguage: 'en'
        });

        if (titleSummarizer) {
            try {
                if (signal?.aborted) {
                    titleSummarizer.destroy();
                    return { success: false, error: 'Aborted by user' };
                }

                const stream = titleSummarizer.summarizeStreaming(text, {
                    context: 'Create a clear, concise title (under 10 words) that captures the main idea.'
                });

                for await (const chunk of stream) {
                    if (signal?.aborted) break;
                    title += chunk;
                    onTitleChunk(title);
                }

                titleSummarizer.destroy();
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    // Silently handle abort
                } else {
                    console.error('[SummarizeAI] Title generation failed:', error);
                }
                title = text.substring(0, 50) + '...';
                onTitleChunk(title);
                titleSummarizer.destroy();
            }
        } else {
            title = text.substring(0, 50) + '...';
            onTitleChunk(title);
        }

        if (skipContentSummary) {
            return {
                success: true,
                title: title,
                content: text
            };
        }

        const contentLength = this.getContentLength(text.length);

        const contentSummarizer = await this.createSummarizer({
            type: 'key-points',
            format: 'markdown',
            length: contentLength,
            outputLanguage: 'en'
        });

        if (contentSummarizer) {
            try {
                if (signal?.aborted) {
                    contentSummarizer.destroy();
                    return { success: false, error: 'Aborted by user', title: title };
                }

                let content = '';
                const stream = contentSummarizer.summarizeStreaming(text, {
                    context: 'Prioritize actionable information and concrete details. Focus on actionable insights or practical guidance when present.'
                });

                for await (const chunk of stream) {
                    if (signal?.aborted) {
                        contentSummarizer.destroy();
                        return { success: true, title: title, content: content };
                    }
                    content += chunk;
                    onContentChunk(content);
                }

                contentSummarizer.destroy();

                return {
                    success: true,
                    title: title,
                    content: content
                };
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    // Silently handle abort
                } else {
                    console.error('[SummarizeAI] Content generation failed:', error);
                }
                contentSummarizer.destroy();
            }
        }

        const fallbackContent = text.substring(0, 500) + (text.length > 500 ? '...' : '');
        onContentChunk(fallbackContent);

        return {
            success: true,
            title: title || text.substring(0, 50) + '...',
            content: fallbackContent
        };
    }

    async summarizeWebpageStreaming(
        pageContent: {
            title: string;
            content: string;
            url: string;
        },
        onTitleChunk: (chunk: string) => void,
        onContentChunk: (chunk: string) => void,
        signal?: AbortSignal
    ): Promise<SummarizeResult> {
        if (!pageContent.content || pageContent.content.length < 10) {
            return {
                success: false,
                error: 'Webpage content too short'
            };
        }

        let betterTitle = '';
        const titleSummarizer = await this.createSummarizer({
            type: 'headline',
            format: 'plain-text',
            length: 'short',
            outputLanguage: 'en'
        });

        if (titleSummarizer) {
            try {
                if (signal?.aborted) {
                    titleSummarizer.destroy();
                    return { success: false, error: 'Aborted by user' };
                }

                const stream = titleSummarizer.summarizeStreaming(pageContent.content, {
                    context: 'Create a clear title (under 10 words) for this article that reflects its main topic.'
                });

                for await (const chunk of stream) {
                    if (signal?.aborted) break;
                    betterTitle += chunk;
                    onTitleChunk(betterTitle);
                }

                titleSummarizer.destroy();
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    // Silently handle abort
                } else {
                    console.error('[SummarizeAI] Webpage title generation failed:', error);
                }
                betterTitle = pageContent.title;
                onTitleChunk(betterTitle);
                titleSummarizer.destroy();
            }
        } else {
            betterTitle = pageContent.title;
            onTitleChunk(betterTitle);
        }

        const contentLength = this.getContentLength(pageContent.content.length);

        const contentSummarizer = await this.createSummarizer({
            type: 'key-points',
            format: 'markdown',
            length: contentLength,
            sharedContext: 'This is a webpage content',
            outputLanguage: 'en'
        });

        if (contentSummarizer) {
            try {
                if (signal?.aborted) {
                    contentSummarizer.destroy();
                    return { success: false, error: 'Aborted by user', title: betterTitle };
                }

                let summary = '';
                const stream = contentSummarizer.summarizeStreaming(pageContent.content, {
                    context: 'Extract the core ideas and main content. Focus on actionable insights or practical guidance when present.'
                });

                for await (const chunk of stream) {
                    if (signal?.aborted) {
                        contentSummarizer.destroy();
                        return { success: true, title: betterTitle, content: summary };
                    }
                    summary += chunk;
                    onContentChunk(summary);
                }

                contentSummarizer.destroy();

                return {
                    success: true,
                    title: betterTitle,
                    content: summary
                };
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    // Silently handle abort
                } else {
                    console.error('[SummarizeAI] Webpage content generation failed:', error);
                }
                contentSummarizer.destroy();
            }
        }

        const fallbackContent = pageContent.content.substring(0, 500) + (pageContent.content.length > 500 ? '...' : '');
        onContentChunk(fallbackContent);

        return {
            success: true,
            title: betterTitle || pageContent.title,
            content: fallbackContent
        };
    }
}