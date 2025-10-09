// hooks/useChat.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { usePromptAPI } from './usePromptAPI';
import { ChatMessage } from '../types/chat.types';
import { FUNCTION_PROMPTS } from '../services/ai/promptAI';
import { WRITING_TASKS, WritingTaskType } from '../types/writing.types';
import { STORAGE_KEYS } from '../utils/constants';

export function useChat() {
    const {
        messages, addMessage, updateMessage, clearMessages,
        selectedCardsForChat, setSelectedCardsForChat, cards,
        loadCurrentChat, saveCurrentChat, archiveCurrentChat
    } = useStore();

    const {
        isAvailable, isChecking, isGenerating,
        initializeSession, sendMessage, destroySession
    } = usePromptAPI();

    const [inputMessage, setInputMessage] = useState('');
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [showWriteMenu, setShowWriteMenu] = useState(false);
    const [showNewChatDialog, setShowNewChatDialog] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const abortController = useRef<AbortController | null>(null);
    const lastInitCardsRef = useRef<string>('');

    const selectedCards = cards.filter(c => selectedCardsForChat.includes(c.id));

    // 加载对话
    useEffect(() => { loadCurrentChat(); }, []);

    // 保存对话（生成完成后）
    useEffect(() => {
        const hasPendingMsg = messages.some(m => m.status === 'pending');
        if (messages.length > 0 && !hasPendingMsg) {
            saveCurrentChat();
        }
    }, [messages, selectedCardsForChat]);

    // Session 初始化
    useEffect(() => {
        const initSession = async () => {
            if (!isAvailable) {
                setSessionReady(false);
                return;
            }

            const currentCardsKey = JSON.stringify(selectedCardsForChat.sort());
            if (lastInitCardsRef.current === currentCardsKey && sessionReady) {
                return;
            }

            setIsInitializing(true);
            setSessionReady(false);

            try {
                const success = await initializeSession(selectedCards);
                if (success) {
                    lastInitCardsRef.current = currentCardsKey;
                    setSessionReady(true);
                }
            } finally {
                setIsInitializing(false);
            }
        };

        initSession();
    }, [isAvailable, selectedCardsForChat]);

    // 组件卸载时销毁
    useEffect(() => {
        return () => {
            destroySession();
        };
    }, []);

    // 自动滚动
    useEffect(() => {
        if (autoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, autoScroll]);

    // Write 菜单外部点击
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.write-menu-container')) {
                setShowWriteMenu(false);
            }
        };
        if (showWriteMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showWriteMenu]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50;
        setAutoScroll(isAtBottom);
    }, []);

    const toggleCard = useCallback((cardId: string) => {
        setSelectedCardsForChat(
            selectedCardsForChat.includes(cardId)
                ? selectedCardsForChat.filter(id => id !== cardId)
                : [...selectedCardsForChat, cardId]
        );
    }, [selectedCardsForChat, setSelectedCardsForChat]);

    // 直接设置卡片选择（用于批量操作）
    const setCardsSelection = useCallback((cardIds: string[]) => {
        setSelectedCardsForChat(cardIds);
    }, [setSelectedCardsForChat]);

    const handleNewConversation = useCallback(() => {
        if (isGenerating) return;
        if (messages.length > 0) {
            setShowNewChatDialog(true);
        } else {
            clearMessages();
            setSelectedCardsForChat([]);
        }
    }, [isGenerating, messages.length]);

    const handleDeleteAndNew = useCallback(async () => {
        setShowNewChatDialog(false);
        destroySession();
        setSessionReady(false);
        lastInitCardsRef.current = '';
        clearMessages();
        setSelectedCardsForChat([]);
        await chrome.storage.local.remove(STORAGE_KEYS.CURRENT_CHAT);
    }, [clearMessages, setSelectedCardsForChat, destroySession]);

    const handleArchiveAndNew = useCallback(async () => {
        setShowNewChatDialog(false);
        destroySession();
        setSessionReady(false);
        lastInitCardsRef.current = '';
        await archiveCurrentChat();
    }, [archiveCurrentChat, destroySession]);

    const handleQuickAction = useCallback(async (action: string) => {
        if (isGenerating || isInitializing || !sessionReady) return;

        if (action === 'write') {
            setShowWriteMenu(!showWriteMenu);
            return;
        }

        setActiveButton(action);

        let displayMessage = '';
        let aiPrompt = '';

        switch(action) {
            case 'understand':
                displayMessage = selectedCards.length === 1 ? 'Understand this card' : `Understand these ${selectedCards.length} cards`;
                aiPrompt = FUNCTION_PROMPTS.understand.getPrompt(selectedCards.length);
                break;

            case 'compare':
                if (!selectedCards || selectedCards.length < 2) {
                    alert('Compare requires 2 or more cards.');
                    setActiveButton(null);
                    return;
                }
                displayMessage = `Compare ${selectedCards.length} cards`;
                aiPrompt = FUNCTION_PROMPTS.compare.getPrompt(selectedCards.length);
                break;

            case 'quiz':
                if (!selectedCards || selectedCards.length === 0) {
                    alert('Quiz requires at least 1 card.');
                    setActiveButton(null);
                    return;
                }
                displayMessage = selectedCards.length === 1 ? 'Generate quiz' : `Generate quiz from ${selectedCards.length} cards`;
                aiPrompt = FUNCTION_PROMPTS.quiz.getPrompt(selectedCards.length);
                break;
        }

        if (displayMessage && aiPrompt) {
            addMessage({
                id: Date.now().toString(),
                role: 'user',
                content: displayMessage,
                timestamp: Date.now(),
                mode: 'chat'
            });

            const aiMsgId = (Date.now() + 1).toString();
            addMessage({
                id: aiMsgId,
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
                mode: 'chat',
                status: 'pending',
                triggeredBy: action.charAt(0).toUpperCase() + action.slice(1)
            } as ChatMessage);

            abortController.current = new AbortController();

            try {
                let finalContent = '';
                const result = await sendMessage(aiPrompt, (text) => {
                    if (text) {
                        finalContent = text;
                        updateMessage(aiMsgId, { content: text });
                    }
                }, abortController.current.signal);

                if (result || finalContent) {
                    updateMessage(aiMsgId, { content: result || finalContent, status: 'accepted' });
                } else {
                    updateMessage(aiMsgId, { content: 'Error: No content', status: 'rejected' });
                }
            } catch (error: any) {
                if (error.message !== 'Aborted') {
                    updateMessage(aiMsgId, { content: 'Error: Failed to generate', status: 'rejected' });
                }
            } finally {
                abortController.current = null;
                setActiveButton(null);
            }
        }
    }, [isGenerating, isInitializing, sessionReady, selectedCards, showWriteMenu, addMessage, updateMessage, sendMessage]);

    const handleWriteTask = useCallback(async (taskType: WritingTaskType) => {
        setShowWriteMenu(false);
        if (isGenerating || isInitializing || !sessionReady) return;

        setActiveButton('write');

        const taskConfig = WRITING_TASKS[taskType];
        if (!taskConfig) return;

        addMessage({
            id: Date.now().toString(),
            role: 'user',
            content: `Generate ${taskConfig.label}`,
            timestamp: Date.now(),
            mode: 'chat'
        });

        const aiMsgId = (Date.now() + 1).toString();
        addMessage({
            id: aiMsgId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            mode: 'chat',
            status: 'pending',
            triggeredBy: `Write: ${taskConfig.label}`
        } as ChatMessage);

        abortController.current = new AbortController();

        try {
            let finalContent = '';
            const result = await sendMessage(taskConfig.prompt, (text) => {
                if (text) {
                    finalContent = text;
                    updateMessage(aiMsgId, { content: text });
                }
            }, abortController.current.signal);

            if (result || finalContent) {
                updateMessage(aiMsgId, { content: result || finalContent, status: 'accepted' });
            } else {
                updateMessage(aiMsgId, { content: 'Error: No content', status: 'rejected' });
            }
        } catch (error: any) {
            if (error.message !== 'Aborted') {
                updateMessage(aiMsgId, { content: 'Error: Failed to generate', status: 'rejected' });
            }
        } finally {
            abortController.current = null;
            setActiveButton(null);
        }
    }, [isGenerating, isInitializing, sessionReady, addMessage, updateMessage, sendMessage]);

    const handleSend = useCallback(async () => {
        if (!inputMessage.trim() || isGenerating || isInitializing || !sessionReady) return;

        addMessage({
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage,
            timestamp: Date.now(),
            mode: 'chat'
        });
        setInputMessage('');

        const aiMsgId = (Date.now() + 1).toString();
        addMessage({
            id: aiMsgId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            mode: 'chat',
            status: 'pending'
        });

        abortController.current = new AbortController();

        try {
            let finalContent = '';
            const result = await sendMessage(inputMessage, (text) => {
                if (text && text.length > 0) {
                    finalContent = text;
                    updateMessage(aiMsgId, { content: text });
                }
            }, abortController.current.signal);

            if (result || finalContent) {
                updateMessage(aiMsgId, { content: result || finalContent, status: 'accepted' });
            } else {
                updateMessage(aiMsgId, { content: 'Error: No content', status: 'rejected' });
            }
        } catch (error: any) {
            if (error.message !== 'Aborted') {
                updateMessage(aiMsgId, { content: 'Error: Failed to generate', status: 'rejected' });
            }
        } finally {
            abortController.current = null;
        }
    }, [inputMessage, isGenerating, isInitializing, sessionReady, addMessage, updateMessage, sendMessage]);

    const handleStop = useCallback(() => {
        abortController.current?.abort();
        abortController.current = null;
    }, []);

    const handleCopy = useCallback(async (msgId: string) => {
        const msg = messages.find(m => m.id === msgId);
        if (!msg) return;

        try {
            await navigator.clipboard.writeText(msg.content);
        } catch (error) {
            console.error('[useChat] Copy failed:', error);
        }
    }, [messages]);

    return {
        // 状态
        messages,
        selectedCards,
        selectedCardIds: selectedCardsForChat,
        allCards: cards,
        inputMessage,
        isChecking,
        isInitializing,
        isGenerating,
        isAvailable,
        sessionReady,
        activeButton,
        showWriteMenu,
        showNewChatDialog,

        // Refs
        messagesEndRef,
        messagesContainerRef,

        // Handlers
        handleQuickAction,
        handleWriteTask,
        handleSend,
        handleStop,
        handleCopy,
        handleNewConversation,
        handleDeleteAndNew,
        handleArchiveAndNew,
        handleScroll,
        toggleCard,
        setCardsSelection,  // ← 添加
        setInputMessage
    };
}