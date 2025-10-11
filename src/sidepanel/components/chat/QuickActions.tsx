// AI chat 4 quick actions
import React from 'react';
import { BookOpen, GitCompare, GraduationCap, PenTool } from 'lucide-react';
import { WritingTaskType } from '../../types/writing.types';

interface QuickActionsProps {
    isGenerating: boolean;
    isInitializing: boolean;
    sessionReady: boolean;
    activeButton: string | null;
    showWriteMenu: boolean;
    onQuickAction: (action: string) => void;
    onWriteTask: (taskType: WritingTaskType) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
                                                              isGenerating,
                                                              isInitializing,
                                                              sessionReady,
                                                              activeButton,
                                                              showWriteMenu,
                                                              onQuickAction,
                                                              onWriteTask
                                                          }) => {
    const isDisabled = isGenerating || isInitializing || !sessionReady;

    return (
        <div className="flex-shrink-0 px-3 py-1.5 bg-gray-50/50 relative">
            {/* Write Menu */}
            {showWriteMenu && (
                <div className="write-menu-container absolute bottom-full right-3 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-56 z-50">
                    <div className="px-3 py-1 text-[10px] font-medium text-gray-500 uppercase">Writing Tasks</div>

                    <button
                        onClick={() => onWriteTask('summary')}
                        className="w-full px-3 py-2 text-left hover:bg-emerald-50 transition-colors flex items-center gap-2"
                    >
                        <span className="text-base">📝</span>
                        <div>
                            <div className="text-sm font-medium text-gray-900">Summary</div>
                            <div className="text-xs text-gray-500">Key points overview</div>
                        </div>
                    </button>

                    <button
                        onClick={() => onWriteTask('outline')}
                        className="w-full px-3 py-2 text-left hover:bg-emerald-50 transition-colors flex items-center gap-2"
                    >
                        <span className="text-base">📋</span>
                        <div>
                            <div className="text-sm font-medium text-gray-900">Outline</div>
                            <div className="text-xs text-gray-500">Structural framework</div>
                        </div>
                    </button>

                    <button
                        onClick={() => onWriteTask('draft')}
                        className="w-full px-3 py-2 text-left hover:bg-emerald-50 transition-colors flex items-center gap-2"
                    >
                        <span className="text-base">📄</span>
                        <div>
                            <div className="text-sm font-medium text-gray-900">Report Draft</div>
                            <div className="text-xs text-gray-500">Simple draft</div>
                        </div>
                    </button>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-1.5 justify-center">
                <button
                    onClick={() => onQuickAction('understand')}
                    disabled={isDisabled}
                    className={`px-2 py-1.5 rounded-lg shadow-lg border transition-all disabled:opacity-60 flex items-center gap-1.5 group ${
                        activeButton === 'understand'
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-xl'
                            : 'bg-white hover:bg-emerald-500 hover:text-white border-gray-200 hover:border-emerald-600'
                    }`}
                >
                    <BookOpen className={`w-3.5 h-3.5 ${
                        activeButton === 'understand' ? 'text-white' : 'text-blue-500 group-hover:text-white'
                    }`} />
                    <span className="text-sm">Understand</span>
                </button>

                <button
                    onClick={() => onQuickAction('compare')}
                    disabled={isDisabled}
                    className={`px-2 py-1.5 rounded-lg shadow-lg border transition-all disabled:opacity-60 flex items-center gap-1.5 group ${
                        activeButton === 'compare'
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-xl'
                            : 'bg-white hover:bg-emerald-500 hover:text-white border-gray-200 hover:border-emerald-600'
                    }`}
                >
                    <GitCompare className={`w-3.5 h-3.5 ${
                        activeButton === 'compare' ? 'text-white' : 'text-purple-500 group-hover:text-white'
                    }`} />
                    <span className="text-sm">Compare</span>
                </button>

                <button
                    onClick={() => onQuickAction('quiz')}
                    disabled={isDisabled}
                    className={`px-2 py-1.5 rounded-lg shadow-lg border transition-all disabled:opacity-60 flex items-center gap-1.5 group ${
                        activeButton === 'quiz'
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-xl'
                            : 'bg-white hover:bg-emerald-500 hover:text-white border-gray-200 hover:border-emerald-600'
                    }`}
                >
                    <GraduationCap className={`w-3.5 h-3.5 ${
                        activeButton === 'quiz' ? 'text-white' : 'text-amber-500 group-hover:text-white'
                    }`} />
                    <span className="text-sm ">Quiz</span>
                </button>

                <button
                    onClick={() => onQuickAction('write')}
                    disabled={isDisabled}
                    className={`px-2 py-1.5 rounded-lg shadow-lg border transition-all disabled:opacity-60 flex items-center gap-1.5 group ${
                        activeButton === 'write' || showWriteMenu
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-xl'
                            : 'bg-white hover:bg-emerald-500 hover:text-white border-gray-200 hover:border-emerald-600'
                    }`}
                >
                    <PenTool className={`w-3.5 h-3.5 ${
                        activeButton === 'write' || showWriteMenu ? 'text-white' : 'text-green-500 group-hover:text-white'
                    }`} />
                    <span className="text-sm">Write</span>
                </button>
            </div>
        </div>
    );
};