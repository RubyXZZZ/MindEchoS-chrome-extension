/**
 * Checks if a content script is active in a tab by sending a PING message.
 * If the script is not active, it injects it.
 * @param tabId The ID of the tab to check.
 */
async function ensureContentScript(tabId: number): Promise<void> {
    try {
        await chrome.tabs.sendMessage(tabId, { command: 'PING' });
    } catch (error) {
        // If sendMessage fails, it means the content script is not there. Inject it.
        console.log(`Content script not found in tab ${tabId}. Injecting.`);
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js'],
            });
        } catch (injectError) {
            console.error(`Failed to inject content script in tab ${tabId}:`, injectError);
            throw injectError; // Propagate error to the caller.
        }
    }
}

// --- Extension Lifecycle and Setup ---

chrome.runtime.onInstalled.addListener(async (details) => {
    // Create the context menu for text selection.
    chrome.contextMenus.create({
        id: "save-selection",
        title: "Save selection to Knowledge Cards",
        contexts: ["selection"],
    });

    // When the extension is installed or updated, inject the content script
    // into all existing tabs with supported URLs.
    if (details.reason === 'install' || details.reason === 'update') {
        const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
        for (const tab of tabs) {
            if (tab.id) {
                try {
                    // Inject script directly, ignoring errors for restricted pages.
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js'],
                    });
                } catch (err) {
                    // This is expected on pages like the Chrome Web Store.
                }
            }
        }
    }
});

// --- User Action Listeners ---

// Handles clicks on the context menu item.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "save-selection" && tab?.id) {
        // 1. Open the side panel IMMEDIATELY in response to the user gesture.
        await chrome.sidePanel.open({ tabId: tab.id });

        // 2. THEN, request the selection data.
        try {
            await ensureContentScript(tab.id);
            await chrome.tabs.sendMessage(tab.id, { command: 'GET_SELECTION' });
        } catch (error) {
            console.error('Could not get selection via content script. Falling back to info.selectionText.', error);
            // Fallback if content script communication fails
            if (info.selectionText) {
                await chrome.storage.session.set({
                    pendingSelection: {
                        text: info.selectionText.substring(0, 5000),
                        url: tab.url || ''
                    }
                });
            }
        }
    }
});

// Handles the keyboard shortcut command.
chrome.commands.onCommand.addListener(async (command, tab) => {
    // CRITICAL FIX: The 'tab' object IS provided by the event listener. Use it directly.
    if (command === "extract-knowledge" && tab?.id) {
        // 1. Open the side panel IMMEDIATELY in response to the user gesture.
        await chrome.sidePanel.open({ tabId: tab.id });

        // 2. THEN, request the selection data.
        try {
            await ensureContentScript(tab.id);
            await chrome.tabs.sendMessage(tab.id, { command: 'GET_SELECTION' });
        } catch (error) {
            console.error('Failed to handle keyboard shortcut command:', error);
        }
    }
});

// Handles clicks on the extension's action icon in the toolbar.
chrome.action.onClicked.addListener(async (tab) => {
    if (tab?.id) {
        await chrome.sidePanel.open({ tabId: tab.id });
    }
});

// --- Message Handling ---

// Listens for messages from content scripts (e.g., the captured selection).
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'SELECTION_TO_SAVE') {
        // This listener's ONLY job is to save the data. The panel is already open.
        chrome.storage.session.set({
            pendingSelection: {
                text: message.text,
                url: sender.tab?.url || ''
            }
        });
    }
    // Return true to indicate you wish to send a response asynchronously.
    return true;
});