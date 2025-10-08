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

/**
 * Core ID generation function
 * @param prefix - Two-letter prefix to identify entity type
 * @returns Unique ID string
 */
const generateId = (prefix: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generate Card ID
 * @returns {string} cd-{timestamp}-{random}
 */
export const generateCardId = (): string => {
    return generateId('cd');
};

/**
 * Generate Message ID
 * @returns {string} ms-{timestamp}-{random}
 */
export const generateMessageId = (): string => {
    return generateId('ms');
};

/**
 * Generate Archive ID
 * @returns {string} ar-{timestamp}-{random}
 */
export const generateArchiveId = (): string => {
    return generateId('ar');
};

/**
 * Get next available display number for Card
 * Display numbers are sequential: 1, 2, 3...
 * Note: Display number 0 is reserved for the sample card
 *
 * @returns Promise<number> Next available display number
 */
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