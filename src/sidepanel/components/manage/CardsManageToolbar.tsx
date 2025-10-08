// src/components/cards/CardsManageToolbar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Download, FolderPlus, MessageSquare } from 'lucide-react';
import { useStore } from '../../store';
import { CategorySelector } from '../layout/CategorySelector';
import { ConfirmDialog } from '../modals/ConfirmDialog';
import { STORAGE_KEYS } from '../../utils/constants';

interface CardsManageToolbarProps {
    selectedCards: string[];
    onActionComplete: () => void;
}

export const CardsManageToolbar: React.FC<CardsManageToolbarProps> = ({
                                                                          selectedCards,
                                                                          onActionComplete
                                                                      }) => {
    const {
        cards,
        deleteCard,
        updateCard,
        selectedCardsForChat,
        setSelectedCardsForChat,
        setCurrentView,
        messages,
        clearMessages,
        archiveCurrentChat,
        saveCurrentChat
    } = useStore();

    const [showCategorySelector, setShowCategorySelector] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showNewChatDialog, setShowNewChatDialog] = useState(false);
    const categoryButtonRef = useRef<HTMLButtonElement>(null);
    const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });

    // Filter out non-existent card IDs and sample card
    const validSelectedCards = selectedCards.filter(id =>
        cards.some(card => card.id === id) && id !== 'sample-card-1'
    );

    const handleLinkToChat = async () => {
        if (validSelectedCards.length === 0) {
            alert('Please select at least one card');
            return;
        }

        // Check if there's actual conversation (user input or AI response)
        // Not just card selection without interaction
        const result = await chrome.storage.local.get(STORAGE_KEYS.CURRENT_CHAT);
        const savedMessages = result[STORAGE_KEYS.CURRENT_CHAT]?.messages || [];
        const currentMessages = messages.length > 0 ? messages : savedMessages;

        // Has real conversation if there are any user or assistant messages
        const hasRealConversation = currentMessages.length > 0;

        if (hasRealConversation) {
            // Show dialog to choose action
            setShowNewChatDialog(true);
        } else {
            // Direct to chat with selected cards (new conversation)
            setSelectedCardsForChat(validSelectedCards);
            onActionComplete();
            // Use setTimeout to ensure state is updated before navigation
            setTimeout(() => {
                setCurrentView('chat');
            }, 0);
        }
    };

    const handleContinueChat = async () => {
        // Add new cards to existing selected cards (remove duplicates)
        const combinedCards = [...new Set([...selectedCardsForChat, ...validSelectedCards])];

        // Update state
        setSelectedCardsForChat(combinedCards);

        // Save to storage using store's method
        await saveCurrentChat();

        setShowNewChatDialog(false);
        onActionComplete();

        // Navigate after ensuring state is persisted
        setCurrentView('chat');
    };

    const handleDeleteAndNewChat = async () => {
        clearMessages();
        setSelectedCardsForChat(validSelectedCards);
        await chrome.storage.local.remove(STORAGE_KEYS.CURRENT_CHAT);
        setCurrentView('chat');
        setShowNewChatDialog(false);
        onActionComplete();
    };

    const handleArchiveAndNewChat = async () => {
        await archiveCurrentChat();
        setSelectedCardsForChat(validSelectedCards);
        setCurrentView('chat');
        setShowNewChatDialog(false);
        onActionComplete();
    };

    const handleDelete = () => {
        if (validSelectedCards.length === 0) return;
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        validSelectedCards.forEach(id => deleteCard(id));
        setShowDeleteConfirm(false);
        onActionComplete();
    };

    const handleExport = () => {
        const selectedData = cards.filter(card => validSelectedCards.includes(card.id));

        // Format as readable text
        const textContent = selectedData.map((card, index) => {
            const lines = [
                `Card ${index + 1}`,
                '='.repeat(50),
                `Title: ${card.title}`,
                `Category: ${card.category || 'Other'}`,
                `URL: ${card.url || 'N/A'}`,
                `Created: ${new Date(card.timestamp).toLocaleString()}`,
                '',
                'Content:',
                '-'.repeat(50),
                card.content,
                '',
                '='.repeat(50),
                ''
            ];
            return lines.join('\n');
        }).join('\n');

        const header = `Knowledge Cards Export\nTotal Cards: ${selectedData.length}\nExported: ${new Date().toLocaleString()}\n\n${'='.repeat(50)}\n\n`;
        const fullText = header + textContent;

        const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(fullText);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `cards_export_${Date.now()}.txt`);
        linkElement.click();
    };

    // Get selected cards category
    const getSelectedCardsCategory = (): string => {
        if (validSelectedCards.length === 0) return '';

        const selectedCardsData = cards.filter(card => validSelectedCards.includes(card.id));
        const firstCategory = selectedCardsData[0]?.category;
        const allSame = selectedCardsData.every(card => card.category === firstCategory);

        return allSame ? (firstCategory || 'Other') : '';
    };

    // Handle category change
    const handleCategoryChange = async (newCategory: string) => {
        for (const cardId of validSelectedCards) {
            await updateCard(cardId, { category: newCategory });
        }
        setShowCategorySelector(false);
        onActionComplete();
    };

    // Calculate button position
    useEffect(() => {
        if (showCategorySelector && categoryButtonRef.current) {
            const rect = categoryButtonRef.current.getBoundingClientRect();
            setButtonPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right
            });
        }
    }, [showCategorySelector]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showCategorySelector &&
                !target.closest('.category-selector-portal') &&
                !categoryButtonRef.current?.contains(target)) {
                setShowCategorySelector(false);
            }
        };

        if (showCategorySelector) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCategorySelector]);

    const currentCategory = getSelectedCardsCategory();

    return (
        <>
            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-600">
                    Selected {validSelectedCards.length} card(s)
                </span>
                <div className="flex gap-1">
                    <button
                        onClick={handleLinkToChat}
                        disabled={validSelectedCards.length === 0}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 disabled:opacity-50 flex items-center gap-1"
                    >
                        <MessageSquare className="w-3 h-3" />
                        AI
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={validSelectedCards.length === 0}
                        className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200 disabled:opacity-50 flex items-center gap-1"
                    >
                        <Download className="w-3 h-3" />
                        Export
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={validSelectedCards.length === 0}
                        className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 disabled:opacity-50 flex items-center gap-1"
                    >
                        <Trash2 className="w-3 h-3" />
                        Delete
                    </button>

                    {/* Category button */}
                    <button
                        ref={categoryButtonRef}
                        onClick={() => setShowCategorySelector(!showCategorySelector)}
                        disabled={validSelectedCards.length === 0}
                        className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
                            showCategorySelector
                                ? 'bg-orange-200 text-orange-700'
                                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        } disabled:opacity-50`}
                    >
                        <FolderPlus className="w-3 h-3" />
                        Category
                    </button>

                    {/* Render CategorySelector to body using Portal */}
                    {showCategorySelector && createPortal(
                        <div
                            className="category-selector-portal"
                            style={{
                                position: 'fixed',
                                top: `${buttonPosition.top}px`,
                                right: `${buttonPosition.right}px`,
                                zIndex: 999999,
                                minWidth: '240px'
                            }}
                        >
                            <CategorySelector
                                value={currentCategory}
                                onChange={handleCategoryChange}
                                placeholder={currentCategory === '' ? 'Select category' : currentCategory}
                                dropDirection="down"
                                manageMode={true}
                                onCancel={() => setShowCategorySelector(false)}
                            />
                        </div>,
                        document.body
                    )}
                </div>
            </div>

            {/* Batch delete confirmation dialog */}
            {showDeleteConfirm && createPortal(
                <ConfirmDialog
                    isOpen={showDeleteConfirm}
                    title="Delete Multiple Cards"
                    message={`Are you sure you want to delete ${validSelectedCards.length} card(s)? This action can't be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />,
                document.body
            )}

            {/* New Chat Dialog */}
            {showNewChatDialog && createPortal(
                <ConfirmDialog
                    isOpen={showNewChatDialog}
                    title="Start New Chat with Selected Cards?"
                    message="You have an existing conversation. What would you like to do?"
                    confirmText="Delete & Start New"
                    cancelText="Continue Current Chat"
                    onConfirm={handleDeleteAndNewChat}
                    onCancel={handleContinueChat}
                    cancelButtonStyle="primary"
                    additionalActions={[
                        {
                            text: 'Archive & Start New',
                            onClick: handleArchiveAndNewChat,
                            className: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }
                    ]}
                />,
                document.body
            )}
        </>
    );
};