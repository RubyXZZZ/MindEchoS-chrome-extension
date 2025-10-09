// utils/formatters.ts

export const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('zh-CN');
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

export const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const getHostname = (url: string): string => {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
};

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

    const selectedCards = allCards.filter(c => selectedCardIds.includes(c.id));

    if (selectedCards.length === 0) {
        return 'No cards';
    }

    if (selectedCards.length === 1) {
        // 单卡片：截断到 35 字符
        const title = selectedCards[0].title;
        return title.length > 35 ? title.substring(0, 32) + '...' : title;
    } else if (selectedCards.length === 2) {
        // 2 张卡片：每个截断到 18 字符
        const titles = selectedCards.map(c =>
            c.title.length > 18 ? c.title.substring(0, 15) + '...' : c.title
        );
        return titles.join(', ');
    } else {
        // 3+ 张卡片：显示第 1 张 + 数量
        const firstTitle = selectedCards[0].title;
        const truncated = firstTitle.length > 22 ? firstTitle.substring(0, 19) + '...' : firstTitle;
        return `${truncated} +${selectedCards.length - 1}`;
    }
};