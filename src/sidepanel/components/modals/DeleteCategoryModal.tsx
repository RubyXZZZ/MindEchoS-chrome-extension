import React from 'react';
import { useStore } from '../../store';
import { AlertTriangle, X } from 'lucide-react';

export const DeleteCategoryModal: React.FC = () => {
    const {
        showDeleteCategoryModal,
        categoryToDelete,
        cancelDeleteCategory,
        deleteCategoryAndCards,
        moveCardsToOtherAndDeleteCategory,
    } = useStore();

    if (!showDeleteCategoryModal) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h2 className="text-lg font-semibold">删除分类</h2>
                    </div>
                    <button onClick={cancelDeleteCategory}>
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-700">
                        你确定要删除分类 "<strong>{categoryToDelete}</strong>" 吗？
                    </p>
                    <p className="text-xs text-gray-500">
                        请选择如何处理此分类下的所有知识卡片。
                    </p>

                    <div className="flex flex-col gap-3 mt-4">
                        <button
                            onClick={deleteCategoryAndCards}
                            className="w-full px-4 py-3 bg-red-100 text-red-800 rounded-lg text-sm text-left hover:bg-red-200 transition-colors"
                        >
                            <strong className="font-semibold">删除分类和所有相关卡片</strong>
                            <p className="text-xs text-red-700">此操作不可撤销，将永久删除该分类下的所有卡片。</p>
                        </button>

                        <button
                            onClick={moveCardsToOtherAndDeleteCategory}
                            className="w-full px-4 py-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm text-left hover:bg-yellow-200 transition-colors"
                        >
                            <strong className="font-semibold">仅删除分类</strong>
                            <p className="text-xs text-yellow-700">该分类下的所有卡片将被移动到 "Other" 分类。</p>
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t rounded-b-xl flex justify-end">
                    <button
                        onClick={cancelDeleteCategory}
                        className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 transition-colors"
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    );
};