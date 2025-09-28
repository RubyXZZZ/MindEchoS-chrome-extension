import React from 'react';
import { Layers, Settings2, X } from 'lucide-react';
import { useStore } from '../../store';
import { CardsManageToolbar } from '../manage/CardsManageToolbar';
import { ChatManageToolbar } from '../manage/ChatManageToolbar';
import { ManageState } from '../../types/manage.types';

interface NavigationBarProps {
    manageState: ManageState;
    onManageStateChange: (state: ManageState) => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
                                                                manageState,
                                                                onManageStateChange
                                                            }) => {
    const { currentView, setCurrentView } = useStore();
    const { isManageMode } = manageState;

    const handleManageClick = () => {
        if (isManageMode) {
            // 退出管理模式
            if (currentView === 'cards') {
                onManageStateChange({
                    view: 'cards',
                    isManageMode: false,
                    selectedCards: []
                });
            } else {
                onManageStateChange({
                    view: 'chat',
                    isManageMode: false
                });
            }
        } else {
            // 进入管理模式
            if (currentView === 'cards') {
                onManageStateChange({
                    view: 'cards',
                    isManageMode: true,
                    selectedCards: []
                });
            } else {
                onManageStateChange({
                    view: 'chat',
                    isManageMode: true
                });
            }
        }
    };

    const handleViewChange = (view: 'cards' | 'chat') => {
        setCurrentView(view);
        // 切换视图时重置管理状态
        if (view === 'cards') {
            onManageStateChange({
                view: 'cards',
                isManageMode: false,
                selectedCards: []
            });
        } else {
            onManageStateChange({
                view: 'chat',
                isManageMode: false
            });
        }
    };

    const handleActionComplete = () => {
        // 操作完成后退出管理模式
        if (currentView === 'cards') {
            onManageStateChange({
                view: 'cards',
                isManageMode: false,
                selectedCards: []
            });
        } else {
            onManageStateChange({
                view: 'chat',
                isManageMode: false
            });
        }
    };

    return (
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50">
            <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-base font-semibold text-gray-900">知识卡片</h1>
                    </div>

                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => handleViewChange('cards')}
                            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                                currentView === 'cards'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            知识卡片
                        </button>
                        <button
                            onClick={() => handleViewChange('chat')}
                            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                                currentView === 'chat'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            AI对话
                        </button>
                    </div>

                    <button
                        onClick={handleManageClick}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                            isManageMode
                                ? 'bg-gray-800 text-white hover:bg-gray-900'
                                : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                    >
                        {isManageMode ? (
                            <><X className="w-3 h-3" /><span>取消</span></>
                        ) : (
                            <><Settings2 className="w-3 h-3" /><span>Manage</span></>
                        )}
                    </button>
                </div>

                {/* 根据当前视图显示对应的管理工具栏 */}
                {isManageMode && currentView === 'cards' && manageState.view === 'cards' && (
                    <CardsManageToolbar
                        selectedCards={manageState.selectedCards}
                        onActionComplete={handleActionComplete}
                    />
                )}

                {isManageMode && currentView === 'chat' && manageState.view === 'chat' && (
                    <ChatManageToolbar
                        onActionComplete={handleActionComplete}
                    />
                )}
            </div>
        </div>
    );
};