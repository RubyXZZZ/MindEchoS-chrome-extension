import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Type, Globe, Loader2, Info } from 'lucide-react';
import { useStore } from '../../store';
import { KnowledgeCard } from '../../types/card.types';
import { CARD_COLORS, DEFAULT_CATEGORY, ALL_CARDS_FILTER } from '../../utils/constants';
import { useAISummarizer } from '../../hooks/useAISummarizer';
import { CategorySelector } from '../layout/CategorySelector';
import { ConfirmDialog } from '../modals/ConfirmDialog';
import { generateCardId, getNextDisplayNumber } from '../../utils/idGenerator';

interface SelectionPayload {
    text: string;
    url: string;
    title?: string;
    needsAISummarize?: boolean;
    needsContentSummary?: boolean;
}

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
    const [showTitleRequiredDialog, setShowTitleRequiredDialog] = useState(false);
    const [isRestrictedPage, setIsRestrictedPage] = useState(false);

    const [isTitleGenerating, setIsTitleGenerating] = useState(false);
    const [isContentGenerating, setIsContentGenerating] = useState(false);

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

        if (abortController.current) {
            abortController.current.abort();
            abortController.current = null;
        }

        hasProcessedAutoAI.current = false;
        setInitialSelection(null);
        chrome.storage.session.remove('pendingSelection');

        setIsTitleGenerating(false);
        setIsContentGenerating(false);
        setExtractingSelection(false);
        setExtractingWebpage(false);

        setShowAddModal(false);
    };

    const handleCancelClose = () => {
        setShowCloseConfirm(false);
    };

    useEffect(() => {
        if (showAddModal && !isEditing) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const url = tabs[0]?.url || '';
                const restricted = url.startsWith('chrome://') ||
                    url.startsWith('chrome-extension://') ||
                    url.startsWith('edge://') ||
                    url.includes('chrome.google.com/webstore');
                setIsRestrictedPage(restricted);
            });
        }
    }, [showAddModal, isEditing]);

    useEffect(() => {
        const processAutoAI = async () => {
            if (!showAddModal || !initialSelection || !initialSelection.needsAISummarize) {
                return;
            }

            if (hasProcessedAutoAI.current) {
                return;
            }

            if (isAIChecking) {
                return;
            }

            hasProcessedAutoAI.current = true;
            setExtractingSelection(true);
            setIsTitleGenerating(true);
            setIsContentGenerating(true);

            let initialCategory = DEFAULT_CATEGORY;
            if (selectedCategory !== ALL_CARDS_FILTER) {
                initialCategory = selectedCategory;
            }

            const currentAbortController = new AbortController();
            abortController.current = currentAbortController;
            const signal = currentAbortController.signal;
            streamingTitle.current = '';
            streamingContent.current = '';

            const needsContentSummary = (initialSelection as SelectionPayload).needsContentSummary !== false;

            // Set URL immediately before AI processing
            setFormData(prev => ({
                ...prev,
                category: initialCategory,
                url: initialSelection.url || ''
            }));

            try {
                await summarizeTextStreaming(
                    initialSelection.text,
                    initialSelection.url,
                    (titleChunk) => {
                        if (signal.aborted) return;
                        setIsTitleGenerating(false);
                        streamingTitle.current = titleChunk;
                        setFormData(prev => ({
                            ...prev,
                            title: titleChunk
                        }));
                    },
                    (contentChunk) => {
                        if (signal.aborted) return;
                        setIsContentGenerating(false);
                        streamingContent.current = contentChunk;
                        setFormData(prev => ({
                            ...prev,
                            content: contentChunk
                        }));
                    },
                    signal,
                    needsContentSummary
                );

                if (!signal.aborted) {
                    setFormData({
                        title: streamingTitle.current || initialSelection.text.substring(0, 50) + '...',
                        content: streamingContent.current || initialSelection.text,
                        category: initialCategory,
                        url: initialSelection.url || ''
                    });
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    // Silently abort
                } else {
                    console.error('[AddCardModal] Auto AI error:', error);
                    setFormData({
                        title: initialSelection.text.substring(0, 50) + '...',
                        content: initialSelection.text,
                        category: initialCategory,
                        url: initialSelection.url || ''
                    });
                }
            } finally {
                if (!signal.aborted) {
                    setExtractingSelection(false);
                    setIsTitleGenerating(false);
                    setIsContentGenerating(false);
                }
                if (abortController.current === currentAbortController) {
                    abortController.current = null;
                }
            }
        };

        processAutoAI();
    }, [showAddModal, initialSelection, summarizeTextStreaming, selectedCategory, isAIChecking]);

    useEffect(() => {
        if (!showAddModal) {
            setExtractingSelection(false);
            setExtractingWebpage(false);
            setExtractError('');
            setShowCloseConfirm(false);
            setShowSaveConfirm(false);
            setShowTitleRequiredDialog(false);
            setIsTitleGenerating(false);
            setIsContentGenerating(false);

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

                setFormData({
                    title: '',
                    content: '',
                    category: DEFAULT_CATEGORY,
                    url: ''
                });
            }, 0);
            return;
        }

        setExtractingSelection(false);
        setExtractingWebpage(false);
        setIsTitleGenerating(false);
        setIsContentGenerating(false);
        setExtractError('');

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
        setIsTitleGenerating(true);
        setIsContentGenerating(true);

        const currentAbortController = new AbortController();
        abortController.current = currentAbortController;
        const signal = currentAbortController.signal;

        try {
            const response = await chrome.runtime.sendMessage({
                command: 'GET_ACTIVE_TAB_SELECTION'
            });

            if (signal.aborted) {
                return;
            }

            if (response && response.success) {
                streamingTitle.current = '';
                streamingContent.current = '';

                const needsContentSummary = response.data.text.length >= 180;

                // Set URL immediately before AI processing
                setFormData(prev => ({
                    ...prev,
                    url: response.data.url || ''
                }));

                await summarizeTextStreaming(
                    response.data.text,
                    response.data.url,
                    (titleChunk) => {
                        if (signal.aborted) return;
                        setIsTitleGenerating(false);
                        streamingTitle.current = titleChunk;
                        setFormData(prev => ({
                            ...prev,
                            title: titleChunk
                        }));
                    },
                    (contentChunk) => {
                        if (signal.aborted) return;
                        setIsContentGenerating(false);
                        streamingContent.current = contentChunk;
                        setFormData(prev => ({
                            ...prev,
                            content: contentChunk
                        }));
                    },
                    signal,
                    needsContentSummary
                );

                if (!signal.aborted) {
                    setFormData(prev => ({
                        ...prev,
                        title: streamingTitle.current || response.data.text.substring(0, 50) + '...',
                        content: streamingContent.current || response.data.text,
                        url: response.data.url || prev.url
                    }));
                }
            } else {
                if (!signal.aborted) {
                    setExtractError(response?.error || 'Unable to get selection');
                }
            }
        } catch (error) {
            if (!signal.aborted) {
                if (error instanceof Error && error.name === 'AbortError') {
                    // Silently abort
                } else {
                    console.error('[AddCardModal] Selection extraction failed:', error);
                    setExtractError('Extraction failed, please try again');
                }
            }
        } finally {
            if (!signal.aborted) {
                setExtractingSelection(false);
                setIsTitleGenerating(false);
                setIsContentGenerating(false);
            }
            if (abortController.current === currentAbortController) {
                abortController.current = null;
            }
        }
    };

    const handleExtractWebpage = async () => {
        setExtractingWebpage(true);
        setExtractError('');
        setIsTitleGenerating(true);
        setIsContentGenerating(true);

        const currentAbortController = new AbortController();
        abortController.current = currentAbortController;
        const signal = currentAbortController.signal;

        try {
            const response = await chrome.runtime.sendMessage({
                command: 'EXTRACT_CURRENT_WEBPAGE'
            });

            if (signal.aborted) {
                return;
            }

            if (response && response.success) {
                streamingTitle.current = '';
                streamingContent.current = '';

                // Set URL immediately before AI processing
                setFormData(prev => ({
                    ...prev,
                    url: response.data.url || ''
                }));

                await summarizeWebpageStreaming(
                    response.data,
                    (titleChunk) => {
                        if (signal.aborted) return;
                        setIsTitleGenerating(false);
                        streamingTitle.current = titleChunk;
                        setFormData(prev => ({
                            ...prev,
                            title: titleChunk,
                            url: response.data.url || prev.url
                        }));
                    },
                    (contentChunk) => {
                        if (signal.aborted) return;
                        setIsContentGenerating(false);
                        streamingContent.current = contentChunk;
                        setFormData(prev => ({
                            ...prev,
                            content: contentChunk
                        }));
                    },
                    signal
                );

                if (!signal.aborted) {
                    setFormData(prev => ({
                        ...prev,
                        title: streamingTitle.current || response.data.title,
                        content: streamingContent.current || response.data.content,
                        url: response.data.url || prev.url
                    }));
                }
            } else {
                if (!signal.aborted) {
                    setExtractError(response?.error || 'Unable to extract webpage');
                }
            }
        } catch (error) {
            if (!signal.aborted) {
                if (error instanceof Error && error.name === 'AbortError') {
                    // Silently abort
                } else {
                    console.error('[AddCardModal] Webpage extraction failed:', error);
                    setExtractError('Extraction failed, please try again');
                }
            }
        } finally {
            if (!signal.aborted) {
                setExtractingWebpage(false);
                setIsTitleGenerating(false);
                setIsContentGenerating(false);
            }
            if (abortController.current === currentAbortController) {
                abortController.current = null;
            }
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            setShowTitleRequiredDialog(true);
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
            const displayNumber = await getNextDisplayNumber();
            const newCard: KnowledgeCard = {
                id: generateCardId(),
                displayNumber,
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
            abortController.current.abort();
            abortController.current = null;
        }

        hasProcessedAutoAI.current = false;
        setInitialSelection(null);
        chrome.storage.session.remove('pendingSelection');
        setIsTitleGenerating(false);
        setIsContentGenerating(false);

        performSave();
    };

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
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-700">
                                        AI Summarize
                                        {isAIChecking && (
                                            <span className="ml-2 text-xs text-blue-600">🔄 Checking AI...</span>
                                        )}
                                        {!isAIChecking && !isAIProcessing && isAIAvailable && (
                                            <span className="ml-2 text-xs text-green-600">✓ AI Ready</span>
                                        )}
                                        {!isAIChecking && !isAIProcessing && !isAIAvailable && (
                                            <span className="ml-2 text-xs text-yellow-600">⚠ AI Unavailable</span>
                                        )}
                                        {!isAIChecking && (extractingSelection || extractingWebpage || isAIProcessing) && (
                                            <span className="ml-2 text-xs text-blue-600">
                                                <Loader2 className="inline w-3 h-3 animate-spin mr-1" />
                                                AI is summarizing...
                                            </span>
                                        )}
                                    </label>
                                    <div className="group relative inline-block">
                                        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                                        <div className="absolute right-0 top-6 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[10002] pointer-events-none">
                                            <div className="bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 space-y-2">
                                                <div>
                                                    <p className="font-medium mb-0.5">Selection</p>
                                                    <p className="text-gray-300">Extract & summarize <strong>SELECTED</strong> text on the page.</p>
                                                </div>

                                                <div>
                                                    <p className="font-medium mb-0.5">Webpage</p>
                                                    <p className="text-gray-300">Extract & summarize the entire webpage content.</p>
                                                </div>

                                                <div className="pt-2 border-t border-gray-700">
                                                    <p className="text-gray-400 leading-relaxed">
                                                        Both use AI to generate concise titles and summaries. You can edit them before saving.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isRestrictedPage && (
                                    <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
                                        ⚠ Cannot extract from this page (Chrome restriction). Please navigate to a regular webpage.
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={handleExtractSelection}
                                        disabled={isRestrictedPage || extractingSelection || extractingWebpage || isAIProcessing || isAIChecking}
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
                                        disabled={isRestrictedPage || extractingSelection || extractingWebpage || isAIProcessing || isAIChecking}
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
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Enter card title..."
                                    required
                                />
                                {isTitleGenerating && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Content</label>
                            <div className="relative">
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    rows={8}
                                    placeholder="Enter detailed content..."
                                />
                                {isContentGenerating && (
                                    <div className="absolute right-3 top-3">
                                        <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                                    </div>
                                )}
                            </div>
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

            <ConfirmDialog
                isOpen={showTitleRequiredDialog}
                title="Title Required"
                message="Please input a title for your card before saving."
                confirmText="OK"
                cancelText=""
                onConfirm={() => setShowTitleRequiredDialog(false)}
                onCancel={() => setShowTitleRequiredDialog(false)}
            />
        </>
    );
};