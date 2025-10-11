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
                    url: card.url || '',
                    displayNumber: card.displayNumber || 0
                }))
                : [];

            return await ai.createSession(simplifiedCards);
        } catch (error) {
            console.error('[usePromptAPI] Init failed:', error);
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
            return await ai.sendMessageStreaming(message, onChunk, signal);
        } catch (err) {
            const error = err as Error;
            if (error.name === 'AbortError' || signal?.aborted) {
                throw new Error('Aborted');
            }
            console.error('[usePromptAPI] Send failed:', error);
            throw error;
        } finally {
            setIsGenerating(false);
        }
    }, [isAvailable]);

    const destroySession = useCallback(() => {
        const ai = PromptAI.getInstance();
        ai.destroySession();
    }, []);

    return {
        isAvailable,
        isChecking,
        isGenerating,
        initializeSession,
        sendMessage,
        destroySession
    };
}