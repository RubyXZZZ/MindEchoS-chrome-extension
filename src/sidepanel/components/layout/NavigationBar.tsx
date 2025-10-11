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

    // remember last view
    const [lastContentView, setLastContentView] = React.useState<'cards' | 'chat'>('cards');


    React.useEffect(() => {
        if (currentView === 'cards' || currentView === 'chat') {
            setLastContentView(currentView);
        }
    }, [currentView]);


    const displayView = currentView === 'settings' ? lastContentView : currentView;

    const handleLogoClick = () => {
        setCurrentView('settings');

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
            <div className="px-3 py-1">
                <div className="flex items-center gap-2">
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
                    <div className="relative bg-gray-200 rounded-lg p-[2px] flex flex-shrink-0">
                        {/* Sliding Green Background */}
                        <div
                            className="absolute top-[2px] bottom-[2px] left-[2px] w-[68px] bg-emerald-500 rounded-md shadow-md transition-transform duration-300 ease-out"
                            style={{
                                transform: displayView === 'cards' ? 'translateX(0)' : 'translateX(68px)',
                                willChange: 'transform'
                            }}
                        />

                        {/* Buttons */}
                        <button
                            onClick={() => handleViewChange('cards')}
                            className={`relative z-10 w-[68px] py-1 rounded-md text-sm font-medium transition-colors duration-300 ${
                                displayView === 'cards'
                                    ? 'text-white'
                                    : 'text-gray-700 hover:text-gray-900'
                            }`}
                        >
                            Cards
                        </button>
                        <button
                            onClick={() => handleViewChange('chat')}
                            className={`relative z-10 w-[68px] py-1.5 rounded-md text-sm font-medium transition-colors duration-300 ${
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
                        className={`w-[76px] h-7 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 flex-shrink-0 ${
                            isManageMode
                                ? 'bg-gray-800 text-white hover:bg-gray-900'
                                : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                    >
                        {isManageMode ? (
                            <><X className="w-3 h-3" /><span>Cancel</span></>
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