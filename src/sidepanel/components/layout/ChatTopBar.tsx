// components/chat/ChatTopBar.tsx
import React from 'react';
import { Layers, X } from 'lucide-react';
import { KnowledgeCard } from '../../types/card.types';

interface ChatTopBarProps {
    selectedCards: KnowledgeCard[];
    allCards: KnowledgeCard[];
    selectedCardIds: string[];
    onToggleCard: (cardId: string) => void;
    onNewChat: () => void;
    isGenerating: boolean;
    isInitializing: boolean;
}

export const ChatTopBar: React.FC<ChatTopBarProps> = ({
                                                          selectedCards,
                                                          allCards,
                                                          selectedCardIds,
                                                          onToggleCard,
                                                          onNewChat,
                                                          isGenerating,
                                                          isInitializing
                                                      }) => {
    const [showSelector, setShowSelector] = React.useState(false);

    return (
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-3 py-2">
            <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-emerald-700">
                    AI Assistant
                </div>

                <button
                    onClick={() => setShowSelector(!showSelector)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                        selectedCards.length > 0
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600'
                            : 'text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                    }`}
                >
                    <Layers className="w-3.5 h-3.5" />
                    {selectedCards.length > 0 ? `${selectedCards.length} Card${selectedCards.length > 1 ? 's' : ''}` : 'Select Cards'}
                </button>

                <button
                    onClick={onNewChat}
                    disabled={isGenerating || isInitializing}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                >
                    + New Chat
                </button>
            </div>

            {/* Card Selector Dropdown */}
            {showSelector && (
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">Select Context Cards</h4>
                        <button onClick={() => setShowSelector(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {allCards.filter(card => card.id !== 'sample-card-1').map(card => {
                            const isSelected = selectedCardIds.includes(card.id);
                            return (
                                <label
                                    key={card.id}
                                    className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                                        isSelected
                                            ? 'bg-emerald-50 border border-emerald-300'
                                            : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleCard(card.id)}
                                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{card.title}</p>
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{card.content}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setShowSelector(false)}
                        className="w-full mt-3 px-3 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
};