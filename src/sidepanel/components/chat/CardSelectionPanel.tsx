//
// import { KnowledgeCard } from '../../types/card.types';
// import { useStore } from '../../store';
//
// interface CardSelectionPanelProps {
//     cards: KnowledgeCard[];
//     selectedCards: string[];
// }
//
// export default function CardSelectionPanel({ cards, selectedCards }: CardSelectionPanelProps) {
//     const { setSelectedCardsForChat } = useStore();
//
//     const toggleCardSelection = (cardId: string) => {
//         const newSelection = selectedCards.includes(cardId)
//             ? selectedCards.filter(id => id !== cardId)
//             : [...selectedCards, cardId];
//         setSelectedCardsForChat(newSelection);
//     };
//
//     return (
//         <div className="px-4 py-2 bg-white/90 backdrop-blur-sm border-t border-gray-200/50 max-h-48 overflow-y-auto">
//             <div className="text-xs font-medium text-gray-700 mb-2">选择相关卡片</div>
//             <div className="grid grid-cols-1 gap-1">
//                 {cards.map(card => (
//                     <label
//                         key={card.id}
//                         className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
//                     >
//                         <input
//                             type="checkbox"
//                             checked={selectedCards.includes(card.id)}
//                             onChange={() => toggleCardSelection(card.id)}
//                             className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
//                         />
//                         <span className="text-xs text-gray-700 flex-1 truncate">{card.title}</span>
//                         <span className="text-[10px] text-gray-400">{card.tags[0]}</span>
//                     </label>
//                 ))}
//             </div>
//         </div>
//     );
// }