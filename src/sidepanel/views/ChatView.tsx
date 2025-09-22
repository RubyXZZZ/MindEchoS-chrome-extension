import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowUp, MessageSquare, Layers, Brain, Paperclip } from 'lucide-react';
import { useStore } from '../store';
import { ChatMessage } from '../types/chat.types';
import { formatTime } from '../utils/formatters';
import { ChromeAIService } from '../services/ai/chromeAI';

export const ChatView: React.FC = () => {
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

    const handleSend = async () => {
        if (!inputMessage.trim()) return;

        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage,
            timestamp: Date.now(),
            status: 'sent'
        };

        addMessage(newMsg);
        setInputMessage('');
        setIsTyping(true);

        // Get AI response
        try {
            const response = await ChromeAIService.prompt(
                inputMessage,
                chatMode === 'cards' ? JSON.stringify(selectedCardsForChat) : undefined
            );

            setIsTyping(false);
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: Date.now(),
                status: 'sent'
            });
        } catch (error) {
            setIsTyping(false);
            console.error('AI response error:', error);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Initialize with welcome message if empty
    useEffect(() => {
        if (messages.length === 0) {
            addMessage({
                id: '1',
                role: 'assistant',
                content: '你好！我可以帮你分析知识卡片、生成思维导图，或进行自由对话。请选择一个模式开始吧。',
                timestamp: Date.now(),
                status: 'sent'
            });
        }
    }, []);

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-gray-50/50 via-transparent to-gray-100/50">
            {/* Chat Header */}
            <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
                        <p className="text-xs text-gray-500">
                            {chatMode === 'free' ? '自由对话模式' :
                                chatMode === 'cards' ? `卡片对话模式 ${selectedCardsForChat.length > 0 ? `(已选${selectedCardsForChat.length}张)` : ''}` :
                                    '思维导图模式'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-4 space-y-3">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%]`}>
                                <div className={`px-4 py-2.5 text-sm ${
                                    msg.role === 'user'
                                        ? 'bg-emerald-100 text-gray-800 rounded-2xl rounded-br-sm shadow-sm'
                                        : 'bg-white/90 text-gray-800 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100'
                                }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                <div className={`mt-1 px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <span className="text-[10px] text-gray-400">
                    {formatTime(msg.timestamp)}
                  </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white/90 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Card Selection Panel */}
            {showCardSelection && chatMode === 'cards' && (
                <div className="px-4 py-2 bg-white/90 backdrop-blur-sm border-t border-gray-200/50 max-h-48 overflow-y-auto">
                    <div className="text-xs font-medium text-gray-700 mb-2">选择相关卡片</div>
                    <div className="grid grid-cols-1 gap-1">
                        {cards.map(card => (
                            <label
                                key={card.id}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedCardsForChat.includes(card.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedCardsForChat([...selectedCardsForChat, card.id]);
                                        } else {
                                            setSelectedCardsForChat(selectedCardsForChat.filter(id => id !== card.id));
                                        }
                                    }}
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-xs text-gray-700 flex-1 truncate">{card.title}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200/50">
                <div className="p-3">
                    <div className="bg-white border border-gray-300 rounded-xl focus-within:border-emerald-400 transition-all">
                        {/* Mode Selector */}
                        <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-gray-100">
                            <button
                                onClick={() => {
                                    setChatMode('free');
                                    setShowCardSelection(false);
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 border ${
                                    chatMode === 'free'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-200'
                                }`}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                自由对话
                            </button>
                            <button
                                onClick={() => {
                                    setChatMode('cards');
                                    setShowCardSelection(!showCardSelection);
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 border ${
                                    chatMode === 'cards'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-200'
                                }`}
                            >
                                <Layers className="w-3.5 h-3.5" />
                                卡片对话
                                {selectedCardsForChat.length > 0 && (
                                    <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] rounded-full">
                    {selectedCardsForChat.length}
                  </span>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setChatMode('mindmap');
                                    setShowCardSelection(false);
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 border ${
                                    chatMode === 'mindmap'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-200'
                                }`}
                            >
                                <Brain className="w-3.5 h-3.5" />
                                生成脑图
                            </button>
                        </div>

                        {/* Input Field */}
                        <div className="px-3 py-2">
              <textarea
                  placeholder={
                      chatMode === 'mindmap'
                          ? "描述你想要生成的思维导图主题..."
                          : chatMode === 'cards' && selectedCardsForChat.length > 0
                              ? "基于选中的卡片提问..."
                              : chatMode === 'cards'
                                  ? "请先选择相关的知识卡片..."
                                  : "输入消息..."
                  }
                  className="w-full text-sm focus:outline-none resize-none text-gray-700 placeholder-gray-400"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                      }
                  }}
                  rows={1}
                  disabled={chatMode === 'cards' && selectedCardsForChat.length === 0}
              />
                        </div>

                        {/* Actions Bar */}
                        <div className="flex items-center justify-between px-3 pb-3">
                            <div className="flex items-center gap-2">
                                {chatMode === 'cards' && (
                                    <button
                                        onClick={() => setShowCardSelection(!showCardSelection)}
                                        className="text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={!inputMessage.trim() || (chatMode === 'cards' && selectedCardsForChat.length === 0)}
                                className={`p-2 rounded-lg transition-all border shadow-sm hover:shadow-md ${
                                    inputMessage.trim() && (chatMode !== 'cards' || selectedCardsForChat.length > 0)
                                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600'
                                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                }`}
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};