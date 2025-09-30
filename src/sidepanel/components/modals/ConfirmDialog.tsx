// components/common/ConfirmDialog.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
                                                                isOpen,
                                                                title = 'Confirm Action',
                                                                message,
                                                                confirmText = 'Confirm',
                                                                cancelText = 'Cancel',
                                                                onConfirm,
                                                                onCancel
                                                            }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[10002]"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)'
            }}
            onClick={(e) => {
                e.stopPropagation();  // 阻止点击事件冒泡
            }}
        >
            <div
                className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}  // 确保对话框内点击也不冒泡
            >
                <div className="p-4 flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="px-4 pb-4 flex justify-end gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();  // 阻止事件冒泡
                            onCancel();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();  // 阻止事件冒泡
                            onConfirm();
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};