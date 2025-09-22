// import React from 'react';
// import { User, Bot } from 'lucide-react';
// import type { ChatMessage as ChatMessageType } from '@/types/chat.types';
//
// interface ChatMessageProps {
//     message: ChatMessageType;
// }
//
// export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
//     const isUser = message.role === 'user';
//
//     return (
//         <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-enter`}>
//             <div className={`max-w-[85%] flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
//                 {/* Avatar */}
//                 <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
//                     isUser ? 'bg-emerald-100' : 'bg-gray-100'
//                 }`}>
//                     {isUser ? (
//                         <User className="w-4 h-4 text-emerald-600" />
//                     ) : (
//                         <Bot className="w-4 h-4 text-gray-600" />
//                     )}
//                 </div>
//
//                 {/* Message Content */}
//                 <div>
//                     <div className={`px-4 py-2.5 text-sm ${
//                         isUser
//                             ? 'bg-emerald-100 text-gray-800 rounded-2xl rounded-br-sm shadow-sm'
//                             : 'bg-white/90 text-gray-800 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100'
//                     }`}>
//                         <p className="whitespace-pre-wrap">{message.content}</p>
//                     </div>
//
//                     {/* Timestamp and Status */}
//                     <div className={`mt-1 px-1 flex items-center gap-2 ${isUser ? 'justify-end' : ''}`}>
//             <span className="text-[10px] text-gray-400">
//               {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
//                   hour: '2-digit',
//                   minute: '2-digit'
//               })}
//             </span>
//                         {message.status === 'error' && (
//                             <span className="text-[10px] text-red-500">发送失败</span>
//                         )}
//                         {message.metadata?.mode && (
//                             <span className="text-[10px] text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">
//                 {message.metadata.mode}
//               </span>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };