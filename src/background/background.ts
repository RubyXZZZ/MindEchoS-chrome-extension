console.log('[MindEchoS] Background script loaded');

// ============= Content Script Management =============

async function ensureContentScript(tabId: number): Promise<void> {
    try {
        await chrome.tabs.sendMessage(tabId, { command: 'PING' });
    } catch {
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js'],
            });
            console.log(`[MindEchoS] Content script injected into tab ${tabId}`);
        } catch (injectError) {
            console.error(`[MindEchoS] Failed to inject content script:`, injectError);
            throw injectError;
        }
    }
}

async function injectContentScriptToExistingTabs(): Promise<void> {
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
        if (tab.id) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js'],
                });
            } catch {
                // Ignore pages that can't be injected
            }
        }
    }
}

// ============= Data Processing (No AI) =============

async function saveSelectionData(text: string, url: string): Promise<void> {
    if (!text || text.length <= 2) {
        return;
    }

    // Always generate AI title (headline), but skip content summary for short text
    const MIN_LENGTH_FOR_CONTENT_SUMMARY = 180;
    const needsContentSummary = text.length >= MIN_LENGTH_FOR_CONTENT_SUMMARY;

    await chrome.storage.session.set({
        pendingSelection: {
            text: text.substring(0, 5000),
            url: url,
            needsAISummarize: true,  // Always use AI for title
            needsContentSummary: needsContentSummary  // Conditional for content
        }
    });

    console.log(`[MindEchoS] Selection: ${text.length} chars, Title: AI, Content: ${needsContentSummary ? 'AI summary' : 'Original'}`);
}

async function handleSelectionCapture(tab: chrome.tabs.Tab, fallbackText?: string): Promise<void> {
    if (!tab.id) return;

    await chrome.sidePanel.open({ tabId: tab.id });

    try {
        await ensureContentScript(tab.id);
        await chrome.tabs.sendMessage(tab.id, { command: 'GET_SELECTION' });
    } catch (error) {
        console.error('[MindEchoS] Failed to capture selection:', error);
        if (fallbackText) {
            await saveSelectionData(fallbackText, tab.url || '');
        }
    }
}

// ============= Initialization =============

chrome.runtime.onInstalled.addListener(async (details) => {
    console.log(`[MindEchoS] Extension ${details.reason}`);

    chrome.contextMenus.create({
        id: "save-selection",
        title: "Save to Knowledge Cards",
        contexts: ["selection"],
    });

    if (details.reason === 'install' || details.reason === 'update') {
        await injectContentScriptToExistingTabs();
        console.log('[MindEchoS] Content scripts injected to existing tabs');
    }
});

// ============= User Actions =============

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "save-selection" && tab) {
        await handleSelectionCapture(tab, info.selectionText);
    }
});

chrome.commands.onCommand.addListener(async (command, tab) => {
    if (command === "extract-knowledge" && tab) {
        await handleSelectionCapture(tab);
    }
});

chrome.action.onClicked.addListener(async (tab) => {
    if (tab?.id) {
        await chrome.sidePanel.open({ tabId: tab.id });
    }
});

// ============= Message Handling =============

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle selection data from content script
    if (message.type === 'SELECTION_DATA') {
        const url = message.data.url || sender.tab?.url || '';
        saveSelectionData(message.data.text, url);
        return false;
    }

    // Handle Selection request from sidepanel
    if (message.command === 'GET_ACTIVE_TAB_SELECTION') {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]?.id) {
                try {
                    await ensureContentScript(tabs[0].id);
                    const response = await chrome.tabs.sendMessage(tabs[0].id, {
                        command: 'GET_SELECTION_FOR_MODAL'
                    });
                    sendResponse(response);
                } catch {
                    sendResponse({
                        success: false,
                        error: 'Unable to get selection'
                    });
                }
            }
        });
        return true; // Keep message channel open for async response
    }

    // Handle Webpage request from sidepanel
    if (message.command === 'EXTRACT_CURRENT_WEBPAGE') {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]?.id) {
                try {
                    await ensureContentScript(tabs[0].id);
                    const response = await chrome.tabs.sendMessage(tabs[0].id, {
                        command: 'EXTRACT_WEBPAGE'
                    });
                    sendResponse(response);
                } catch {
                    sendResponse({
                        success: false,
                        error: 'Unable to extract webpage'
                    });
                }
            }
        });
        return true;
    }

    return false;
});