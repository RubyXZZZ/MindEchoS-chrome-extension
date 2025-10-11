// Responsibility: Respond to background requests, get selected text or full webpage content

import { Readability } from '@mozilla/readability';

/**
 * Get selected text from current page
 */
function getSelectionText(): string {
    return window.getSelection()?.toString().trim() || '';
}

/**
 * Extract webpage content using Readability
 */
function extractPageContent(): {
    success: boolean;
    title: string;
    content: string;
    url: string;
} {
    try {
        // Clone document to avoid modifying the original
        const documentClone = document.cloneNode(true) as Document;

        // Create Readability instance
        const reader = new Readability(documentClone);
        const article = reader.parse();

        if (article?.textContent) {
            return {
                success: true,
                title: article.title || document.title || '',
                content: article.textContent.substring(0, 8000),
                url: window.location.href
            };
        }
    } catch (error) {
        console.warn('[Content] Readability extraction failed:', error);
    }

    // Fallback to basic extraction
    return {
        success: false,
        title: document.title,
        content: document.body.innerText.substring(0, 8000),
        url: window.location.href
    };
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // Respond to PING check
    if (message.command === 'PING') {
        sendResponse({ alive: true });
        return true;
    }

    // Get selected text and send to background
    if (message.command === 'GET_SELECTION') {
        const selectionText = getSelectionText();

        if (selectionText && selectionText.length > 2) {
            chrome.runtime.sendMessage({
                type: 'SELECTION_DATA',
                data: {
                    text: selectionText.substring(0, 5000),
                    url: window.location.href,
                    needsSummarize: true
                }
            });
        }

        sendResponse({ received: true });
        return true;
    }

    // Get current page selection (for AddCardModal Selection button)
    if (message.command === 'GET_SELECTION_FOR_MODAL') {
        const selectionText = getSelectionText();

        if (selectionText && selectionText.length > 2) {
            sendResponse({
                success: true,
                data: {
                    text: selectionText.substring(0, 5000),
                    url: window.location.href
                }
            });
        } else {
            sendResponse({
                success: false,
                error: 'Please select text on the page first'
            });
        }
        return true;
    }

    // Extract full webpage content (for AddCardModal Webpage button)
    if (message.command === 'EXTRACT_WEBPAGE') {
        const pageData = extractPageContent();
        sendResponse({
            success: true,
            data: pageData
        });
        return true;
    }
});