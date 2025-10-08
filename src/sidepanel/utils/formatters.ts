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