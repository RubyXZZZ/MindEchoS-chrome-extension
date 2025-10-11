// message bubble
import React from 'react';
import { Copy, Check, BookOpen, GitCompare, GraduationCap, PenTool } from 'lucide-react';
import { ChatMessage } from '../../types/chat.types';
import { formatTime } from '../../utils/formatters';
import { ChatMarkdownRenderer } from './ChatMarkdownRenderer';
import { KnowledgeCard } from '../../types/card.types';

interface MessageBubbleProps {
    msg: ChatMessage;
    cards: KnowledgeCard[];
    onCopy: (id: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, cards, onCopy }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        onCopy(msg.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={msg.role === 'user' ? 'max-w-[85%]' : 'max-w-[95%]'}>
                <div className={`px-4 py-2.5 text-sm overflow-hidden ${
                    msg.role === 'user'
                        ? 'bg-gray-200 text-gray-800 rounded-2xl rounded-br-sm shadow-sm'
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

                            {/* Copy Button */}
                            {msg.content && (
                                <div className="flex justify-end mt-2.5 pt-2.5 border-t border-gray-100">
                                    <button
                                        onClick={handleCopy}
                                        className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
                                            copied
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                        }`}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-3 h-3" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className={`mt-1 px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {msg.role === 'assistant' && (
                        <>
                            <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                            {msg.triggeredBy && (
                                <span className="text-[10px] text-emerald-600 ml-2">• {msg.triggeredBy}</span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

interface MessageListProps {
    messages: ChatMessage[];
    selectedCards: KnowledgeCard[];
    sessionReady: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    messagesContainerRef: React.RefObject<HTMLDivElement | null>;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    onCopy: (msgId: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
                                                            messages,
                                                            selectedCards,
                                                            sessionReady,
                                                            messagesEndRef,
                                                            messagesContainerRef,
                                                            onScroll,
                                                            onCopy
                                                        }) => {
    return (
        <div
            ref={messagesContainerRef}
            onScroll={onScroll}
            className="flex-1 overflow-y-auto px-3 pt-2 pb-4"
        >
            {/* Selected Cards Info Banner */}
            <div className={`px-3 py-1.5 mb-1.5 rounded-lg border ${
                selectedCards.length > 0
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
            }`}>
                {selectedCards.length > 0 ? (
                    <p className="text-xs text-emerald-700 text-center">
                        <span className="font-medium">
                            {selectedCards.length} Card{selectedCards.length > 1 ? 's' : ''} Selected
                        </span> - AI will use this context for responses
                    </p>
                ) : (
                    <p className="text-xs text-amber-700 text-center">
                        Select cards above for better context
                    </p>
                )}
            </div>

            {/* Start Guide */}
            {messages.length === 0 && sessionReady && (
                <div className="max-w-2xl mx-auto mt-4 mb-3">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            💡 AI Quick Start Guide
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Use the quick action buttons below or type your own question.
                        </p>

                        <div className="bg-amber-50/70 rounded-lg p-2 mb-2 border border-amber-200 max-w-md mx-auto">
                            <p className="text-xs text-gray-700 text-left">
                                <span className="font-medium">Tip:</span> Select cards above ↑ or in the CARDS View for context-aware responses.
                                {selectedCards.length === 0 ? (
                                    <span className="text-emerald-600"> No cards selected yet.</span>
                                ) : (
                                    <span className="text-emerald-600"> {selectedCards.length} card{selectedCards.length > 1 ? 's' : ''} selected.</span>
                                )}
                            </p>
                        </div>

                        <div className="space-y-2 text-sm">
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
                                    <p className="text-xs text-gray-600 mt-0.5">Generate summaries, outlines, and report drafts</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-emerald-200/50">
                            <p className="text-xs text-gray-600">
                                <span className="font-medium">MANAGE mode</span> - Archive and view history.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="space-y-3">
                {messages.map(msg => (
                    <MessageBubble
                        key={msg.id}
                        msg={msg}
                        cards={selectedCards}
                        onCopy={onCopy}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};