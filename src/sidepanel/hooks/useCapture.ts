import { useState, useCallback } from 'react';
import { KnowledgeCard } from '../types/card.types';
import { ChromeAIService } from '../services/ai/chromeAI';
import { CARD_COLORS } from '../utils/constants';
import { useStore } from '../store';

interface CaptureOptions {
    autoSummarize?: boolean;
    extractKeywords?: boolean;
}

export function useCapture(options: CaptureOptions = {}) {
    const { autoSummarize = true, extractKeywords = true } = options;
    const { addCard } = useStore();
    const [isCapturing, setIsCapturing] = useState(false);
    const [captureError, setCaptureError] = useState<string | null>(null);

    // Capture current webpage
    const captureWebpage = useCallback(async (): Promise<Partial<KnowledgeCard> | null> => {
        setIsCapturing(true);
        setCaptureError(null);

        try {
            // Send message to background script to capture page
            const response = await chrome.runtime.sendMessage({
                action: 'capturePageContent'
            });

            if (!response) {
                throw new Error('Failed to capture page content');
            }

            let summary = response.content.substring(0, 200) + '...';
            let tags: string[] = [];

            // Auto-summarize if enabled
            if (autoSummarize) {
                summary = await ChromeAIService.summarize(response.content, {
                    type: 'tl;dr',
                    length: 'medium'
                });
            }

            // Extract keywords if enabled
            if (extractKeywords) {
                // This could use AI or a simple keyword extraction algorithm
                tags = extractKeywordsFromText(response.content);
            }

            return {
                title: response.title,
                content: response.content,
                summary,
                url: response.url,
                tags,
                source: 'webpage',
                timestamp: Date.now(),
            };
        } catch (error) {
            setCaptureError(error instanceof Error ? error.message : 'Capture failed');
            return null;
        } finally {
            setIsCapturing(false);
        }
    }, [autoSummarize, extractKeywords]);

    // Capture selected text
    const captureSelection = useCallback(async (): Promise<Partial<KnowledgeCard> | null> => {
        setIsCapturing(true);
        setCaptureError(null);

        try {
            // Get selected text from active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab.id) {
                throw new Error('No active tab found');
            }

            const [result] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => window.getSelection()?.toString() || ''
            });

            const selectedText = result.result as string;

            if (!selectedText) {
                throw new Error('No text selected');
            }

            let summary = selectedText.substring(0, 200) + '...';

            if (autoSummarize && selectedText.length > 200) {
                summary = await ChromeAIService.summarize(selectedText, {
                    type: 'key-points',
                    length: 'short'
                });
            }

            return {
                title: `Selection from ${tab.title}`,
                content: selectedText,
                summary,
                url: tab.url,
                tags: extractKeywords ? extractKeywordsFromText(selectedText) : [],
                source: 'selection',
                timestamp: Date.now(),
            };
        } catch (error) {
            setCaptureError(error instanceof Error ? error.message : 'Selection capture failed');
            return null;
        } finally {
            setIsCapturing(false);
        }
    }, [autoSummarize, extractKeywords]);

    // Capture video transcript (YouTube)
    const captureVideo = useCallback(async (): Promise<Partial<KnowledgeCard> | null> => {
        setIsCapturing(true);
        setCaptureError(null);

        try {
            // This would need YouTube API integration
            // For now, return mock data
            await new Promise(resolve => setTimeout(resolve, 1000));

            return {
                title: 'Video Transcript',
                content: 'Video transcript content would go here...',
                summary: 'Summary of video content',
                url: window.location.href,
                tags: ['video', 'transcript'],
                source: 'video',
                timestamp: Date.now(),
            };
        } catch (error) {
            setCaptureError(error instanceof Error ? error.message : 'Video capture failed');
            return null;
        } finally {
            setIsCapturing(false);
        }
    }, []);

    // Create and save card from captured content
    const saveCapture = useCallback(async (
        capturedData: Partial<KnowledgeCard>,
        additionalData?: Partial<KnowledgeCard>
    ): Promise<boolean> => {
        try {
            const cardCount = useStore.getState().cards.length;

            const newCard: KnowledgeCard = {
                id: Date.now().toString(),
                title: 'Untitled',
                summary: '',
                content: '',
                url: 'https://example.com',
                timestamp: Date.now(),
                priority: 3,
                tags: [],
                category: 'Technology',
                color: CARD_COLORS[cardCount % CARD_COLORS.length],
                ...capturedData,
                ...additionalData,
            };

            addCard(newCard);
            return true;
        } catch (error) {
            setCaptureError('Failed to save card');
            return false;
        }
    }, [addCard]);

    return {
        isCapturing,
        captureError,
        captureWebpage,
        captureSelection,
        captureVideo,
        saveCapture,
    };
}

// Helper function to extract keywords
function extractKeywordsFromText(text: string): string[] {
    // Simple keyword extraction - in production, use a proper NLP library
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);

    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

    // Count word frequency
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Return top 5 most frequent words as tags
    return Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
}