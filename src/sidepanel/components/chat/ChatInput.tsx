// components/chat/ChatInput.tsx
import React from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
    inputMessage: string;
    isGenerating: boolean;
    isInitializing: boolean;
    sessionReady: boolean;
    onInputChange: (value: string) => void;
    onSend: () => void;
    onStop: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
                                                        inputMessage,
                                                        isGenerating,
                                                        isInitializing,
                                                        sessionReady,
                                                        onInputChange,
                                                        onSend,
                                                        onStop
                                                    }) => {
    return (
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
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                onSend();
                            }
                        }}
                        placeholder="Message AI..."
                        disabled={isGenerating || isInitializing || !sessionReady}
                        className="w-full px-3 py-2.5 pr-12 bg-gray-50 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        rows={3}
                    />

                    {isGenerating ? (
                        <button
                            onClick={onStop}
                            className="absolute bottom-2 right-2 w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                        >
                            <Square className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <button
                            onClick={onSend}
                            disabled={!inputMessage.trim() || isInitializing || !sessionReady}
                            className="absolute bottom-2 right-2 w-8 h-8 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};