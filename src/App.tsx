

import { useEffect, useState } from 'react';
import { useStore } from './sidepanel/store';
import { NavigationBar } from './sidepanel/components/layout/NavigationBar';
import { FloatingActionButton } from './sidepanel/components/layout/FloatingActionButton';
import { AddCardModal } from './sidepanel/components/modals/AddCardModal';
import { CardsView } from './sidepanel/views/CardsView';
import { ChatView } from './sidepanel/views/ChatView';
import { ChromeStorageService } from './sidepanel/services/storage/chromeStorage';
import { AIService } from './sidepanel/services/ai/aiService';
import { KnowledgeCard } from './sidepanel/types/card.types';
import { CARD_COLORS } from './sidepanel/utils/constants';

// Sample data for development
const SAMPLE_CARDS: KnowledgeCard[] = [
    {
        id: '1',
        title: 'React Hooks最佳实践',
        summary: 'useEffect的依赖数组管理是关键，避免无限循环。useCallback和useMemo用于性能优化...',
        content: '详细的React Hooks使用指南和最佳实践。useEffect的依赖数组管理是关键，避免无限循环。useCallback和useMemo用于性能优化，但不要过度使用。自定义Hook可以复用状态逻辑。',
        url: 'https://react.dev/learn/hooks',
        timestamp: Date.now() - 3600000,
        tags: ['React', 'Frontend', 'JavaScript', 'Hooks'],
        category: 'Technology',
        color: CARD_COLORS[0],
    },
    {
        id: '2',
        title: 'TypeScript泛型编程',
        summary: 'TypeScript泛型提供了代码复用性，可以创建灵活的组件和函数...',
        content: 'TypeScript泛型的深入解析。TypeScript泛型提供了代码复用性，可以创建灵活的组件和函数。约束泛型、条件类型等高级特性让类型系统更强大。',
        url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html',
        timestamp: Date.now() - 7200000,
        tags: ['TypeScript', 'Programming', 'Types'],
        category: 'Technology',
        color: CARD_COLORS[1],
    },
    {
        id: '3',
        title: '产品思维与用户体验',
        summary: '好的产品设计要从用户需求出发，关注用户旅程的每个触点...',
        content: '产品设计方法论完整指南。好的产品设计要从用户需求出发，关注用户旅程的每个触点。数据驱动决策，但也要平衡定性和定量分析。',
        url: 'https://example.com/product-design',
        timestamp: Date.now() - 86400000,
        tags: ['Product', 'UX', 'Design'],
        category: 'Design',
        color: CARD_COLORS[2],
    }
];

function App() {
    const { currentView, setCards, cards } = useStore();
    const [isLoading, setIsLoading] = useState(true);
    const [tailwindTest, setTailwindTest] = useState(true);

    // State for manage mode
    const [manageModeState, setManageModeState] = useState({
        isManageMode: false,
        selectedCards: [] as string[]
    });

    // Handle card selection in manage mode
    const handleCardSelect = (cardId: string) => {
        setManageModeState(prev => ({
            ...prev,
            selectedCards: prev.selectedCards.includes(cardId)
                ? prev.selectedCards.filter(id => id !== cardId)
                : [...prev.selectedCards, cardId]
        }));
    };

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Check AI availability (no need to initialize)
                const availability = await AIService.checkAvailability();
                console.log('AI Services available:', availability);

                // Load saved cards from storage
                const savedCards = await ChromeStorageService.loadCards();

                if (savedCards && savedCards.length > 0) {
                    setCards(savedCards);
                } else {
                    // Use sample data for development
                    console.log('Loading sample cards for development');
                    setCards(SAMPLE_CARDS);
                }
            } catch (error) {
                console.error('Failed to initialize app:', error);
                // Fallback to sample data
                setCards(SAMPLE_CARDS);
            } finally {
                setIsLoading(false);
                // Hide Tailwind test after 3 seconds
                setTimeout(() => setTailwindTest(false), 3000);
            }
        };

        initializeApp();
    }, [setCards]);

    // Auto-save cards when changed
    useEffect(() => {
        if (cards.length > 0 && !isLoading) {
            ChromeStorageService.saveCards(cards).catch(console.error);
        }
    }, [cards, isLoading]);

    // Tailwind CSS Test Banner (shows for 3 seconds)
    if (tailwindTest) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center p-8">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                        Tailwind CSS Test
                    </h1>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-gray-700">If you see colors, Tailwind is working!</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">React</div>
                            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm">TypeScript</div>
                            <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm">Tailwind</div>
                        </div>
                        <p className="text-sm text-gray-500">Loading app...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
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

    // Main App
    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-100/80 backdrop-blur-md">
            {/* Navigation with manage mode state */}
            <NavigationBar
                manageModeState={manageModeState}
                onManageModeChange={setManageModeState}
            />

            {/* Main Content */}
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

            {/* Floating Action Button - only show in cards view */}
            {currentView === 'cards' && <FloatingActionButton />}

            {/* Add Card Modal */}
            <AddCardModal />

            {/* Debug Info (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-lg z-50">
                    Cards: {cards.length} | View: {currentView} | Selected: {manageModeState.selectedCards.length}
                </div>
            )}
        </div>
    );
}

export default App;