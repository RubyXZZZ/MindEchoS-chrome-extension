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

export function useAISummarizer() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        // 检查 Summarizer API 是否可用
        const checkAvailability = async () => {
            // 使用特性检测
            if ('Summarizer' in self) {
                try {
                    const summarizer = SummarizeAI.getInstance();
                    const availability = await summarizer.checkAvailability();
                    setIsAvailable(availability !== 'unavailable');
                    console.log('[AI Hook] Summarizer availability:', availability);
                } catch (error) {
                    console.error('[AI Hook] Failed to check availability:', error);
                    setIsAvailable(false);
                }
            } else {
                console.warn('[AI Hook] Summarizer API not supported');
                setIsAvailable(false);
            }
        };

        checkAvailability();
    }, []);

    const summarizeText = useCallback(async (
        text: string,
        url: string
    ): Promise<SummarizeResult> => {
        if (!isAvailable) {
            console.log('[AI Hook] Summarizer not available, using fallback');
            return {
                success: true,
                title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                content: text.substring(0, 500) + (text.length > 500 ? '...' : '')
            };
        }

        setIsProcessing(true);
        try {
            const summarizer = SummarizeAI.getInstance();
            const result = await summarizer.summarizeSelection(text, url);
            return result;
        } catch (error) {
            console.error('[AI Hook] Summarize error:', error);
            return {
                success: true,
                title: text.substring(0, 50) + '...',
                content: text.substring(0, 500) + '...'
            };
        } finally {
            setIsProcessing(false);
        }
    }, [isAvailable]);

    const summarizeWebpage = useCallback(async (
        pageData: { title: string; content: string; url: string }
    ): Promise<SummarizeResult> => {
        if (!isAvailable) {
            return {
                success: true,
                title: pageData.title,
                content: pageData.content.substring(0, 500) + '...'
            };
        }

        setIsProcessing(true);
        try {
            const summarizer = SummarizeAI.getInstance();
            const result = await summarizer.summarizeWebpage(pageData);
            return result;
        } catch (error) {
            console.error('[AI Hook] Summarize webpage error:', error);
            return {
                success: true,
                title: pageData.title,
                content: pageData.content.substring(0, 500) + '...'
            };
        } finally {
            setIsProcessing(false);
        }
    }, [isAvailable]);

    return {
        summarizeText,
        summarizeWebpage,
        isProcessing,
        isAvailable
    };
}