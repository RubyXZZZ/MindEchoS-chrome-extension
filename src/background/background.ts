
// Background script for Chrome extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Knowledge Manager Extension installed');

    // Set up context menu for text selection
    chrome.contextMenus.create({
        id: 'capture-selection',
        title: 'Save to Knowledge Cards',
        contexts: ['selection']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'capture-selection' && info.selectionText) {
        // Send selected text to sidepanel
        await chrome.storage.local.set({
            pendingCapture: {
                type: 'selection',
                content: info.selectionText,
                url: tab?.url || '',
                title: tab?.title || 'Selected Text',
                timestamp: Date.now()
            }
        });

        // Open sidepanel - check if windowId exists
        if (tab?.windowId !== undefined) {
            await chrome.sidePanel.open({ windowId: tab.windowId });
        } else {
            // Fallback: get current window
            const currentWindow = await chrome.windows.getCurrent();
            if (currentWindow.id !== undefined) {
                await chrome.sidePanel.open({ windowId: currentWindow.id });
            }
        }
    }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'capturePageContent') {
        // Capture current page content
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const tab = tabs[0];
            if (tab.id) {
                try {
                    // Inject content script to capture page
                    const results = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: capturePageContent,
                    });

                    sendResponse(results[0].result);
                } catch (error) {
                    console.error('Failed to capture page content:', error);
                    sendResponse(null);
                }
            }
        });
        return true; // Keep message channel open
    }

    if (request.action === 'summarizeContent') {
        // This will use Chrome's AI APIs when available
        handleSummarization(request.content).then(sendResponse);
        return true;
    }
});

// Function to capture page content (injected into page)
function capturePageContent() {
    const content = document.body.innerText || '';
    const title = document.title;
    const url = window.location.href;
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    return {
        title,
        url,
        content: content.substring(0, 5000), // Limit content length
        description: metaDescription,
        timestamp: Date.now()
    };
}

// Handle AI summarization (placeholder for Chrome AI API)
async function handleSummarization(content: string) {
    // When Chrome AI APIs are available:
    // const session = await ai.summarizer.create();
    // const summary = await session.summarize(content);

    // Mock implementation for now
    return {
        summary: content.substring(0, 200) + '...',
        keyPoints: ['Point 1', 'Point 2', 'Point 3']
    };
}

// Handle sidepanel action button click
chrome.action.onClicked.addListener(async (tab) => {
    // Open sidepanel when extension icon is clicked
    if (tab.windowId !== undefined) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
    } else {
        // Fallback: get current window
        const currentWindow = await chrome.windows.getCurrent();
        if (currentWindow.id !== undefined) {
            await chrome.sidePanel.open({ windowId: currentWindow.id });
        }
    }
});
