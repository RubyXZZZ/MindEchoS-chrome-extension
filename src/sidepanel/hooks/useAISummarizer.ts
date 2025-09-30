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
    summarizeText: (text: string, url: string) => Promise<SummarizeResult>;
    summarizeWebpage: (pageData: { title: string; content: string; url: string }) => Promise<SummarizeResult>;
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

    const summarizeText = useCallback(async (
        text: string,
        url: string
    ): Promise<SummarizeResult> => {
        console.log('[AI Hook] summarizeText called');
        console.log('[AI Hook] - Text length:', text.length);
        console.log('[AI Hook] - URL:', url);
        console.log('[AI Hook] - isAvailable:', isAvailable);

        if (!isAvailable) {
            console.log('[AI Hook] Using fallback (AI not available)');
            return {
                success: true,
                title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                content: text  // 返回完整文本
            };
        }

        setIsProcessing(true);
        try {
            console.log('[AI Hook] Calling SummarizeAI.summarizeSelection...');
            const summarizer = SummarizeAI.getInstance();
            const result = await summarizer.summarizeSelection(text, url);
            console.log('[AI Hook] AI result:', result);
            return result;
        } catch (error) {
            console.error('[AI Hook] Summarize error:', error);
            return {
                success: true,
                title: text.substring(0, 50) + '...',
                content: text  // 出错时返回完整文本
            };
        } finally {
            setIsProcessing(false);
        }
    }, [isAvailable]);

    const summarizeWebpage = useCallback(async (
        pageData: { title: string; content: string; url: string }
    ): Promise<SummarizeResult> => {
        console.log('[AI Hook] summarizeWebpage called');
        console.log('[AI Hook] - Page title:', pageData.title);
        console.log('[AI Hook] - Content length:', pageData.content.length);
        console.log('[AI Hook] - isAvailable:', isAvailable);

        if (!isAvailable) {
            console.log('[AI Hook] Using fallback for webpage (AI not available)');
            return {
                success: true,
                title: pageData.title,
                content: pageData.content.substring(0, 500) + (pageData.content.length > 500 ? '...' : '')
            };
        }

        setIsProcessing(true);
        try {
            console.log('[AI Hook] Calling SummarizeAI.summarizeWebpage...');
            const summarizer = SummarizeAI.getInstance();
            const result = await summarizer.summarizeWebpage(pageData);
            console.log('[AI Hook] Webpage AI result:', result);
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
        isAvailable,
        isChecking
    };
}