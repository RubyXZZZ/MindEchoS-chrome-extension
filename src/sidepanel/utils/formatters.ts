// utils/formatters.ts

/**
 * Format timestamp as locale date string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string (e.g., "10/8/2024")
 */
export const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US');
};

/**
 * Format timestamp as MM/DD/YYYY for card display
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string (e.g., "10/08/2024")
 */
export const formatCardDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

/**
 * Format timestamp as MM/DD/YYYY HH:MM for archive display
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date and time string (e.g., "10/8/2024 14:25")
 */
export const formatArchiveDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
};

/**
 * Format timestamp as time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string (e.g., "02:45 PM")
 */
export const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Extract hostname from URL
 * @param url - Full URL string
 * @returns Hostname (e.g., "example.com")
 */
export const getHostname = (url: string): string => {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
};

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Get cards summary for archive display
 * @param selectedCardIds - Array of selected card IDs
 * @param allCards - All available cards
 * @returns Summary string
 */
export const getArchiveCardsSummary = (
    selectedCardIds: string[],
    allCards: Array<{ id: string; title: string }>
): string => {
    if (selectedCardIds.length === 0) {
        return 'No cards';
    }

    // Optimize: Use Set for faster lookup
    const idSet = new Set(selectedCardIds);
    const selectedCards = allCards.filter(c => idSet.has(c.id));

    if (selectedCards.length === 0) {
        return 'No cards';
    }

    if (selectedCards.length === 1) {
        // Single card: truncate to 35 characters
        const title = selectedCards[0].title;
        return title.length > 35 ? title.substring(0, 32) + '...' : title;
    } else if (selectedCards.length === 2) {
        // 2 cards: truncate each to 18 characters
        const titles = selectedCards.map(c =>
            c.title.length > 18 ? c.title.substring(0, 15) + '...' : c.title
        );
        return titles.join(', ');
    } else {
        // 3+ cards: show first card + count
        const firstTitle = selectedCards[0].title;
        const truncated = firstTitle.length > 22 ? firstTitle.substring(0, 19) + '...' : firstTitle;
        return `${truncated} +${selectedCards.length - 1}`;
    }
};