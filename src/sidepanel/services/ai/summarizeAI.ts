import { AIConfig, AICapabilities } from './aiService';

/**
 * Chrome AI Summarizer API wrapper
 * Handles webpage and text summarization
 */

export class SummarizeAI {
    private static summarizer: any = null;

    /**
     * Check if summarizer is available
     */
    static async checkCapabilities(): Promise<AICapabilities> {
        if (!('ai' in self) || !('summarizer' in (self as any).ai)) {
            return { available: 'no' };
        }

        try {
            const capabilities = await (self as any).ai.summarizer.capabilities();
            return capabilities;
        } catch (error) {
            console.error('Failed to check summarizer capabilities:', error);
            return { available: 'no' };
        }
    }

    /**
     * Create summarizer instance
     */
    static async create(config?: AIConfig['summarizer']): Promise<boolean> {
        try {
            const capabilities = await this.checkCapabilities();

            if (capabilities.available === 'no') {
                return false;
            }

            if (capabilities.available === 'after-download') {
                console.log('Downloading AI summarizer model...');
            }

            const options = config || {
                type: 'tl;dr',
                format: 'plain-text',
                length: 'medium'
            };

            this.summarizer = await (self as any).ai.summarizer.create(options);
            return true;
        } catch (error) {
            console.error('Failed to create summarizer:', error);
            return false;
        }
    }

    /**
     * Summarize text content
     */
    static async summarize(text: string, config?: AIConfig['summarizer']): Promise<string> {
        try {
            // Create summarizer if not exists
            if (!this.summarizer) {
                const created = await this.create(config);
                if (!created) {
                    // Fallback to simple truncation
                    return this.fallbackSummarize(text);
                }
            }

            // Summarize the text
            const summary = await this.summarizer.summarize(text);
            return summary;
        } catch (error) {
            console.error('Summarization failed:', error);
            return this.fallbackSummarize(text);
        }
    }

    /**
     * Fallback summarization when AI is not available
     */
    private static fallbackSummarize(text: string, maxLength: number = 500): string {
        if (text.length <= maxLength) {
            return text;
        }

        // Try to cut at sentence boundary
        const truncated = text.substring(0, maxLength);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastQuestion = truncated.lastIndexOf('?');
        const lastExclamation = truncated.lastIndexOf('!');

        const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclamation);

        if (lastSentence > maxLength * 0.8) {
            return truncated.substring(0, lastSentence + 1);
        }

        return truncated + '...';
    }

    /**
     * Clean up resources
     */
    static destroy(): void {
        if (this.summarizer) {
            this.summarizer.destroy();
            this.summarizer = null;
        }
    }
}