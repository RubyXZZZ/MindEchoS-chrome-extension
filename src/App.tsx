import React, { useEffect, useState } from 'react';
import { useStore } from './sidepanel/store';
import { NavigationBar } from './sidepanel/components/layout/NavigationBar';
import { AddCardModal } from './sidepanel/components/modals/AddCardModal';
import { DeleteCategoryModal } from './sidepanel/components/modals/DeleteCategoryModal';
import { CardsView } from './sidepanel/views/CardsView';
import { ChatView } from './sidepanel/views/ChatView';
import type { ManageState } from './sidepanel/types/manage.types';

function App() {
    const { currentView, cards, initialize, loadStore, checkForPendingSelection } = useStore();
    const [isLoading, setIsLoading] = useState(true);

    // 初始化管理状态
    const [manageState, setManageState] = useState<ManageState>({
        view: 'cards',
        isManageMode: false,
        selectedCards: []
    });

    // 处理卡片选择（仅在 cards 视图中使用）
    const handleCardSelect = (cardId: string) => {
        setManageState(prev => {
            // 类型守卫，确保只在 cards 视图中处理选择
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

    // 监听视图切换，同步更新管理状态
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

    // 初始化应用
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // 1. 设置监听器
                initialize();
                // 2. 加载持久化的卡片和分类
                await loadStore();
                // 3. 检查监听器准备好之前的事件
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
                    <p className="mt-4 text-gray-600">加载中...</p>
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
                {currentView === 'cards' ? (
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
                ) : (
                    <ChatView
                        // isManageMode={manageState.isManageMode}
                    />
                )}
            </div>

            {/* 全局模态框 */}
            <AddCardModal />
            <DeleteCategoryModal />

            {/* 开发环境调试信息 */}
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