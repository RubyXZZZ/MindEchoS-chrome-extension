import React from 'react';
import { Settings, Settings2, X } from 'lucide-react';
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

    // 记住上一个 cards/chat 视图（用于 settings 时保持标签位置）
    const [lastContentView, setLastContentView] = React.useState<'cards' | 'chat'>('cards');

    // 更新 lastContentView
    React.useEffect(() => {
        if (currentView === 'cards' || currentView === 'chat') {
            setLastContentView(currentView);
        }
    }, [currentView]);

    // 用于显示标签位置的视图（settings 时使用 lastContentView）
    const displayView = currentView === 'settings' ? lastContentView : currentView;

    const handleLogoClick = () => {
        // 只切换到 settings，不改变其他视图状态
        setCurrentView('settings');

        // 退出 Manage 模式（如果正在 Manage）
        if (isManageMode) {
            if (currentView === 'cards') {
                onManageStateChange({
                    view: 'cards',
                    isManageMode: false,
                    selectedCards: []
                });
            } else if (currentView === 'chat') {
                onManageStateChange({
                    view: 'chat',
                    isManageMode: false
                });
            }
        }
    };

    const handleManageClick = () => {
        if (isManageMode) {
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
            <div className="px-4 py-2">
                <div className="flex items-center gap-3">
                    {/* Settings Button */}
                    <button
                        onClick={handleLogoClick}
                        className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>

                    {/* Left Spacer */}
                    <div className="flex-1" />

                    {/* View Switcher - Compact */}
                    <div className="relative bg-gray-200 rounded-lg p-0.5 flex flex-shrink-0">
                        {/* Sliding Green Background */}
                        <div
                            className="absolute top-0.5 bottom-0.5 left-0.5 w-[72px] bg-emerald-500 rounded-md shadow-md transition-transform duration-300 ease-out"
                            style={{
                                transform: displayView === 'cards' ? 'translateX(0)' : 'translateX(72px)',
                                willChange: 'transform'
                            }}
                        />

                        {/* Buttons */}
                        <button
                            onClick={() => handleViewChange('cards')}
                            className={`relative z-10 w-[72px] py-1.5 rounded-md text-sm font-medium transition-colors duration-300 ${
                                displayView === 'cards'
                                    ? 'text-white'
                                    : 'text-gray-700 hover:text-gray-900'
                            }`}
                        >
                            Cards
                        </button>
                        <button
                            onClick={() => handleViewChange('chat')}
                            className={`relative z-10 w-[72px] py-1.5 rounded-md text-sm font-medium transition-colors duration-300 ${
                                displayView === 'chat'
                                    ? 'text-white'
                                    : 'text-gray-700 hover:text-gray-900'
                            }`}
                        >
                            AI
                        </button>
                    </div>

                    {/* Right Spacer */}
                    <div className="flex-1" />

                    {/* Manage Button */}
                    <button
                        onClick={handleManageClick}
                        className={`w-[72px] h-8 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 flex-shrink-0 ${
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

                {/* Manage Toolbars */}
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