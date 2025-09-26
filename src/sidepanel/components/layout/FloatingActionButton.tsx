import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../../store';

// Type for Chrome runtime messages
interface CaptureMessage {
    type: string;
    data?: {
        title: string;
        text: string;
        url: string;
        hasSelection: boolean;
    };
}

interface SelectionResponse {
    hasSelection: boolean;
    text: string;
    title: string;
    url: string;
}

export const FloatingActionButton: React.FC = () => {
    const { currentView, setShowAddModal } = useStore();

    // Listen for auto-captured selections (Ctrl+Shift+S)
    // Must be before any conditional returns
    useEffect(() => {
        const handleMessage = (message: CaptureMessage) => {
            if (message.type === 'CAPTURE_SELECTION' && message.data) {
                sessionStorage.setItem('pendingCard', JSON.stringify({
                    title: `Selection from ${message.data.title}`,
                    content: message.data.text,
                    url: message.data.url,
                    source: 'selection'
                }));
                setShowAddModal(true);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage as Parameters<typeof chrome.runtime.onMessage.addListener>[0]);
    }, [setShowAddModal]);

    // Conditional return AFTER all hooks
    if (currentView !== 'cards') return null;

    const handleClick = async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                const selection: SelectionResponse = await chrome.tabs.sendMessage(tab.id, {
                    type: 'GET_SELECTION'
                });

                if (selection.hasSelection && selection.text) {
                    // Store selected text for modal
                    sessionStorage.setItem('pendingCard', JSON.stringify({
                        title: `Selection from ${selection.title}`,
                        content: selection.text,
                        url: selection.url,
                        source: 'selection'
                    }));
                } else {
                    sessionStorage.removeItem('pendingCard');
                }
            }
        } catch (error) {
            console.error('Failed to get selection:', error);
            sessionStorage.removeItem('pendingCard');
        }

        setShowAddModal(true);
    };

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-4 right-4 w-12 h-12 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center"
        >
            <Plus className="w-5 h-5" />
        </button>
    );
};
