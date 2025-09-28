import React from 'react';
// import { Archive, RefreshCw, Copy, Download, Settings, Trash2 } from 'lucide-react';
// import { useStore } from '../../store';

interface ChatManageToolbarProps {
    onActionComplete: () => void;
}
export const ChatManageToolbar: React.FC<ChatManageToolbarProps> = ({
                                                                        onActionComplete: _onActionComplete  // 使用下划线前缀表示刻意不使用
                                                                    }) => {
    return (
        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-center">
            <div className="text-xs text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
                对话管理功能待开发
            </div>
        </div>
    );
};

// export const ChatManageToolbar: React.FC<ChatManageToolbarProps> = ({
//                                                                         onActionComplete
//                                                                     }) => {
    // const { messages, clearMessages, regenerateLastResponse } = useStore();
    //
    // const handleClearHistory = () => {
    //     if (window.confirm('确定要清除所有对话历史吗？')) {
    //         clearMessages();
    //         onActionComplete();
    //     }
    // };
    //
    // const handleRegenerate = () => {
    //     regenerateLastResponse();
    // };
    //
    // const handleCopyConversation = async () => {
    //     const conversationText = messages.map(m =>
    //         `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`
    //     ).join('\n\n');
    //
    //     await navigator.clipboard.writeText(conversationText);
    //     // 显示复制成功提示
    //     console.log('Conversation copied');
    // };
    //
    // const handleExportChat = () => {
    //     const chatData = {
    //         timestamp: new Date().toISOString(),
    //         messages: messages
    //     };
    //     const dataStr = JSON.stringify(chatData, null, 2);
    //     const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    //     const linkElement = document.createElement('a');
    //     linkElement.setAttribute('href', dataUri);
    //     linkElement.setAttribute('download', `chat_export_${Date.now()}.json`);
    //     linkElement.click();
    // };
    //
    // const handleAISettings = () => {
    //     // 打开 AI 设置模态框
    //     console.log('Open AI settings');
    // };

//     return (
//         <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
//             <span className="text-xs text-gray-600">
//                 对话管理工具
//             </span>
//             <div className="flex gap-1">
//                 <button
//                     // onClick={handleClearHistory}
//                     className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 flex items-center gap-1"
//                 >
//                     <Trash2 className="w-3 h-3" />
//                     清除历史
//                 </button>
//                 <button
//                     // onClick={handleRegenerate}
//                     className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 flex items-center gap-1"
//                 >
//                     <RefreshCw className="w-3 h-3" />
//                     重新生成
//                 </button>
//                 <button
//                     // onClick={handleCopyConversation}
//                     className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 flex items-center gap-1"
//                 >
//                     <Copy className="w-3 h-3" />
//                     复制对话
//                 </button>
//                 <button
//                     // onClick={handleExportChat}
//                     className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200 flex items-center gap-1"
//                 >
//                     <Download className="w-3 h-3" />
//                     导出
//                 </button>
//                 <button
//                     // onClick={handleAISettings}
//                     className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200 flex items-center gap-1"
//                 >
//                     <Settings className="w-3 h-3" />
//                     AI设置
//                 </button>
//             </div>
//         </div>
//     );
// };