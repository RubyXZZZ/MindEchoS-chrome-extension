import { useState } from 'react';
import { ChromeAIService } from '../services/ai/chromeAI';
import { SummarizationOptions } from '../types/ai.types';

export function useAI() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const summarize = async (content: string, options?: SummarizationOptions) => {
        setIsLoading(true);
        setError(null);
        try {
            const summary = await ChromeAIService.summarize(content, options);
            return summary;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Summarization failed');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const prompt = async (message: string, context?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await ChromeAIService.prompt(message, context);
            return response;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Prompt failed');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        summarize,
        prompt,
        isLoading,
        error,
    };
}