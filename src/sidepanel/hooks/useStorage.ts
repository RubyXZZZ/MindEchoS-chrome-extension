import { useEffect, useState } from 'react';

export function useStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    useEffect(() => {
        // Load from chrome.storage on mount
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(key, (result) => {
                if (result[key]) {
                    setStoredValue(result[key]);
                }
            });
        } else {
            // Fallback to localStorage
            const item = window.localStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        }
    }, [key]);

    const setValue = (value: T | ((val: T) => T)) => {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ [key]: valueToStore });
        } else {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
    };

    return [storedValue, setValue] as const;
}
