import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { ChatMessage, ChatMode } from '../types/chat.types';
import { ChromeAIService } from '../services/ai/chromeAI';
import { createCardContext } from '../services/ai/prompts';

interface UseChatOptions {
    autoScroll?: boolean;
    welcomeMessage?: string;
}

export function useChat(options: UseChatOptions = {}) {
    const {
        autoScroll = true,
        welcomeMessage = '你好！我可以帮你分析知识卡片、生成思维导图，或进行自由对话。请选择一个模式开始吧。'
    } = options;

    const {
        messages,
        addMessage,
        chatMode,
        setChatMode,
        selectedCardsForChat,
        setSelectedCardsForChat,
        isTyping,
        setIsTyping,
        cards
    } = useStore();

    const [inputMessage, setInputMessage] = useState('');
    const [showCardSelection, setShowCardSelection] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (autoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, autoScroll]);

    // Initialize with welcome message
    useEffect(() => {
        if (messages.length === 0 && welcomeMessage) {
            addMessage({
                id: 'welcome',
                role: 'assistant',
                content: welcomeMessage,
                timestamp: Date.now(),
                status: 'sent'
            });
        }
    }, []);

    // Handle sending messages
    const sendMessage = useCallback(async (content?: string) => {
        const messageToSend = content || inputMessage;

        if (!messageToSend.trim()) return;

        // Validate chat mode requirements
        if (chatMode === 'cards' && selectedCardsForChat.length === 0) {
            alert('请先选择相关的知识卡片');
            return;
        }

        // Create user message
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: messageToSend,
            timestamp: Date.now(),
            status: 'sending'
        };

        addMessage(userMessage);
        setInputMessage('');
        setIsTyping(true);

        try {
            // Prepare context based on chat mode
            let context = '';

            if (chatMode === 'cards' && selectedCardsForChat.length > 0) {
                const selectedCards = cards.filter(c => selectedCardsForChat.includes(c.id));
                context = createCardContext(selectedCards);
            } else if (chatMode === 'mindmap') {
                context = `Generate a mindmap structure for: ${messageToSend}`;
            }

            // Get AI response
            const response = await ChromeAIService.prompt(messageToSend, context);

            // Add assistant message
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: Date.now(),
                status: 'sent',
                relatedCards: chatMode === 'cards' ? selectedCardsForChat : undefined
            };

            addMessage(assistantMessage);
        } catch (error) {
            console.error('Failed to get AI response:', error);

            // Add error message
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '抱歉，获取回复时出现错误。请稍后再试。',
                timestamp: Date.now(),
                status: 'error'
            });
        } finally {
            setIsTyping(false);
        }
    }, [inputMessage, chatMode, selectedCardsForChat, cards, addMessage, setIsTyping]);

    // Handle mode changes
    const handleModeChange = useCallback((mode: ChatMode) => {
        setChatMode(mode);

        // Reset card selection when leaving cards mode
        if (mode !== 'cards') {
            setShowCardSelection(false);
            setSelectedCardsForChat([]);
        }

        // Focus input after mode change
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    }, [setChatMode, setSelectedCardsForChat]);

    // Handle card selection
    const toggleCardSelection = useCallback((cardId: string) => {
        setSelectedCardsForChat(
            selectedCardsForChat.includes(cardId)
                ? selectedCardsForChat.filter(id => id !== cardId)
                : [...selectedCardsForChat, cardId]
        );
    }, [selectedCardsForChat, setSelectedCardsForChat]);

    // Clear chat
    const clearChat = useCallback(() => {
        if (window.confirm('确定要清空对话历史吗？')) {
            // Keep only welcome message
            const welcomeMsg = messages.find(m => m.id === 'welcome');
            useStore.setState({
                messages: welcomeMsg ? [welcomeMsg] : []
            });
        }
    }, [messages]);

    // Generate suggestions based on cards
    const generateSuggestions = useCallback((): string[] => {
        if (cards.length === 0) return [];

        const suggestions = [
            '总结我的知识卡片',
            '找出相关的知识点',
            '生成学习路径',
            '创建复习计划'
        ];

        if (chatMode === 'cards' && selectedCardsForChat.length > 0) {
            suggestions.push(
                '比较这些卡片的内容',
                '找出共同主题',
                '生成深度分析'
            );
        }

        return suggestions;
    }, [cards, chatMode, selectedCardsForChat]);

    return {
        // State
        messages,
        inputMessage,
        isTyping,
        chatMode,
        selectedCardsForChat,
        showCardSelection,
        messagesEndRef,
        inputRef,

        // Actions
        setInputMessage,
        sendMessage,
        handleModeChange,
        toggleCardSelection,
        setShowCardSelection,
        clearChat,
        generateSuggestions,
    };
}
