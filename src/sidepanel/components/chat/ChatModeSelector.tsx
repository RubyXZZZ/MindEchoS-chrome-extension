// import React, { useState } from 'react';
// import { MessageSquare, Layers, Brain, FileText, ChevronDown } from 'lucide-react';
// import type { ChatMode } from '@/types/chat.types';
// import type { KnowledgeCard } from '@/types/card.types';
//
// interface ChatModeSelectorProps {
//     currentMode: ChatMode;
//     onModeChange: (mode: ChatMode) => void;
//     selectedCards: string[];
//     onCardsChange: (cards: string[]) => void;
//     availableCards: KnowledgeCard[];
// }
//
// export const ChatModeSelector: React.FC<ChatModeSelectorProps> = ({
//                                                                       currentMode,
//                                                                       onModeChange,
//                                                                       selectedCards,
//                                                                       onCardsChange,
//                                                                       availableCards,
//                                                                   }) => {
//     const [showCardSelector, setShowCardSelector] = useState(false);
//
//     const modes = [
//         { id: 'free' as ChatMode, icon: MessageSquare, label: '自由对话', description: '开放式AI对话' },
//         { id: 'cards' as ChatMode, icon: Layers, label: '卡片对话', description: '基于卡片内容分析' },
//         { id: 'mindmap' as ChatMode, icon: Brain, label: '生成脑图', description: '知识结构可视化' },
//         { id: 'summarize' as ChatMode, icon: FileText, label: '内容总结', description: '快速提取要点' },
//     ];
//
//     const handleModeChange = (mode: ChatMode) => {
//         onModeChange(mode);
//         if (mode !== 'cards' && mode !== 'summarize') {
//             setShowCardSelector(false);
//         }
//     };
//
//     const toggleCardSelection = (cardId: string) => {
//         if (selectedCards.includes(cardId)) {
//             onCardsChange(selectedCards.filter(id => id !== cardId));
//         } else {
//             onCardsChange([...selectedCards, cardId]);
//         }
//     };
//
//     return (
//         <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50">
//             {/* Mode Buttons */}
//             <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
//                 {modes.map(mode => (
//                     <button
//                         key={mode.id}
//                         onClick={() => handleModeChange(mode.id)}
//                         className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
//                             currentMode === mode.id
//                                 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
//                                 : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
//                         }`}
//                         title={mode.description}
//                     >
//                         <mode.icon className="w-3.5 h-3.5" />
//                         {mode.label}
//                         {mode.id === 'cards' && selectedCards.length > 0 && (
//                             <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] rounded-full">
//                 {selectedCards.length}
//               </span>
//                         )}
//                     </button>
//                 ))}
//
//                 {/* Card Selector Toggle */}
//                 {(currentMode === 'cards' || currentMode === 'summarize') && (
//                     <button
//                         onClick={() => setShowCardSelector(!showCardSelector)}
//                         className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
//                     >
//                         <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
//                             showCardSelector ? 'rotate-180' : ''
//                         }`} />
//                     </button>
//                 )}
//             </div>
//
//             {/* Card Selection Panel */}
//             {showCardSelector && (currentMode === 'cards' || currentMode === 'summarize') && (
//                 <div className="px-4 py-2 border-t border-gray-100 max-h-48 overflow-y-auto">
//                     <div className="text-xs font-medium text-gray-700 mb-2">
//                         选择相关卡片 ({selectedCards.length}/{availableCards.length})
//                     </div>
//                     <div className="space-y-1">
//                         {availableCards.map(card => (
//                             <label
//                                 key={card.id}
//                                 className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
//                             >
//                                 <input
//                                     type="checkbox"
//                                     checked={selectedCards.includes(card.id)}
//                                     onChange={() => toggleCardSelection(card.id)}
//                                     className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
//                                 />
//                                 <div className="flex-1 min-w-0">
//                                     <div className="text-xs font-medium text-gray-700 truncate">{card.title}</div>
//                                     <div className="text-[10px] text-gray-500 truncate">{card.summary}</div>
//                                 </div>
//                             </label>
//                         ))}
//                     </div>
//
//                     {/* Quick Actions */}
//                     <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
//                         <button
//                             onClick={() => onCardsChange(availableCards.map(c => c.id))}
//                             className="text-xs text-emerald-600 hover:text-emerald-700"
//                         >
//                             全选
//                         </button>
//                         <button
//                             onClick={() => onCardsChange([])}
//                             className="text-xs text-gray-500 hover:text-gray-700"
//                         >
//                             清空
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };