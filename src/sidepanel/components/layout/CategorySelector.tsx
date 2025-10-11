// used for add-card-modal and manage-mode

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { useStore } from '../../store';
import { DEFAULT_CATEGORY } from '../../utils/constants';

interface CategorySelectorProps {
    value: string;
    onChange: (category: string) => void;
    className?: string;
    placeholder?: string;
    dropDirection?: 'up' | 'down';
    manageMode?: boolean;
    onCancel?: () => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
                                                                      value,
                                                                      onChange,
                                                                      className = '',
                                                                      placeholder = '选择分类',
                                                                      dropDirection = 'down',
                                                                      manageMode = false,
                                                                      onCancel
                                                                  }) => {
    const { userCategories, addCategory } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryInput, setNewCategoryInput] = useState('');
    const [tempSelectedCategory, setTempSelectedCategory] = useState(value);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Other shown last one
    const allCategories = [...userCategories, DEFAULT_CATEGORY];


    useEffect(() => {
        if (manageMode) {
            setTempSelectedCategory(value);
        }
    }, [value, manageMode]);


    useEffect(() => {
        if (!manageMode) {
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                    setShowNewCategoryInput(false);
                    setNewCategoryInput('');
                }
            };

            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen, manageMode]);

    // focus input
    useEffect(() => {
        if (showNewCategoryInput && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showNewCategoryInput]);

    const handleAddCategory = async () => {
        const trimmedCategory = newCategoryInput.trim();
        if (trimmedCategory) {
            const exists = allCategories.some(cat =>
                cat.toLowerCase() === trimmedCategory.toLowerCase()
            );

            if (!exists) {
                await addCategory(trimmedCategory);
                if (manageMode) {
                    setTempSelectedCategory(trimmedCategory);
                } else {
                    onChange(trimmedCategory);
                    setIsOpen(false);
                }
            }

            setNewCategoryInput('');
            setShowNewCategoryInput(false);
        }
    };

    const handleCategorySelect = (category: string) => {
        if (manageMode) {
            setTempSelectedCategory(category);
        } else {
            onChange(category);
            setIsOpen(false);
        }
    };

    const handleConfirm = () => {
        onChange(tempSelectedCategory);
        setIsOpen(false);
    };

    const handleCancel = () => {
        setTempSelectedCategory(value);
        setShowNewCategoryInput(false);
        setNewCategoryInput('');
        if (onCancel) onCancel();
    };

    const handleAddNewClick = () => {
        setShowNewCategoryInput(true);
    };

    const dropdownPositionClasses = dropDirection === 'up'
        ? 'bottom-full mb-1'
        : 'top-full mt-1';

    const shouldShowList = manageMode || isOpen;
    const currentValue = manageMode ? tempSelectedCategory : value;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>

            {!manageMode && (
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-3 py-2 text-left bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent flex items-center justify-between"
                >
                    <span className="text-gray-700">{value || placeholder}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            )}


            {shouldShowList && (
                <div
                    className={`${manageMode ? '' : 'absolute'} z-[99999] w-full bg-gray-100 border border-gray-400 rounded-xl shadow-xl overflow-hidden ${!manageMode ? dropdownPositionClasses : ''}`}
                    style={{ zIndex: 99999 }}
                >
                    {/* tag list */}
                    <div className="max-h-60 overflow-y-auto">
                        {/* current tag */}
                        {allCategories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                onClick={() => handleCategorySelect(category)}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-green-50 flex items-center justify-between group"
                            >
                                <span className="font-medium">{category}</span>
                                {currentValue === category && (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                )}
                            </button>
                        ))}
                    </div>


                    <div className="border-t border-gray-300"></div>

                    {/* add new*/}
                    {!showNewCategoryInput ? (
                        <button
                            type="button"
                            onClick={handleAddNewClick}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="font-medium">Add A New Tag</span>
                        </button>
                    ) : (
                        <div className="p-3 bg-gray-50">
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newCategoryInput}
                                    onChange={(e) => setNewCategoryInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCategory();
                                        }
                                        if (e.key === 'Escape') {
                                            setShowNewCategoryInput(false);
                                            setNewCategoryInput('');
                                        }
                                    }}
                                    placeholder="New category name..."
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCategory}
                                    className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 shadow-sm"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewCategoryInput(false);
                                        setNewCategoryInput('');
                                    }}
                                    className="px-3 py-1.5 bg-white text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100 border border-gray-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* confirm/cancel button */}
                    {manageMode && (
                        <>
                            <div className="border-t border-gray-200"></div>
                            <div className="p-3 bg-gray-50 flex gap-2">
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 shadow-sm"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 border border-gray-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};