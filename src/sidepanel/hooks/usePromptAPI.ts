// hooks/usePromptAPI.ts
import { useState, useCallback, useEffect } from 'react';
import { PromptAI } from '../services/ai/promptAI';
import { KnowledgeCard } from '../types/card.types';

interface UsePromptAPIReturn {
    isAvailable: boolean;
    isChecking: boolean;
    isGenerating: boolean;
    initializeSession: (selectedCards: KnowledgeCard[]) => Promise<boolean>;
    sendMessage: (
        message: string,
        onChunk: (text: string) => void,
        signal?: AbortSignal
    ) => Promise<string>;
    generateImprovement: (
        originalResponse: string,
        rejectionReason: string,
        onChunk: (text: string) => void,
        signal?: AbortSignal
    ) => Promise<string>;
    destroySession: () => void;
}

export function usePromptAPI(): UsePromptAPIReturn {
    const [isAvailable, setIsAvailable] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const checkAvailability = async () => {
            setIsChecking(true);
            try {
                const ai = PromptAI.getInstance();
                const availability = await ai.checkAvailability();
                setIsAvailable(availability !== 'no');
                console.log('[usePromptAPI] Availability:', availability);
            } catch (error) {
                console.error('[usePromptAPI] Check failed:', error);
                setIsAvailable(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkAvailability();
    }, []);

    const initializeSession = useCallback(async (
        selectedCards: KnowledgeCard[]
    ): Promise<boolean> => {
        try {
            const ai = PromptAI.getInstance();

            const simplifiedCards = Array.isArray(selectedCards)
                ? selectedCards.map(card => ({
                    title: card.title || 'Untitled',
                    content: card.content || '',
                    url: card.url || ''
                }))
                : [];

            console.log('[usePromptAPI] Initializing session');
            console.log('[usePromptAPI] Cards count:', simplifiedCards.length);

            const success = await ai.createSession(simplifiedCards);
            return success;
        } catch (error) {
            console.error('[usePromptAPI] Init session failed:', error);
            return false;
        }
    }, []);

    const sendMessage = useCallback(async (
        message: string,
        onChunk: (text: string) => void,
        signal?: AbortSignal
    ): Promise<string> => {
        if (!isAvailable) {
            throw new Error('Prompt API not available');
        }

        setIsGenerating(true);
        try {
            const ai = PromptAI.getInstance();
            const result = await ai.sendMessageStreaming(message, onChunk, signal);
            return result;
        } catch (error: any) {
            if (error.name === 'AbortError' || signal?.aborted) {
                console.log('[usePromptAPI] Generation aborted');
                throw new Error('Aborted');
            }
            console.error('[usePromptAPI] Send message failed:', error);
            throw error;
        } finally {
            setIsGenerating(false);
        }
    }, [isAvailable]);

    const generateImprovement = useCallback(async (
        originalResponse: string,
        rejectionReason: string,
        onChunk: (text: string) => void,
        signal?: AbortSignal
    ): Promise<string> => {
        const improvePrompt = `The user rejected your previous response with the following feedback:

"${rejectionReason}"

Your previous response was:
"${originalResponse}"

Please provide an improved response that addresses their concerns.`;

        return await sendMessage(improvePrompt, onChunk, signal);
    }, [sendMessage]);

    const destroySession = useCallback(() => {
        const ai = PromptAI.getInstance();
        ai.destroySession();
        console.log('[usePromptAPI] Session destroyed');
    }, []);

    return {
        isAvailable,
        isChecking,
        isGenerating,
        initializeSession,
        sendMessage,
        generateImprovement,
        destroySession
    };
}