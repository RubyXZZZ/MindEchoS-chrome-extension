// src/components/modals/ConfirmDialog.tsx
import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface AdditionalAction {
    text: string;
    onClick: () => void;
    className?: string;
}

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    additionalActions?: AdditionalAction[];
    cancelButtonStyle?: 'default' | 'primary';
    confirmButtonStyle?: 'default' | 'primary' | 'danger';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
                                                                isOpen,
                                                                title,
                                                                message,
                                                                confirmText = 'Confirm',
                                                                cancelText = 'Cancel',
                                                                onConfirm,
                                                                onCancel,
                                                                additionalActions = [],
                                                                cancelButtonStyle = 'default',
                                                                confirmButtonStyle = 'danger'
                                                            }) => {
    if (!isOpen) return null;

    // Determine confirm button styles
    const getConfirmButtonClass = () => {
        switch (confirmButtonStyle) {
            case 'primary':
                return 'bg-emerald-500 text-white hover:bg-emerald-600';
            case 'danger':
                return 'bg-red-500 text-white hover:bg-red-600';
            default:
                return 'bg-gray-500 text-white hover:bg-gray-600';
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {title}
                        </h3>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    {typeof message === 'string' ? (
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {message}
                        </p>
                    ) : (
                        message
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-col gap-2">
                        {/* Primary Action (Confirm) */}
                        <button
                            onClick={onConfirm}
                            className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${getConfirmButtonClass()}`}
                        >
                            {confirmText}
                        </button>

                        {/* Additional Actions */}
                        {additionalActions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    action.className || 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {action.text}
                            </button>
                        ))}

                        {/* Cancel */}
                        <button
                            onClick={onCancel}
                            className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                cancelButtonStyle === 'primary'
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};