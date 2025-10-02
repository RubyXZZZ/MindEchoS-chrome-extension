// // components/chat/WritingTaskSelector.tsx
// // 写作任务选择器
//
// import React, { useState } from 'react';
// import { X } from 'lucide-react';
// import { WritingTaskType, WRITING_TASKS } from '../../types/writing.types';
// import { AIProvider } from '../../hooks/useWriting';
//
// interface WritingTaskSelectorProps {
//     isOpen: boolean;
//     onClose: () => void;
//     onSelect: (task: WritingTaskType, customPrompt: string | null, provider: AIProvider) => void;
//     writerAvailable: boolean;
// }
//
// export const WritingTaskSelector: React.FC<WritingTaskSelectorProps> = ({
//                                                                             isOpen,
//                                                                             onClose,
//                                                                             onSelect,
//                                                                             writerAvailable
//                                                                         }) => {
//     const [selectedTask, setSelectedTask] = useState<WritingTaskType | null>(null);
//     const [customPrompt, setCustomPrompt] = useState('');
//     const [selectedProvider, setSelectedProvider] = useState<AIProvider>('prompt');
//
//     if (!isOpen) return null;
//
//     const handleTaskClick = (taskId: WritingTaskType) => {
//         if (taskId === 'custom') {
//             setSelectedTask('custom');
//         } else {
//             // 非 custom 任务直接执行
//             onSelect(taskId, null, selectedProvider);
//             onClose();
//         }
//     };
//
//     const handleCustomSubmit = () => {
//         if (customPrompt.trim()) {
//             onSelect('custom', customPrompt, selectedProvider);
//             setCustomPrompt('');
//             setSelectedTask(null);
//             onClose();
//         }
//     };
//
//     const handleClose = () => {
//         setSelectedTask(null);
//         setCustomPrompt('');
//         onClose();
//     };
//
//     return (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl shadow-2xl w-[400px] max-h-[600px] overflow-hidden">
//                 {/* Header */}
//                 <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
//                     <h3 className="text-base font-semibold text-gray-900">
//                         {selectedTask === 'custom' ? 'Custom Writing Task' : 'What would you like to write?'}
//                     </h3>
//                     <button
//                         onClick={handleClose}
//                         className="text-gray-400 hover:text-gray-600"
//                     >
//                         <X className="w-5 h-5" />
//                     </button>
//                 </div>
//
//                 {/* Content */}
//                 <div className="p-4">
//                     {selectedTask === 'custom' ? (
//                         // Custom prompt input
//                         <div className="space-y-3">
//                             <p className="text-sm text-gray-600">
//                                 Describe what you want to write:
//                             </p>
//                             <textarea
//                                 value={customPrompt}
//                                 onChange={(e) => setCustomPrompt(e.target.value)}
//                                 placeholder="E.g., Write a technical proposal for implementing a new feature..."
//                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
//                                 rows={6}
//                                 autoFocus
//                             />
//                             <div className="flex gap-2">
//                                 <button
//                                     onClick={() => setSelectedTask(null)}
//                                     className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
//                                 >
//                                     Back
//                                 </button>
//                                 <button
//                                     onClick={handleCustomSubmit}
//                                     disabled={!customPrompt.trim()}
//                                     className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
//                                 >
//                                     Generate
//                                 </button>
//                             </div>
//                         </div>
//                     ) : (
//                         // Task selection
//                         <>
//                             <div className="space-y-2 mb-4">
//                                 {Object.values(WRITING_TASKS).map(task => (
//                                     <button
//                                         key={task.id}
//                                         onClick={() => handleTaskClick(task.id)}
//                                         className="w-full flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group"
//                                     >
//                                         <span className="text-2xl flex-shrink-0">{task.icon}</span>
//                                         <div className="flex-1">
//                                             <div className="font-medium text-gray-900 text-sm group-hover:text-emerald-700">
//                                                 {task.label}
//                                             </div>
//                                             <div className="text-xs text-gray-500 mt-0.5">
//                                                 {task.description}
//                                             </div>
//                                         </div>
//                                     </button>
//                                 ))}
//                             </div>
//
//                             {/* Provider Selection - for testing */}
//                             <div className="pt-3 border-t border-gray-200">
//                                 <p className="text-xs font-medium text-gray-700 mb-2">AI Provider (for testing):</p>
//                                 <div className="flex gap-2">
//                                     <button
//                                         onClick={() => setSelectedProvider('prompt')}
//                                         className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-all ${
//                                             selectedProvider === 'prompt'
//                                                 ? 'bg-emerald-500 text-white border-emerald-600'
//                                                 : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-300'
//                                         }`}
//                                     >
//                                         Prompt API
//                                     </button>
//                                     <button
//                                         onClick={() => setSelectedProvider('writer')}
//                                         disabled={!writerAvailable}
//                                         className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-all ${
//                                             selectedProvider === 'writer'
//                                                 ? 'bg-emerald-500 text-white border-emerald-600'
//                                                 : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-300'
//                                         } disabled:opacity-50 disabled:cursor-not-allowed`}
//                                     >
//                                         Writer API
//                                         {!writerAvailable && ' (unavailable)'}
//                                     </button>
//                                 </div>
//                             </div>
//                         </>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };