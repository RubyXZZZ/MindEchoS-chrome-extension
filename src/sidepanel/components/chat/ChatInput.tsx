import React, { useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    disabled?: boolean;
    placeholder?: string;
    onAttach?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
                                                        value,
                                                        onChange,
                                                        onSend,
                                                        disabled = false,
                                                        placeholder = '输入消息...',
                                                        onAttach,
                                                    }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && value.trim()) {
                onSend();
            }
        }
    };

    return (
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200/50 p-3">
            <div className="bg-white border border-gray-300 rounded-xl focus-within:border-emerald-400 transition-all">
                <div className="flex items-end p-3 gap-2">
                    {/* Attachment Button */}
                    {onAttach && (
                        <button
                            onClick={onAttach}
                            disabled={disabled}
                            className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>
                    )}

                    {/* Text Input */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={disabled}
                        placeholder={placeholder}
                        className="flex-1 text-sm focus:outline-none resize-none text-gray-700
              placeholder-gray-400 disabled:opacity-50 max-h-32"
                        rows={1}
                    />

                    {/* Send Button */}
                    <button
                        onClick={onSend}
                        disabled={disabled || !value.trim()}
                        className={`p-2 rounded-lg transition-all ${
                            !disabled && value.trim()
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow-md'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};