import React, { useEffect, useState } from 'react';
import { useStore } from './sidepanel/store';
import { NavigationBar } from './sidepanel/components/layout/NavigationBar';
import { AddCardModal } from './sidepanel/components/modals/AddCardModal';
import { CardsView } from './sidepanel/views/CardsView';
import { ChatView } from './sidepanel/views/ChatView';
import { SettingsView } from './sidepanel/views/SettingsView';
import type { ManageState } from './sidepanel/types/manage.types';

function App() {
    const {
        currentView,
        cards,
        initialize,
        loadStore,
        checkForPendingSelection
    } = useStore();
    const [isLoading, setIsLoading] = useState(true);

    const [manageState, setManageState] = useState<ManageState>({
        view: 'cards',
        isManageMode: false,
        selectedCards: []
    });

    const handleCardSelect = (cardId: string) => {
        setManageState(prev => {
            if (prev.view === 'cards') {
                return {
                    ...prev,
                    selectedCards: prev.selectedCards.includes(cardId)
                        ? prev.selectedCards.filter(id => id !== cardId)
                        : [...prev.selectedCards, cardId]
                };
            }
            return prev;
        });
    };

    useEffect(() => {
        if (currentView === 'cards') {
            setManageState({
                view: 'cards',
                isManageMode: false,
                selectedCards: []
            });
        } else if (currentView === 'chat') {
            setManageState({
                view: 'chat',
                isManageMode: false
            });
        }
    }, [currentView]);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                initialize();
                await loadStore();
                await checkForPendingSelection();
            } catch (error) {
                console.error('Failed to initialize app:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();
    }, [initialize, loadStore, checkForPendingSelection]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-100/80 backdrop-blur-md">
            <NavigationBar
                manageState={manageState}
                onManageStateChange={setManageState}
            />

            <div className="flex-1 overflow-hidden relative">
                <div
                    className={`h-full ${currentView === 'cards' ? 'block' : 'hidden'}`}
                >
                    <CardsView
                        manageModeState={manageState.view === 'cards' ? {
                            isManageMode: manageState.isManageMode,
                            selectedCards: manageState.selectedCards
                        } : {
                            isManageMode: false,
                            selectedCards: []
                        }}
                        onCardSelect={handleCardSelect}
                    />
                </div>

                <div
                    className={`h-full ${currentView === 'chat' ? 'block' : 'hidden'}`}
                >
                    <ChatView />
                </div>

                <div
                    className={`h-full ${currentView === 'settings' ? 'block' : 'hidden'}`}
                >
                    <SettingsView />
                </div>
            </div>

            <AddCardModal />



            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-lg z-50">
                    Cards: {cards.length} | View: {currentView} |
                    Selected: {manageState.view === 'cards' ? manageState.selectedCards.length : 0} |
                    Mode: {manageState.isManageMode ? 'Manage' : 'Normal'}
                </div>
            )}
        </div>
    );
}

export default App;