import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Type, Globe, Loader2 } from 'lucide-react';
import { useStore } from '../../store';
import { KnowledgeCard } from '../../types/card.types';
import { CARD_COLORS, DEFAULT_CATEGORY, ALL_CARDS_FILTER } from '../../utils/constants';
import { useAISummarizer } from '../../hooks/useAISummarizer';
import { CategorySelector } from '../layout/CategorySelector';
import { ConfirmDialog } from '../modals/ConfirmDialog';

export const AddCardModal: React.FC = () => {
    const {
        showAddModal,
        setShowAddModal,
        addCard,
        updateCard,
        cards,
        editingCard,
        setEditingCard,
        initialSelection,
        setInitialSelection,
        selectedCategory,
    } = useStore();

    const isEditing = !!editingCard;
    const editingCardData = isEditing ? cards.find(c => c.id === editingCard) : null;

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: DEFAULT_CATEGORY,
        url: ''
    });

    const [extractingSelection, setExtractingSelection] = useState(false);
    const [extractingWebpage, setExtractingWebpage] = useState(false);
    const [extractError, setExtractError] = useState<string>('');
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [forceHideLoading, setForceHideLoading] = useState(false);

    const {
        summarizeTextStreaming,
        summarizeWebpageStreaming,
        isProcessing: isAIProcessing,
        isAvailable: isAIAvailable,
        isChecking: isAIChecking
    } = useAISummarizer();

    const hasProcessedAutoAI = useRef(false);
    const streamingTitle = useRef('');
    const streamingContent = useRef('');
    const abortController = useRef<AbortController | null>(null);

    const handleClose = () => {
        const isProcessing = extractingSelection || extractingWebpage || isAIProcessing;

        if (isProcessing) {
            setShowCloseConfirm(true);
        } else {
            setShowAddModal(false);
        }
    };

    const handleConfirmClose = () => {
        setShowCloseConfirm(false);
        hasProcessedAutoAI.current = false;
        setInitialSelection(null);
        chrome.storage.session.remove('pendingSelection');
        setShowAddModal(false);
    };

    const handleCancelClose = () => {
        setShowCloseConfirm(false);
    };

    useEffect(() => {
        const processAutoAI = async () => {
            if (!showAddModal || !initialSelection || !initialSelection.needsAISummarize) {
                return;
            }

            if (hasProcessedAutoAI.current) {
                return;
            }

            if (isAIChecking) {
                console.log('[AddCardModal] Waiting for AI availability check...');
                return;
            }

            console.log('[AddCardModal] Auto-processing AI (STREAMING) for right-click/shortcut');
            console.log('[AddCardModal] AI Available:', isAIAvailable);
            hasProcessedAutoAI.current = true;
            setExtractingSelection(true);

            let initialCategory = DEFAULT_CATEGORY;
            if (selectedCategory !== ALL_CARDS_FILTER) {
                initialCategory = selectedCategory;
            }

            abortController.current = new AbortController();
            const signal = abortController.current.signal;
            streamingTitle.current = '';
            streamingContent.current = '';

            try {
                await summarizeTextStreaming(
                    initialSelection.text,
                    initialSelection.url,
                    (titleChunk) => {
                        if (signal.aborted) return;
                        console.log('[AddCardModal] Title update:', titleChunk.substring(0, 50));
                        streamingTitle.current = titleChunk;
                        setFormData(prev => ({
                            ...prev,
                            title: titleChunk,
                            category: initialCategory,
                            url: initialSelection.url || ''
                        }));
                    },
                    (contentChunk) => {
                        if (signal.aborted) return;
                        console.log('[AddCardModal] Content update, length:', contentChunk.length);
                        streamingContent.current = contentChunk;
                        setFormData(prev => ({
                            ...prev,
                            content: contentChunk
                        }));
                    },
                    signal
                );

                if (!signal.aborted) {
                    console.log('[AddCardModal] Streaming completed, updating form');
                    setFormData({
                        title: streamingTitle.current || initialSelection.text.substring(0, 50) + '...',
                        content: streamingContent.current || initialSelection.text,
                        category: initialCategory,
                        url: initialSelection.url || ''
                    });
                }
            } catch (error: any) {
                if (error.name === 'AbortError' || signal.aborted) {
                    console.log('[AddCardModal] Auto AI streaming aborted by user');
                } else {
                    console.error('[AddCardModal] Auto AI streaming error:', error);
                    setFormData({
                        title: initialSelection.text.substring(0, 50) + '...',
                        content: initialSelection.text,
                        category: initialCategory,
                        url: initialSelection.url || ''
                    });
                }
            } finally {
                setExtractingSelection(false);
                abortController.current = null;
            }
        };

        processAutoAI();
    }, [showAddModal, initialSelection, summarizeTextStreaming, selectedCategory, isAIChecking, isAIAvailable]);

    useEffect(() => {
        if (!showAddModal) {
            setForceHideLoading(true);
            setExtractingSelection(false);
            setExtractingWebpage(false);
            setExtractError('');
            setShowCloseConfirm(false);
            setShowSaveConfirm(false);

            setTimeout(() => {
                if (editingCard) setEditingCard(null);
                if (initialSelection) setInitialSelection(null);
                hasProcessedAutoAI.current = false;
                streamingTitle.current = '';
                streamingContent.current = '';

                if (abortController.current) {
                    abortController.current.abort();
                    abortController.current = null;
                }

                chrome.storage.session.remove('pendingSelection');
            }, 0);
            return;
        }

        setForceHideLoading(false);

        if (editingCardData) {
            setFormData({
                title: editingCardData.title,
                content: editingCardData.content,
                category: editingCardData.category || DEFAULT_CATEGORY,
                url: editingCardData.url || ''
            });
            return;
        }

        if (!initialSelection || !initialSelection.needsAISummarize) {
            let initialCategory = DEFAULT_CATEGORY;
            if (selectedCategory !== ALL_CARDS_FILTER) {
                initialCategory = selectedCategory;
            }
            setFormData({
                title: '',
                content: '',
                category: initialCategory,
                url: ''
            });
        }
    }, [showAddModal, editingCardData, editingCard, setEditingCard, initialSelection, setInitialSelection, selectedCategory]);

    const handleExtractSelection = async () => {
        setExtractingSelection(true);
        setExtractError('');

        try {
            console.log('[AddCardModal] Manual Selection button clicked (STREAMING)');
            const response = await chrome.runtime.sendMessage({
                command: 'GET_ACTIVE_TAB_SELECTION'
            });

            console.log('[AddCardModal] Content script response:', response);

            if (response && response.success) {
                console.log('[AddCardModal] Calling streaming AI summarizer for selection...');

                abortController.current = new AbortController();
                const signal = abortController.current.signal;
                streamingTitle.current = '';
                streamingContent.current = '';

                await summarizeTextStreaming(
                    response.data.text,
                    response.data.url,
                    (titleChunk) => {
                        if (signal.aborted) return;
                        streamingTitle.current = titleChunk;
                        setFormData(prev => ({
                            ...prev,
                            title: titleChunk,
                            url: response.data.url || prev.url
                        }));
                    },
                    (contentChunk) => {
                        if (signal.aborted) return;
                        streamingContent.current = contentChunk;
                        setFormData(prev => ({
                            ...prev,
                            content: contentChunk
                        }));
                    },
                    signal
                );

                if (!signal.aborted) {
                    console.log('[AddCardModal] Selection streaming completed');
                    setFormData(prev => ({
                        ...prev,
                        title: streamingTitle.current || response.data.text.substring(0, 50) + '...',
                        content: streamingContent.current || response.data.text,
                        url: response.data.url || prev.url
                    }));
                }
            } else {
                setExtractError(response?.error || 'Unable to get selection');
            }
        } catch (error: any) {
            if (error.name === 'AbortError' || abortController.current?.signal.aborted) {
                console.log('[AddCardModal] Selection streaming aborted by user');
            } else {
                console.error('[AddCardModal] Failed to extract selection:', error);
                setExtractError('Extraction failed, please try again');
            }
        } finally {
            setExtractingSelection(false);
            abortController.current = null;
        }
    };

    const handleExtractWebpage = async () => {
        setExtractingWebpage(true);
        setExtractError('');

        try {
            console.log('[AddCardModal] Manual Webpage button clicked (STREAMING)');
            const response = await chrome.runtime.sendMessage({
                command: 'EXTRACT_CURRENT_WEBPAGE'
            });

            console.log('[AddCardModal] Webpage extract response:', response);

            if (response && response.success) {
                console.log('[AddCardModal] Calling streaming AI webpage summarizer...');

                abortController.current = new AbortController();
                const signal = abortController.current.signal;
                streamingTitle.current = '';
                streamingContent.current = '';

                await summarizeWebpageStreaming(
                    response.data,
                    (titleChunk) => {
                        if (signal.aborted) return;
                        streamingTitle.current = titleChunk;
                        setFormData(prev => ({
                            ...prev,
                            title: titleChunk,
                            url: response.data.url || prev.url
                        }));
                    },
                    (contentChunk) => {
                        if (signal.aborted) return;
                        streamingContent.current = contentChunk;
                        setFormData(prev => ({
                            ...prev,
                            content: contentChunk
                        }));
                    },
                    signal
                );

                if (!signal.aborted) {
                    console.log('[AddCardModal] Webpage streaming completed');
                    setFormData(prev => ({
                        ...prev,
                        title: streamingTitle.current || response.data.title,
                        content: streamingContent.current || response.data.content,
                        url: response.data.url || prev.url
                    }));
                }
            } else {
                setExtractError(response?.error || 'Unable to extract webpage');
            }
        } catch (error: any) {
            if (error.name === 'AbortError' || abortController.current?.signal.aborted) {
                console.log('[AddCardModal] Webpage streaming aborted by user');
            } else {
                console.error('[AddCardModal] Failed to extract webpage:', error);
                setExtractError('Extraction failed, please try again');
            }
        } finally {
            setExtractingWebpage(false);
            abortController.current = null;
        }
    };

    const handleSave = async () => {
        // Validate title
        if (!formData.title.trim()) {
            alert('Please enter a title');
            return;
        }

        const isProcessing = extractingSelection || extractingWebpage || isAIProcessing;

        if (isProcessing) {
            setShowSaveConfirm(true);
            return;
        }

        performSave();
    };

    const performSave = async () => {
        if (isEditing && editingCardData) {
            await updateCard(editingCardData.id, { ...formData });
        } else {
            const newCard: KnowledgeCard = {
                id: Date.now().toString(),
                ...formData,
                tags: [],
                color: CARD_COLORS[cards.length % CARD_COLORS.length],
                timestamp: Date.now()
            };
            await addCard(newCard);
        }

        setShowAddModal(false);
    };

    const handleConfirmSave = () => {
        setShowSaveConfirm(false);

        if (abortController.current) {
            console.log('[AddCardModal] Aborting AI processing before save');
            abortController.current.abort();
            abortController.current = null;
        }

        hasProcessedAutoAI.current = false;
        setInitialSelection(null);
        chrome.storage.session.remove('pendingSelection');

        performSave();
    };

    const isAnyLoading = !forceHideLoading && (extractingSelection || extractingWebpage || isAIProcessing);

    if (!showAddModal) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col relative z-[10001]">
                    <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
                        <h2 className="text-base font-semibold">{isEditing ? 'Edit Card' : 'New Card'}</h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-500 hover:text-gray-700"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 space-y-3 overflow-y-auto flex-grow">
                        {!isEditing && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    AI Extract
                                    {isAIChecking && (
                                        <span className="ml-2 text-xs text-blue-600">🔄 Checking AI...</span>
                                    )}
                                    {!isAIChecking && isAIAvailable && (
                                        <span className="ml-2 text-xs text-green-600">✓ AI Ready</span>
                                    )}
                                    {!isAIChecking && !isAIAvailable && (
                                        <span className="ml-2 text-xs text-yellow-600">⚠ AI Unavailable</span>
                                    )}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={handleExtractSelection}
                                        disabled={isAnyLoading || isAIChecking}
                                        className="px-3 py-2.5 bg-slate-500 text-white text-sm rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {extractingSelection ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Type className="w-4 h-4" />
                                        )}
                                        <span>Selection</span>
                                    </button>

                                    <button
                                        onClick={handleExtractWebpage}
                                        disabled={isAnyLoading || isAIChecking}
                                        className="px-3 py-2.5 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {extractingWebpage ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Globe className="w-4 h-4" />
                                        )}
                                        <span>Webpage</span>
                                    </button>
                                </div>

                                {extractError && (
                                    <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                                        {extractError}
                                    </div>
                                )}

                                {isAIChecking && (
                                    <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Checking Chrome AI availability...
                                    </div>
                                )}

                                {(extractingSelection || extractingWebpage || isAIProcessing) && !isAIChecking && (
                                    <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        AI is extracting and summarizing content...
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="Enter card title..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Content</label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                rows={8}
                                placeholder="Enter detailed content..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">URL</label>
                            <input
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({...formData, url: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="relative" style={{ zIndex: 50 }}>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Category</label>
                            <CategorySelector
                                value={formData.category}
                                onChange={(category) => setFormData({ ...formData, category })}
                                dropDirection="up"
                            />
                        </div>
                    </div>

                    <div className="px-4 py-3 border-t flex justify-end gap-2 flex-shrink-0">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-emerald-600 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {isEditing ? 'Update' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showCloseConfirm}
                title="Interrupt AI Processing"
                message="AI is currently generating content. Closing now will stop the process. Continue?"
                confirmText="Yes, Close"
                cancelText="Keep Editing"
                onConfirm={handleConfirmClose}
                onCancel={handleCancelClose}
            />

            <ConfirmDialog
                isOpen={showSaveConfirm}
                title="Save Incomplete Content"
                message="AI is still generating. Saving now may result in incomplete content. Save anyway?"
                confirmText="Save Now"
                cancelText="Wait"
                onConfirm={handleConfirmSave}
                onCancel={() => setShowSaveConfirm(false)}
            />
        </>
    );
};