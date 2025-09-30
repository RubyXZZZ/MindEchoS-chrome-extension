// hooks/useAISummarizer.ts
// 在 Sidepanel 中使用 Summarizer API 的 Hook

import { useEffect, useCallback, useState } from 'react';
import { SummarizeAI } from '../services/ai/summarizeAI';

interface SummarizeResult {
    success: boolean;
    title?: string;
    content?: string;
    error?: string;
}

interface UseAISummarizerReturn {
    summarizeTextStreaming: (
        text: string,
        url: string,
        onTitleChunk: (chunk: string) => void,
        onContentChunk: (chunk: string) => void
    ) => Promise<SummarizeResult>;
    summarizeWebpageStreaming: (
        pageData: { title: string; content: string; url: string },
        onTitleChunk: (chunk: string) => void,
        onContentChunk: (chunk: string) => void
    ) => Promise<SummarizeResult>;
    isProcessing: boolean;
    isAvailable: boolean;
    isChecking: boolean;
}

export function useAISummarizer(): UseAISummarizerReturn {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // 检查 Summarizer API 是否可用
        const checkAvailability = async () => {
            setIsChecking(true);
            try {
                console.log('[AI Hook] Checking Summarizer API availability...');

                // 使用官方文档的检测方式
                if (!('Summarizer' in self)) {
                    console.warn('[AI Hook] Summarizer API not found in global scope');
                    setIsAvailable(false);
                    return;
                }

                const summarizer = SummarizeAI.getInstance();
                const availability = await summarizer.checkAvailability();

                console.log('[AI Hook] Summarizer availability:', availability);

                // 'readily' 或 'after-download' 都算可用
                const available = availability !== 'no';
                setIsAvailable(available);

                if (available) {
                    console.log('[AI Hook] ✓ Summarizer API is available');
                    if (availability === 'after-download') {
                        console.log('[AI Hook] ⚠ Model may need to be downloaded on first use');
                    }
                } else {
                    console.warn('[AI Hook] ✗ Summarizer API is not available');
                }
            } catch (error) {
                console.error('[AI Hook] Failed to check availability:', error);
                setIsAvailable(false);
            } finally {
                setIsChecking(false);
                console.log('[AI Hook] Availability check completed');
            }
        };

        checkAvailability();
    }, []);

    const summarizeTextStreaming = useCallback(async (
        text: string,
        url: string,
        onTitleChunk: (chunk: string) => void,
        onContentChunk: (chunk: string) => void
    ): Promise<SummarizeResult> => {
        console.log('[AI Hook] summarizeTextStreaming called');
        console.log('[AI Hook] - Text length:', text.length);
        console.log('[AI Hook] - isAvailable:', isAvailable);

        if (!isAvailable) {
            console.log('[AI Hook] Using fallback (AI not available)');
            const fallbackTitle = text.substring(0, 50) + (text.length > 50 ? '...' : '');
            const fallbackContent = text;
            onTitleChunk(fallbackTitle);
            onContentChunk(fallbackContent);
            return {
                success: true,
                title: fallbackTitle,
                content: fallbackContent
            };
        }

        setIsProcessing(true);
        try {
            console.log('[AI Hook] Calling streaming summarization...');
            const summarizer = SummarizeAI.getInstance();
            const result = await summarizer.summarizeSelectionStreaming(
                text,
                url,
                onTitleChunk,
                onContentChunk
            );
            console.log('[AI Hook] Streaming completed:', result);
            return result;
        } catch (error) {
            console.error('[AI Hook] Streaming error:', error);
            const fallbackTitle = text.substring(0, 50) + '...';
            const fallbackContent = text;
            onTitleChunk(fallbackTitle);
            onContentChunk(fallbackContent);
            return {
                success: true,
                title: fallbackTitle,
                content: fallbackContent
            };
        } finally {
            setIsProcessing(false);
        }
    }, [isAvailable]);

    const summarizeWebpageStreaming = useCallback(async (
        pageData: { title: string; content: string; url: string },
        onTitleChunk: (chunk: string) => void,
        onContentChunk: (chunk: string) => void
    ): Promise<SummarizeResult> => {
        console.log('[AI Hook] summarizeWebpageStreaming called');
        console.log('[AI Hook] - Page title:', pageData.title);
        console.log('[AI Hook] - Content length:', pageData.content.length);
        console.log('[AI Hook] - isAvailable:', isAvailable);

        if (!isAvailable) {
            console.log('[AI Hook] Using fallback for webpage (AI not available)');
            const fallbackContent = pageData.content.substring(0, 500) + (pageData.content.length > 500 ? '...' : '');
            onTitleChunk(pageData.title);
            onContentChunk(fallbackContent);
            return {
                success: true,
                title: pageData.title,
                content: fallbackContent
            };
        }

        setIsProcessing(true);
        try {
            console.log('[AI Hook] Calling streaming webpage summarization...');
            const summarizer = SummarizeAI.getInstance();
            const result = await summarizer.summarizeWebpageStreaming(
                pageData,
                onTitleChunk,
                onContentChunk
            );
            console.log('[AI Hook] Webpage streaming completed:', result);
            return result;
        } catch (error) {
            console.error('[AI Hook] Webpage streaming error:', error);
            const fallbackContent = pageData.content.substring(0, 500) + '...';
            onTitleChunk(pageData.title);
            onContentChunk(fallbackContent);
            return {
                success: true,
                title: pageData.title,
                content: fallbackContent
            };
        } finally {
            setIsProcessing(false);
        }
    }, [isAvailable]);

    return {
        summarizeTextStreaming,
        summarizeWebpageStreaming,
        isProcessing,
        isAvailable,
        isChecking
    };
}