// views/ChatView.tsx
import React from 'react';
import { useChat } from '../hooks/useChat';
import { ChatTopBar } from '../components/layout/ChatTopBar';
import { MessageList } from '../components/chat/MessageList';
import { QuickActions } from '../components/chat/QuickActions';
import { ChatInput } from '../components/chat/ChatInput';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';

export const ChatView: React.FC = () => {
    const chat = useChat();

    // Loading states
    if (chat.isChecking) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 rounded-full border-3 border-emerald-200 border-t-emerald-500 animate-spin mx-auto mb-3"></div>
                    <p className="text-xs text-gray-600">Loading AI...</p>
                </div>
            </div>
        );
    }

    if (chat.isInitializing) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 rounded-full border-3 border-emerald-200 border-t-emerald-500 animate-spin mx-auto mb-3"></div>
                    <p className="text-xs text-gray-600">Initializing AI Session...</p>
                    <p className="text-[10px] text-gray-400 mt-2">This may take a few seconds</p>
                </div>
            </div>
        );
    }

    if (!chat.isAvailable) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-sm text-gray-600">Prompt API unavailable</p>
                </div>
            </div>
        );
    }

    // Main UI
    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-gray-50/50 to-white">
            {/* Top Bar */}
            <ChatTopBar
                selectedCards={chat.selectedCards}
                allCards={chat.allCards}
                selectedCardIds={chat.selectedCardIds}
                onToggleCard={chat.toggleCard}
                onNewChat={chat.handleNewConversation}
                isGenerating={chat.isGenerating}
                isInitializing={chat.isInitializing}
            />

            {/* Messages */}
            <MessageList
                messages={chat.messages}
                selectedCards={chat.selectedCards}
                sessionReady={chat.sessionReady}
                messagesEndRef={chat.messagesEndRef}
                messagesContainerRef={chat.messagesContainerRef}
                onScroll={chat.handleScroll}
                onReject={chat.handleReject}
                onCopy={chat.handleCopy}
            />

            {/* Quick Actions */}
            <QuickActions
                isGenerating={chat.isGenerating}
                isInitializing={chat.isInitializing}
                sessionReady={chat.sessionReady}
                activeButton={chat.activeButton}
                showWriteMenu={chat.showWriteMenu}
                onQuickAction={chat.handleQuickAction}
                onWriteTask={chat.handleWriteTask}
            />

            {/* Chat Input */}
            <ChatInput
                inputMessage={chat.inputMessage}
                isGenerating={chat.isGenerating}
                isInitializing={chat.isInitializing}
                sessionReady={chat.sessionReady}
                onInputChange={chat.setInputMessage}
                onSend={chat.handleSend}
                onStop={chat.handleStop}
            />

            {/* New Chat Dialog - Optimized (Delete 为主) */}
            <ConfirmDialog
                isOpen={chat.showNewChatDialog}
                title="Start New Conversation?"
                message={
                    <div className="space-y-2">
                        <p className="text-sm text-gray-700">
                            You have an ongoing conversation. Choose how to proceed:
                        </p>

                        {/* Delete 说明卡（灰色） */}
                        <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-base flex-shrink-0">🗑️</span>
                            <div className="text-xs text-gray-700">
                                <strong className="text-gray-900">Delete</strong>
                                <div className="mt-0.5">Permanently remove (Frees storage)</div>
                            </div>
                        </div>

                        {/* Archive 说明卡（蓝色） */}
                        <div className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                            <span className="text-base flex-shrink-0">🗂️</span>
                            <div className="text-xs text-gray-700">
                                <strong className="text-blue-700">Archive</strong>
                                <div className="mt-0.5">View in ⚙️ Settings or 🗂️ Manage → History</div>
                            </div>
                        </div>
                    </div>
                }
                confirmText="Delete & Start New"
                cancelText="Archive & Start New"
                onConfirm={chat.handleDeleteAndNew}
                onCancel={chat.handleArchiveAndNew}
                confirmButtonStyle="danger"
            />
        </div>
    );
};