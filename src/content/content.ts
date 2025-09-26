import {Readability} from "@mozilla/readability";

/**
 * Content script that runs in webpages
 * Handles text selection and page content extraction(Mozilla Readability)
 */

// Capture selected text
function captureSelection() {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';
    if (selectedText.length <= 2) {
        return {
            text: '',
            url: window.location.href,
            title: document.title,
            hasSelection: false
        };
    }

    return {
        text: selectedText.substring(0, 5000),
        url: window.location.href,
        title: document.title,
        hasSelection: true
    };
}


// keyboard shortcut (ctrl + shift + s)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        const selection = captureSelection();
        if (selection.hasSelection) {
            chrome.runtime.sendMessage({
                type: 'CAPTURE_SELECTION',
                data: selection
            });
        }
    }
});


// Extract page content
function extractPageContent() {
    try {
        // Clone document to avoid modifying the original
        const documentClone = document.cloneNode(true) as Document;

        // Create Readability instance
        const reader = new Readability(documentClone);
        const article = reader.parse();

        if (article?.textContent) {
            return {
                success: true,
                title: article.title,
                content: article.textContent.substring(0, 8000),
                url: window.location.href
            };
        }
    } catch (error) {
        console.warn("Extraction failed:", error);
    }
    return {
        success: false,
        title: document.title,
        content: document.body.innerText.substring(0, 8000),
        url: window.location.href
    };
}

// Listen for requests from extension
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {
        case 'EXTRACT_CONTENT':
            sendResponse(extractPageContent());
            break;
        case 'GET_SELECTION':
            sendResponse(captureSelection());
            break;
    }
    return true;
});
