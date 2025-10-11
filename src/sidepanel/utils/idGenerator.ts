/**
 * ID Generator Utility
 * Generates unique IDs with type prefixes for different entities
 *
 * Format: {prefix}-{timestamp}-{random}
 *
 * Examples:
 * - Card:    cd-1728345678901-k3j8x9p2q
 * - Message: ms-1728345679012-m2n4p6r8t
 * - Archive: ar-1728345680123-x5z7b9d2f
 */


const generateId = (prefix: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `${prefix}-${timestamp}-${random}`;
};


export const generateCardId = (): string => {
    return generateId('cd');
};


export const generateMessageId = (): string => {
    return generateId('ms');
};


export const generateArchiveId = (): string => {
    return generateId('ar');
};

// Get next available display number for Card

export const getNextDisplayNumber = async (): Promise<number> => {
    const result = await chrome.storage.local.get(['nextDisplayNumber']);
    const nextNum = result.nextDisplayNumber || 1;
    await chrome.storage.local.set({ nextDisplayNumber: nextNum + 1 });
    return nextNum;
};

/**
 * Reset display number counter to 1
 * Used when user wants to renumber all cards
 */
export const resetDisplayNumberCounter = async (): Promise<void> => {
    await chrome.storage.local.set({ nextDisplayNumber: 1 });
};