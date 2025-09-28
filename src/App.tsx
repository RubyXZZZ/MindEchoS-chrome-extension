import { useEffect, useState } from 'react';
import { useStore } from './sidepanel/store';
import { NavigationBar } from './sidepanel/components/layout/NavigationBar';
import { AddCardModal } from './sidepanel/components/modals/AddCardModal';
import { DeleteCategoryModal } from './sidepanel/components/modals/DeleteCategoryModal';
import { CardsView } from './sidepanel/views/CardsView';
import { ChatView } from './sidepanel/views/ChatView';

function App() {
    const { currentView, cards, initialize, loadStore, checkForPendingSelection } = useStore();
    const [isLoading, setIsLoading] = useState(true);

    const [manageModeState, setManageModeState] = useState({
        isManageMode: false,
        selectedCards: [] as string[]
    });

    const handleCardSelect = (cardId: string) => {
        setManageModeState(prev => ({
            ...prev,
            selectedCards: prev.selectedCards.includes(cardId)
                ? prev.selectedCards.filter(id => id !== cardId)
                : [...prev.selectedCards, cardId]
        }));
    };

    // This is the definitive initialization sequence to solve the race condition.
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // 1. Set up the listener for future events.
                initialize();
                // 2. Load persisted cards and categories.
                await loadStore();
                // 3. Check for any event that happened *before* the listener was ready.
                await checkForPendingSelection();
            } catch (error) {
                console.error('Failed to initialize app:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();
        // The dependency array ensures this robust sequence runs only once on mount.
    }, [initialize, loadStore, checkForPendingSelection]);


    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">加载中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-100/80 backdrop-blur-md">
            <NavigationBar
                manageModeState={manageModeState}
                onManageModeChange={setManageModeState}
            />

            <div className="flex-1 overflow-hidden relative">
                {currentView === 'cards' ? (
                    <CardsView
                        manageModeState={manageModeState}
                        onCardSelect={handleCardSelect}
                    />
                ) : (
                    <ChatView />
                )}
            </div>

            {/* Global Modals */}
            <AddCardModal />
            <DeleteCategoryModal />

            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-lg z-50">
                    Cards: {cards.length} | View: {currentView} | Selected: {manageModeState.selectedCards.length}
                </div>
            )}
        </div>
    );
}

export default App;