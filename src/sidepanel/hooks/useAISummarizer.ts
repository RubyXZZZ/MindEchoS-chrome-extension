
// Hook for using Summarizer API in Sidepanel

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
        onContentChunk: (chunk: string) => void,
        signal?: AbortSignal,
        needsContentSummary?: boolean
    ) => Promise<SummarizeResult>;
    summarizeWebpageStreaming: (
        pageData: { title: string; content: string; url: string },
        onTitleChunk: (chunk: string) => void,
        onContentChunk: (chunk: string) => void,
        signal?: AbortSignal
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
        const checkAvailability = async () => {
            setIsChecking(true);
            try {
                if (!('Summarizer' in self)) {
                    setIsAvailable(false);
                    return;
                }

                const summarizer = SummarizeAI.getInstance();
                const availability = await summarizer.checkAvailability();

                const available = availability !== 'no';
                setIsAvailable(available);

                if (available) {
                    console.log('[AI Hook] ✓ Summarizer API available');
                } else {
                    console.log('[AI Hook] ✗ Summarizer API not available');
                }
            } catch (error) {
                console.error('[AI Hook] Availability check failed:', error);
                setIsAvailable(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkAvailability();
    }, []);

    const summarizeTextStreaming = useCallback(async (
        text: string,
        url: string,
        onTitleChunk: (chunk: string) => void,
        onContentChunk: (chunk: string) => void,
        signal?: AbortSignal,
        needsContentSummary: boolean = true
    ): Promise<SummarizeResult> => {
        if (!isAvailable) {
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
            const summarizer = SummarizeAI.getInstance();
            const skipContentSummary = !needsContentSummary;

            const result = await summarizer.summarizeSelectionStreaming(
                text,
                url,
                onTitleChunk,
                onContentChunk,
                signal,
                skipContentSummary
            );
            return result;
        } catch (error) {
            console.error('[AI Hook] Summarization error:', error);
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
        onContentChunk: (chunk: string) => void,
        signal?: AbortSignal
    ): Promise<SummarizeResult> => {
        if (!isAvailable) {
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
            const summarizer = SummarizeAI.getInstance();
            const result = await summarizer.summarizeWebpageStreaming(
                pageData,
                onTitleChunk,
                onContentChunk,
                signal
            );
            return result;
        } catch (error) {
            console.error('[AI Hook] Webpage summarization error:', error);
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