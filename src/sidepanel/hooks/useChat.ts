// import { useState, useRef, useEffect, useCallback } from 'react';
// import { useStore } from '../store';
// import { ChatMessage, ChatMode } from '../types/chat.types';
// import { PromptsAI } from '../services/ai/promptsAI';
//
// interface UseChatOptions {
//     autoScroll?: boolean;
//     welcomeMessage?: string;
// }
//
// /**
//  * Hook for chat functionality
//  * Manages messages, AI responses, and chat modes
//  */
// export function useChat(options: UseChatOptions = {}) {
//     const {
//         autoScroll = true,
//         welcomeMessage = '你好！我可以帮你分析知识卡片、生成思维导图，或进行自由对话。请选择一个模式开始吧。'
//     } = options;
//
//     const {
//         messages,
//         addMessage,
//         chatMode,
//         setChatMode,
//         selectedCardsForChat,
//         setSelectedCardsForChat,
//         isTyping,
//         setIsTyping,
//         cards
//     } = useStore();
//
//     const [inputMessage, setInputMessage] = useState('');
//     const [showCardSelection, setShowCardSelection] = useState(false);
//     const messagesEndRef = useRef<HTMLDivElement>(null);
//     const inputRef = useRef<HTMLTextAreaElement>(null);
//
//     // Auto-scroll to bottom
//     useEffect(() => {
//         if (autoScroll && messagesEndRef.current) {
//             messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
//         }
//     }, [messages, isTyping, autoScroll]);
//
//     // Initialize with welcome message
//     useEffect(() => {
//         if (messages.length === 0 && welcomeMessage) {
//             addMessage({
//                 id: 'welcome',
//                 role: 'assistant',
//                 content: welcomeMessage,
//                 timestamp: Date.now(),
//                 status: 'sent'
//             });
//         }
//     }, []);
//
//     // Send message
//     const sendMessage = useCallback(async (content?: string) => {
//         const messageText = content || inputMessage.trim();
//         if (!messageText) return;
//
//         // Add user message
//         const userMessage: ChatMessage = {
//             id: Date.now().toString(),
//             role: 'user',
//             content: messageText,
//             timestamp: Date.now(),
//             status: 'sent'
//         };
//         addMessage(userMessage);
//         setInputMessage('');
//         setIsTyping(true);
//
//         try {
//             // Get selected cards
//             const selectedCards = chatMode === 'cards'
//                 ? cards.filter(card => selectedCardsForChat.includes(card.id))
//                 : undefined;
//
//             // Generate AI response
//             const response = await PromptsAI.generateResponse(messageText, {
//                 mode: chatMode,
//                 cards: selectedCards,
//                 history: messages.slice(-10)
//             });
//
//             // Add AI response
//             addMessage({
//                 id: (Date.now() + 1).toString(),
//                 role: 'assistant',
//                 content: response,
//                 timestamp: Date.now(),
//                 status: 'sent',
//                 references: chatMode === 'cards' ? selectedCardsForChat : undefined
//             });
//         } catch (error) {
//             console.error('Failed to get AI response:', error);
//             addMessage({
//                 id: (Date.now() + 1).toString(),
//                 role: 'assistant',
//                 content: '抱歉，获取回复时出现错误。请稍后再试。',
//                 timestamp: Date.now(),
//                 status: 'error'
//             });
//         } finally {
//             setIsTyping(false);
//         }
//     }, [inputMessage, chatMode, selectedCardsForChat, cards, messages, addMessage, setIsTyping]);
//
//     // Handle mode change
//     const handleModeChange = useCallback((mode: ChatMode) => {
//         setChatMode(mode);
//         if (mode !== 'cards') {
//             setShowCardSelection(false);
//             setSelectedCardsForChat([]);
//         }
//         setTimeout(() => {
//             inputRef.current?.focus();
//         }, 100);
//     }, [setChatMode, setSelectedCardsForChat]);
//
//     // Toggle card selection
//     const toggleCardSelection = useCallback((cardId: string) => {
//         setSelectedCardsForChat(
//             selectedCardsForChat.includes(cardId)
//                 ? selectedCardsForChat.filter(id => id !== cardId)
//                 : [...selectedCardsForChat, cardId]
//         );
//     }, [selectedCardsForChat, setSelectedCardsForChat]);
//
//     // Clear chat
//     const clearChat = useCallback(() => {
//         if (window.confirm('确定要清空对话历史吗？')) {
//             const welcomeMsg = messages.find(m => m.id === 'welcome');
//             if (welcomeMsg) {
//                 addMessage(welcomeMsg);
//             }
//         }
//     }, [messages, addMessage]);
//
//     return {
//         // State
//         messages,
//         inputMessage,
//         isTyping,
//         chatMode,
//         selectedCardsForChat,
//         showCardSelection,
//         messagesEndRef,
//         inputRef,
//
//         // Actions
//         setInputMessage,
//         sendMessage,
//         handleModeChange,
//         toggleCardSelection,
//         setShowCardSelection,
//         clearChat
//     };
// }

