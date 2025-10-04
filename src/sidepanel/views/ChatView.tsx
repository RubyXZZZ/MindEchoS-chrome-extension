import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, BookOpen, GitCompare, GraduationCap, PenTool, Check, X, Save, Layers } from 'lucide-react';
import { useStore } from '../store';
import { ChatMessage } from '../types/chat.types';
import { formatTime } from '../utils/formatters';
import { usePromptAPI } from '../hooks/usePromptAPI';
import { ChatMarkdownRenderer } from '../components/chat/ChatMarkdownRenderer';
import { WRITING_TASKS, WritingTaskType } from '../types/writing.types';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { STORAGE_KEYS } from '../utils/constants';

const MessageBubble = React.memo<{
    msg: ChatMessage;
    cards: Array<{ id: string; title: string; content: string }>;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onSave: (id: string) => void;
}>(({ msg, cards, onAccept, onReject, onSave }) => (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={msg.role === 'user' ? 'max-w-[85%]' : 'max-w-[95%]'}>
            <div className={`px-4 py-2.5 text-sm overflow-hidden ${
                msg.role === 'user'
                    ? 'bg-emerald-100 text-gray-800 rounded-2xl rounded-br-sm shadow-sm'
                    : 'bg-white/90 text-gray-800 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100'
            }`}>
                {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                ) : (
                    <>
                        {msg.content ? (
                            <ChatMarkdownRenderer
                                content={msg.content}
                                className="text-sm"
                                cards={cards}
                            />
                        ) : (
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        )}

                        {msg.content && msg.status !== 'rejected' && (
                            <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-gray-100">
                                {msg.status === 'accepted' ? (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Accepted
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => onAccept(msg.id)}
                                        className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded hover:bg-green-100 flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" />
                                        Accept
                                    </button>
                                )}

                                <button
                                    onClick={() => onReject(msg.id)}
                                    className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded hover:bg-red-100 flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" />
                                    Improve
                                </button>

                                <button
                                    onClick={() => onSave(msg.id)}
                                    className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded hover:bg-purple-100 flex items-center gap-1"
                                >
                                    <Save className="w-3 h-3" />
                                    Save
                                </button>
                            </div>
                        )}

                        {msg.status === 'rejected' && msg.rejectionReason && (
                            <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                Improving: {msg.rejectionReason}
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className={`mt-1 px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                {msg.role === 'assistant' && msg.triggeredBy && (
                    <span className="text-[10px] text-emerald-600 ml-2">
                        • Generated by {msg.triggeredBy}
                    </span>
                )}
            </div>
        </div>
    </div>
));

export const ChatView: React.FC = () => {
    const {
        messages,
        addMessage,
        updateMessage,
        clearMessages,
        selectedCardsForChat,
        setSelectedCardsForChat,
        cards,
        loadCurrentChat,
        saveCurrentChat,
        archiveCurrentChat
    } = useStore();

    const {
        isAvailable,
        isChecking,
        isGenerating,
        initializeSession,
        sendMessage,
        generateImprovement,
        destroySession
    } = usePromptAPI();

    const [inputMessage, setInputMessage] = useState('');
    const [showCardSelector, setShowCardSelector] = useState(false);
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

    // 加载上次对话
    useEffect(() => {
        loadCurrentChat();
    }, []);

    // 优化：只在生成完成后保存
    useEffect(() => {
        const hasPendingMsg = messages.some(m => m.status === 'pending');

        if (messages.length > 0 && !hasPendingMsg) {
            saveCurrentChat();
            console.log('[ChatView] Chat saved after generation complete');
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
                console.log('[ChatView] Session already ready, skipping init');
                return;
            }

            setIsInitializing(true);
            setSessionReady(false);
            console.log('[ChatView] Initializing session with', selectedCards.length, 'cards...');

            try {
                const success = await initializeSession('chat', selectedCards);
                if (success) {
                    lastInitCardsRef.current = currentCardsKey;
                    setSessionReady(true);
                    console.log('[ChatView] ✓ Session ready');
                } else {
                    setSessionReady(false);
                    console.error('[ChatView] ✗ Session init failed');
                }
            } catch (error) {
                console.error('[ChatView] Init error:', error);
                setSessionReady(false);
            } finally {
                setIsInitializing(false);
            }
        };

        initSession();
    }, [isAvailable, selectedCardsForChat]);

    // 只在组件卸载时销毁 session
    useEffect(() => {
        return () => {
            console.log('[ChatView] Unmounting, destroying session');
            destroySession();
        };
    }, []);

    useEffect(() => {
        if (autoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, autoScroll]);

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

        // 清除持久化的对话
        await chrome.storage.local.remove(STORAGE_KEYS.CURRENT_CHAT);
        console.log('[ChatView] Current chat deleted from storage');
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

        let prompt = '';
        const hasCards = selectedCards.length > 0;

        switch(action) {
            case 'understand':
                prompt = hasCards
                    ? `Please help me understand the selected cards.`
                    : `I'd like to understand a topic. What would you like to learn about?`;
                break;

            case 'compare':
                if (!hasCards || selectedCards.length < 2) {
                    alert('Compare requires 2 or more cards. Please select additional cards.');
                    setActiveButton(null);
                    return;
                }
                prompt = `Please compare and contrast the selected cards, including trade-offs and practical implications.`;
                break;

            case 'quiz':
                if (!hasCards) {
                    alert('Quiz requires at least 1 card. Please select cards first.');
                    setActiveButton(null);
                    return;
                }
                const suggestedQuestions = Math.min(selectedCards.length * 3, 10);
                const numQuestions = window.prompt(`How many questions would you like? (Suggested: ${suggestedQuestions} based on ${selectedCards.length} card${selectedCards.length > 1 ? 's' : ''})`) || suggestedQuestions.toString();

                prompt = `Generate ${numQuestions} multiple-choice questions to test understanding of the selected cards.`;
                break;
        }

        if (prompt) {
            const userMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'user',
                content: prompt,
                timestamp: Date.now(),
                mode: 'chat'
            };
            addMessage(userMsg);

            const aiMsgId = (Date.now() + 1).toString();
            addMessage({
                id: aiMsgId,
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
                mode: 'chat',
                status: 'pending',
                triggeredBy: action === 'understand' ? 'Understand' :
                    action === 'compare' ? 'Compare' :
                        action === 'quiz' ? 'Quiz' :
                            action.charAt(0).toUpperCase() + action.slice(1)
            } as ChatMessage);

            abortController.current = new AbortController();

            try {
                let finalContent = '';
                const result = await sendMessage(
                    prompt,
                    (text) => {
                        if (text) {
                            finalContent = text;
                            updateMessage(aiMsgId, { content: text });
                        }
                    },
                    abortController.current.signal
                );

                const contentToSave = result || finalContent;
                if (contentToSave) {
                    updateMessage(aiMsgId, { content: contentToSave, status: 'accepted' });
                    console.log('[ChatView] Quick action completed');
                } else {
                    updateMessage(aiMsgId, { content: 'Error: No content generated', status: 'rejected' });
                }
            } catch (error: any) {
                if (error.message !== 'Aborted') {
                    updateMessage(aiMsgId, { content: 'Error: Failed to generate response', status: 'rejected' });
                    console.error('[ChatView] Quick action error:', error);
                }
            } finally {
                abortController.current = null;
                setActiveButton(null);
            }
        }
    }, [isGenerating, isInitializing, sessionReady, selectedCards, showWriteMenu, addMessage, updateMessage, sendMessage]);

    const handleWriteTask = useCallback(async (taskType: string) => {
        setShowWriteMenu(false);

        if (isGenerating || isInitializing || !sessionReady) return;

        setActiveButton('write');

        const taskLabels: Record<string, string> = {
            summary: 'Summary',
            outline: 'Outline',
            draft: 'Report Draft'
        };

        const taskConfig = WRITING_TASKS[taskType as WritingTaskType];
        if (!taskConfig) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: `Generate ${taskLabels[taskType] || 'content'}`,
            timestamp: Date.now(),
            mode: 'chat'
        };
        addMessage(userMsg);

        const aiMsgId = (Date.now() + 1).toString();
        addMessage({
            id: aiMsgId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            mode: 'chat',
            status: 'pending',
            triggeredBy: `Write: ${taskLabels[taskType]}`
        } as ChatMessage);

        abortController.current = new AbortController();

        try {
            let finalContent = '';

            const result = await sendMessage(
                taskConfig.prompt,
                (text) => {
                    if (text) {
                        finalContent = text;
                        updateMessage(aiMsgId, { content: text });
                    }
                },
                abortController.current.signal
            );

            const contentToSave = result || finalContent;
            if (contentToSave) {
                updateMessage(aiMsgId, { content: contentToSave, status: 'accepted' });
                console.log('[ChatView] Write task completed:', taskType);
            } else {
                updateMessage(aiMsgId, { content: 'Error: No content generated', status: 'rejected' });
            }
        } catch (error: any) {
            if (error.message !== 'Aborted') {
                updateMessage(aiMsgId, { content: 'Error: Failed to generate response', status: 'rejected' });
                console.error('[ChatView] Write task error:', error);
            }
        } finally {
            abortController.current = null;
            setActiveButton(null);
        }
    }, [isGenerating, isInitializing, sessionReady, addMessage, updateMessage, sendMessage]);

    const handleSend = useCallback(async () => {
        if (!inputMessage.trim() || isGenerating || isInitializing || !sessionReady) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage,
            timestamp: Date.now(),
            mode: 'chat'
        };
        addMessage(userMsg);
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
            const result = await sendMessage(
                inputMessage,
                (text) => {
                    if (text && text.length > 0) {
                        finalContent = text;
                        updateMessage(aiMsgId, { content: text });
                    }
                },
                abortController.current.signal
            );

            const contentToSave = result || finalContent;
            if (contentToSave) {
                updateMessage(aiMsgId, { content: contentToSave, status: 'accepted' });
                console.log('[ChatView] Message sent, final length:', contentToSave.length);
            } else {
                updateMessage(aiMsgId, { content: 'Error: No content generated', status: 'rejected' });
            }
        } catch (error: any) {
            if (error.message !== 'Aborted') {
                updateMessage(aiMsgId, { content: 'Error: Failed to generate response', status: 'rejected' });
                console.error('[ChatView] Send message error:', error);
            }
        } finally {
            abortController.current = null;
        }
    }, [inputMessage, isGenerating, isInitializing, sessionReady, addMessage, updateMessage, sendMessage]);

    const handleStop = useCallback(() => {
        abortController.current?.abort();
        abortController.current = null;
    }, []);

    const handleAccept = useCallback((msgId: string) => {
        updateMessage(msgId, { status: 'accepted' });
    }, [updateMessage]);

    const handleReject = useCallback(async (msgId: string) => {
        const msg = messages.find(m => m.id === msgId);
        if (!msg) return;

        const reason = prompt('What would you like to improve?');
        if (!reason) return;

        updateMessage(msgId, { status: 'rejected', rejectionReason: reason });

        const improvedMsgId = (Date.now() + 1).toString();
        addMessage({
            id: improvedMsgId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            mode: 'chat',
            status: 'pending'
        });

        abortController.current = new AbortController();
        try {
            await generateImprovement(
                msg.content,
                reason,
                (text) => updateMessage(improvedMsgId, { content: text }),
                abortController.current.signal
            );
            updateMessage(improvedMsgId, { status: 'accepted' });
        } catch {
            updateMessage(improvedMsgId, { content: 'Failed to improve', status: 'rejected' });
        } finally {
            abortController.current = null;
        }
    }, [messages, addMessage, updateMessage, generateImprovement]);

    const handleSaveAsCard = useCallback((_msgId: string) => {
        alert('Save as Card - TODO');
    }, []);

    const toggleCard = useCallback((cardId: string) => {
        setSelectedCardsForChat(
            selectedCardsForChat.includes(cardId)
                ? selectedCardsForChat.filter(id => id !== cardId)
                : [...selectedCardsForChat, cardId]
        );
    }, [selectedCardsForChat, setSelectedCardsForChat]);

    if (isChecking) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 rounded-full border-3 border-emerald-200 border-t-emerald-500 animate-spin mx-auto mb-3"></div>
                    <p className="text-xs text-gray-600">Loading AI...</p>
                </div>
            </div>
        );
    }

    if (isInitializing) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 rounded-full border-3 border-emerald-200 border-t-emerald-500 animate-spin mx-auto mb-3"></div>
                    <p className="text-xs text-gray-600">Initializing AI Session...</p>
                    <p className="text-[10px] text-gray-400 mt-2">This may take a few seconds on first use</p>
                </div>
            </div>
        );
    }

    if (!isAvailable) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <div className="text-center"><p className="text-sm text-gray-600">Prompt API unavailable</p></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-gray-50/50 to-white">
            <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-3 py-2">
                <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-emerald-700">
                        AI Assistant
                    </div>

                    <button
                        onClick={() => setShowCardSelector(!showCardSelector)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                            selectedCards.length > 0
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600'
                                : 'text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        {selectedCards.length > 0 ? `${selectedCards.length} Card${selectedCards.length > 1 ? 's' : ''} Selected` : 'Select Cards'}
                    </button>

                    <button
                        onClick={handleNewConversation}
                        disabled={isGenerating || isInitializing}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                        + New Chat
                    </button>
                </div>

                {showCardSelector && (
                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900">Select Context Cards</h4>
                            <button
                                onClick={() => setShowCardSelector(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {cards.filter(card => card.id !== 'sample-card-1').map(card => {
                                const isSelected = selectedCardsForChat.includes(card.id);
                                return (
                                    <label
                                        key={card.id}
                                        className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-emerald-50 border border-emerald-300'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleCard(card.id)}
                                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {card.title}
                                            </p>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                                {card.content}
                                            </p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setShowCardSelector(false)}
                            className="w-full mt-3 px-3 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>

            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 pt-2 pb-4"
            >
                {selectedCards.length === 0 && (
                    <div className="px-3 py-1 mb-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700 text-center">
                            💡 Select cards above for better context
                        </p>
                    </div>
                )}

                {messages.length === 0 && sessionReady && (
                    <div className="max-w-2xl mx-auto mt-8 mb-8">
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                Welcome! How can I help you today?
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                I'm here to assist with your knowledge cards and answer questions. Use the quick actions below or type your own question.
                            </p>

                            <div className="bg-amber-50/70 rounded-lg p-3 mb-4 border border-amber-200">
                                <p className="text-xs text-gray-700">
                                    <span className="font-medium">Tip:</span> Select cards above for context-aware responses.
                                    {selectedCards.length === 0 ? (
                                        <span className="text-emerald-600"> No cards selected yet.</span>
                                    ) : (
                                        <span className="text-emerald-600"> {selectedCards.length} card{selectedCards.length > 1 ? 's' : ''} selected.</span>
                                    )}
                                </p>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-800">Understand</span>
                                        <p className="text-xs text-gray-600 mt-0.5">Explain concepts and clarify ideas</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <GitCompare className="w-3.5 h-3.5 text-purple-600" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-800">Compare</span>
                                        <span className="text-xs text-purple-600 ml-1">(2+ cards)</span>
                                        <p className="text-xs text-gray-600 mt-0.5">Contrast options and weigh trade-offs</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-800">Quiz</span>
                                        <p className="text-xs text-gray-600 mt-0.5">Test your knowledge with questions</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <PenTool className="w-3.5 h-3.5 text-green-600" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-800">Write</span>
                                        <p className="text-xs text-gray-600 mt-0.5">Generate summaries, outlines, and drafts</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-emerald-200/50">
                                <p className="text-xs text-gray-600">
                                    <span className="font-medium">Ask anything</span> - Type your question below
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {messages.map(msg => (
                        <MessageBubble
                            key={msg.id}
                            msg={msg}
                            cards={selectedCards}
                            onAccept={handleAccept}
                            onReject={handleReject}
                            onSave={handleSaveAsCard}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="flex-shrink-0 px-3 py-1.5 bg-gray-50/50 relative">
                {showWriteMenu && (
                    <div className="write-menu-container absolute bottom-full right-3 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-56 z-50">
                        <div className="px-3 py-1 text-[10px] font-medium text-gray-500 uppercase">
                            Writing Tasks
                        </div>
                        <button
                            onClick={() => handleWriteTask('summary')}
                            className="w-full px-3 py-2 text-left hover:bg-emerald-50 transition-colors flex items-center gap-2"
                        >
                            <span className="text-base">📝</span>
                            <div>
                                <div className="text-sm font-medium text-gray-900">Summary</div>
                                <div className="text-xs text-gray-500">Executive summary</div>
                            </div>
                        </button>
                        <button
                            onClick={() => handleWriteTask('outline')}
                            className="w-full px-3 py-2 text-left hover:bg-emerald-50 transition-colors flex items-center gap-2"
                        >
                            <span className="text-base">📋</span>
                            <div>
                                <div className="text-sm font-medium text-gray-900">Outline</div>
                                <div className="text-xs text-gray-500">Structural framework</div>
                            </div>
                        </button>
                        <button
                            onClick={() => handleWriteTask('draft')}
                            className="w-full px-3 py-2 text-left hover:bg-emerald-50 transition-colors flex items-center gap-2"
                        >
                            <span className="text-base">📄</span>
                            <div>
                                <div className="text-sm font-medium text-gray-900">Report Draft</div>
                                <div className="text-xs text-gray-500">Initial version</div>
                            </div>
                        </button>
                    </div>
                )}

                <div className="flex gap-2 justify-center">
                    <button
                        onClick={() => handleQuickAction('understand')}
                        disabled={isGenerating || isInitializing || !sessionReady}
                        className={`px-2.5 py-1.5 rounded-lg shadow-lg border transition-all disabled:opacity-60 flex items-center gap-1.5 group ${
                            activeButton === 'understand'
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xl'
                                : 'bg-white hover:bg-emerald-500 hover:text-white border-gray-200 hover:border-emerald-600'
                        }`}
                    >
                        <BookOpen className={`w-3.5 h-3.5 ${
                            activeButton === 'understand' ? 'text-white' : 'text-blue-500 group-hover:text-white'
                        }`} />
                        <span className="text-xs font-medium">Understand</span>
                    </button>

                    <button
                        onClick={() => handleQuickAction('compare')}
                        disabled={isGenerating || isInitializing || !sessionReady}
                        className={`px-2.5 py-1.5 rounded-lg shadow-lg border transition-all disabled:opacity-60 flex items-center gap-1.5 group ${
                            activeButton === 'compare'
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xl'
                                : 'bg-white hover:bg-emerald-500 hover:text-white border-gray-200 hover:border-emerald-600'
                        }`}
                    >
                        <GitCompare className={`w-3.5 h-3.5 ${
                            activeButton === 'compare' ? 'text-white' : 'text-purple-500 group-hover:text-white'
                        }`} />
                        <span className="text-xs font-medium">Compare</span>
                    </button>

                    <button
                        onClick={() => handleQuickAction('quiz')}
                        disabled={isGenerating || isInitializing || !sessionReady}
                        className={`px-2.5 py-1.5 rounded-lg shadow-lg border transition-all disabled:opacity-60 flex items-center gap-1.5 group ${
                            activeButton === 'quiz'
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xl'
                                : 'bg-white hover:bg-emerald-500 hover:text-white border-gray-200 hover:border-emerald-600'
                        }`}
                    >
                        <GraduationCap className={`w-3.5 h-3.5 ${
                            activeButton === 'quiz' ? 'text-white' : 'text-amber-500 group-hover:text-white'
                        }`} />
                        <span className="text-xs font-medium">Quiz</span>
                    </button>

                    <button
                        onClick={() => handleQuickAction('write')}
                        disabled={isGenerating || isInitializing || !sessionReady}
                        className={`px-2.5 py-1.5 rounded-lg shadow-lg border transition-all disabled:opacity-60 flex items-center gap-1.5 group ${
                            activeButton === 'write' || showWriteMenu
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xl'
                                : 'bg-white hover:bg-emerald-500 hover:text-white border-gray-200 hover:border-emerald-600'
                        }`}
                    >
                        <PenTool className={`w-3.5 h-3.5 ${
                            activeButton === 'write' || showWriteMenu ? 'text-white' : 'text-green-500 group-hover:text-white'
                        }`} />
                        <span className="text-xs font-medium">Write</span>
                    </button>
                </div>
            </div>

            <div className="flex-shrink-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-lg">
                {isInitializing && (
                    <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
                        <p className="text-xs text-amber-700 text-center flex items-center justify-center gap-2">
                            <div className="w-3 h-3 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin" />
                            Preparing AI session, please wait...
                        </p>
                    </div>
                )}

                <div className="px-3 py-3">
                    <div className="relative">
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Message AI..."
                            disabled={isGenerating || isInitializing || !sessionReady}
                            className="w-full px-3 py-2.5 pr-12 bg-gray-50 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                            rows={3}
                        />

                        {isGenerating ? (
                            <button
                                onClick={handleStop}
                                className="absolute bottom-2 right-2 w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                            >
                                <Square className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={!inputMessage.trim() || isInitializing || !sessionReady}
                                className="absolute bottom-2 right-2 w-8 h-8 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showNewChatDialog}
                title="Start New Conversation"
                message="Starting a new conversation will delete the current one. Would you like to DELETE? (Note: Archiving will consume storage space)"
                confirmText="Delete & Start New"
                cancelText="Archive & Start New"
                onConfirm={handleDeleteAndNew}
                onCancel={handleArchiveAndNew}
            />
        </div>
    );
};