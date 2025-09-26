// import { useState, useCallback } from 'react';
// import { SummarizeAI } from '../services/ai/summarizeAI';
// import { PromptsAI } from '../services/ai/promptsAI';
// import { KnowledgeCard } from '../types/card.types';
// import { ChatMode } from '../types/chat.types';
//
// /**
//  * Hook for AI interactions
//  * Handles summarization and chat responses
//  */
// export function useAI() {
//     const [isProcessing, setIsProcessing] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//
//     // Summarize text content
//     const summarizeText = useCallback(async (text: string, options?: {
//         type?: 'tl;dr' | 'key-points' | 'teaser' | 'headline';
//         length?: 'short' | 'medium' | 'long';
//     }): Promise<string> => {
//         setIsProcessing(true);
//         setError(null);
//
//         try {
//             const summary = await SummarizeAI.summarize(text, {
//                 type: options?.type || 'tl;dr',
//                 format: 'plain-text',
//                 length: options?.length || 'medium'
//             });
//             return summary;
//         } catch (err) {
//             const errorMsg = 'Failed to summarize content';
//             setError(errorMsg);
//             console.error('Summarization error:', err);
//             throw new Error(errorMsg);
//         } finally {
//             setIsProcessing(false);
//         }
//     }, []);
//
//     // Generate chat response
//     const generateResponse = useCallback(async (
//         message: string,
//         context?: {
//             mode?: ChatMode;
//             cards?: KnowledgeCard[];
//             history?: any[];
//         }
//     ): Promise<string> => {
//         setIsProcessing(true);
//         setError(null);
//
//         try {
//             const response = await PromptsAI.generateResponse(message, context);
//             return response;
//         } catch (err) {
//             const errorMsg = 'Failed to generate response';
//             setError(errorMsg);
//             console.error('Chat response error:', err);
//             throw new Error(errorMsg);
//         } finally {
//             setIsProcessing(false);
//         }
//     }, []);
//
//     // Generate mindmap structure
//     const generateMindmap = useCallback(async (topic: string): Promise<string> => {
//         setIsProcessing(true);
//         setError(null);
//
//         try {
//             const mindmap = await PromptsAI.generateMindmap(topic);
//             return mindmap;
//         } catch (err) {
//             const errorMsg = 'Failed to generate mindmap';
//             setError(errorMsg);
//             console.error('Mindmap generation error:', err);
//             throw new Error(errorMsg);
//         } finally {
//             setIsProcessing(false);
//         }
//     }, []);
//
//     // Analyze cards for patterns
//     const analyzeCards = useCallback(async (cards: KnowledgeCard[]): Promise<string> => {
//         setIsProcessing(true);
//         setError(null);
//
//         try {
//             const analysis = await PromptsAI.analyzeCards(cards);
//             return analysis;
//         } catch (err) {
//             const errorMsg = 'Failed to analyze cards';
//             setError(errorMsg);
//             console.error('Card analysis error:', err);
//             throw new Error(errorMsg);
//         } finally {
//             setIsProcessing(false);
//         }
//     }, []);
//
//     // Check AI availability
//     const checkAIAvailability = useCallback(async () => {
//         const summarizer = await SummarizeAI.checkCapabilities();
//         const prompter = await PromptsAI.checkCapabilities();
//
//         return {
//             summarizer: summarizer.available !== 'no',
//             prompter: prompter
//         };
//     }, []);
//
//     // Clean up AI resources
//     const cleanup = useCallback(() => {
//         SummarizeAI.destroy();
//         PromptsAI.destroy();
//     }, []);
//
//     return {
//         // State
//         isProcessing,
//         error,
//
//         // Actions
//         summarizeText,
//         generateResponse,
//         generateMindmap,
//         analyzeCards,
//         checkAIAvailability,
//         cleanup
//     };
// }
