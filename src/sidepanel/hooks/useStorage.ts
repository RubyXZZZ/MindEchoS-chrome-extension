// import { useState, useEffect, useCallback } from 'react';
//
// /**
//  * Generic hook for Chrome storage operations
//  * Can be used for any data type
//  */
// export function useStorage<T>(key: string, initialValue: T) {
//     const [value, setValue] = useState<T>(initialValue);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//
//     // Load data from storage
//     useEffect(() => {
//         loadValue();
//     }, [key]);
//
//     const loadValue = async () => {
//         setIsLoading(true);
//         setError(null);
//
//         try {
//             if (typeof chrome !== 'undefined' && chrome.storage) {
//                 const result = await chrome.storage.local.get(key);
//                 if (result[key] !== undefined) {
//                     setValue(result[key]);
//                 }
//             } else {
//                 // Fallback to localStorage for development
//                 const stored = localStorage.getItem(key);
//                 if (stored) {
//                     setValue(JSON.parse(stored));
//                 }
//             }
//         } catch (err) {
//             setError('Failed to load from storage');
//             console.error('Storage load error:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//     // Save value to storage
//     const saveValue = useCallback(async (newValue: T) => {
//         setError(null);
//
//         try {
//             setValue(newValue);
//
//             if (typeof chrome !== 'undefined' && chrome.storage) {
//                 await chrome.storage.local.set({ [key]: newValue });
//             } else {
//                 // Fallback to localStorage for development
//                 localStorage.setItem(key, JSON.stringify(newValue));
//             }
//         } catch (err) {
//             setError('Failed to save to storage');
//             console.error('Storage save error:', err);
//             throw err;
//         }
//     }, [key]);
//
//     // Remove value from storage
//     const removeValue = useCallback(async () => {
//         setError(null);
//
//         try {
//             setValue(initialValue);
//
//             if (typeof chrome !== 'undefined' && chrome.storage) {
//                 await chrome.storage.local.remove(key);
//             } else {
//                 localStorage.removeItem(key);
//             }
//         } catch (err) {
//             setError('Failed to remove from storage');
//             console.error('Storage remove error:', err);
//             throw err;
//         }
//     }, [key, initialValue]);
//
//     // Clear all storage
//     const clearStorage = useCallback(async () => {
//         setError(null);
//
//         try {
//             if (typeof chrome !== 'undefined' && chrome.storage) {
//                 await chrome.storage.local.clear();
//             } else {
//                 localStorage.clear();
//             }
//         } catch (err) {
//             setError('Failed to clear storage');
//             console.error('Storage clear error:', err);
//             throw err;
//         }
//     }, []);
//
//     return {
//         value,
//         isLoading,
//         error,
//         setValue: saveValue,
//         removeValue,
//         clearStorage,
//         reload: loadValue
//     };
// }
