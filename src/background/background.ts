/**
 * This function is injected into the page to get the current text selection.
 * It then sends the selection back to the service worker.
 */
function getSelectionAndSend() {
    const selection = window.getSelection()?.toString().trim() || '';
    if (selection && selection.length > 2) {
        // Use a more specific message type to avoid conflicts.
        chrome.runtime.sendMessage({
            type: 'SELECTION_TO_SAVE',
            text: selection.substring(0, 5000),
        });
    }
}

/**
 * Injects the script to get the selection from the page.
 */
async function requestSelectionFromTab(tab: chrome.tabs.Tab) {
    if (!tab.id || !tab.url) return;

    // Prevent errors from trying to inject into restricted pages.
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('https://chrome.google.com/webstore')) {
        return;
    }

    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getSelectionAndSend,
        });
    } catch (e) {
        console.error('Failed to inject script to get selection:', e);
    }
}

// Create the context menu item upon installation.
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'save-selection',
        title: 'Save selection to Knowledge Cards',
        contexts: ['selection'],
    });
});

// --- Main User Action Listeners ---

// Listener for the context menu.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'save-selection' && tab?.id) {
        // 1. Open the side panel immediately in response to the user gesture.
        await chrome.sidePanel.open({ tabId: tab.id });
        // 2. Request the selection from the page.
        await requestSelectionFromTab(tab);
    }
});

// Listener for the keyboard shortcut.
chrome.commands.onCommand.addListener(async (command, tab) => {
    if (command === 'extract-knowledge' && tab?.id) {
        // 1. Open the side panel immediately in response to the user gesture.
        await chrome.sidePanel.open({ tabId: tab.id });
        // 2. Request the selection from the page.
        await requestSelectionFromTab(tab);
    }
});

// --- Data Handling ---

// Listener for the SELECTION_TO_SAVE message from the injected script.
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'SELECTION_TO_SAVE') {
        // 3. Store the received text in session storage.
        // The side panel will be listening for this change.
        await chrome.storage.session.set({ pendingSelection: message.text });
    }
});

// --- Default Action ---

// Handle the extension icon click to open the side panel.
chrome.action.onClicked.addListener(async (tab) => {
    if (tab?.id) {
        await chrome.sidePanel.open({ tabId: tab.id });
    }
});
