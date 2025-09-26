// Helper function to save card directly
// Helper function to save card directly
async function saveCard(card: any) {
    const storage = await chrome.storage.local.get('knowledge_cards');
    const cards = storage.knowledge_cards || [];
    cards.unshift({
        id: Date.now().toString(),
        ...card,
        timestamp: Date.now()
    });
    await chrome.storage.local.set({ knowledge_cards: cards });
}

// Context menus
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'save-selection',
        title: '保存到知识卡片',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'summarize-page',
        title: '总结页面到卡片',
        contexts: ['page']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) return;

    if (info.menuItemId === 'save-selection' && info.selectionText) {
        await saveCard({
            title: `Selection from ${tab.title}`,
            content: info.selectionText,
            summary: info.selectionText.substring(0, 100),
            url: tab.url,
            tags: [],
            category: 'Technology'
        });

    } else if (info.menuItemId === 'summarize-page') {
        const response = await chrome.tabs.sendMessage(tab.id, {
            type: 'EXTRACT_CONTENT'
        });

        if (response.success) {
            await saveCard({
                title: response.title,
                content: response.content,
                summary: response.content.substring(0, 100),
                url: response.url,
                tags: [],
                category: 'Technology'
            });
        }
    }
});

// Forward messages from content script to popup/sidepanel
// Use underscore prefix to indicate sender is intentionally unused
chrome.runtime.onMessage.addListener((message, _sender) => {
    if (message.type === 'CAPTURE_SELECTION') {
        // Forward to popup/sidepanel
        chrome.runtime.sendMessage(message);
    }
});

// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'keepAlive') {
        port.onDisconnect.addListener(() => {
            // Port disconnected, service worker will stay alive
        });
    }
});

// Handle extension icon click to open sidepanel
chrome.action.onClicked.addListener(async (tab) => {
    if (tab?.id) {
        await chrome.sidePanel.open({ tabId: tab.id });
    }
});