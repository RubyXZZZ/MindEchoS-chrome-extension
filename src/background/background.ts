// background.ts
// 简化版：不处理 AI，只负责数据传递

console.log('Background script loaded');

// ============= Content Script 管理 =============

async function ensureContentScript(tabId: number): Promise<void> {
    try {
        await chrome.tabs.sendMessage(tabId, { command: 'PING' });
        console.log(`Content script already active in tab ${tabId}`);
    } catch (_error) {
        console.log(`Injecting content script into tab ${tabId}`);
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js'],
            });
        } catch (injectError) {
            console.error(`Failed to inject content script in tab ${tabId}:`, injectError);
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
            } catch (_err) {
                // 忽略无法注入的页面
            }
        }
    }
}

// ============= 数据处理（不进行 AI 处理）=============

async function saveSelectionData(text: string, url: string): Promise<void> {
    if (!text || text.length <= 2) {
        console.log('Invalid selection: text too short');
        return;
    }

    // 保存原始数据，标记需要 AI 处理
    await chrome.storage.session.set({
        pendingSelection: {
            text: text.substring(0, 5000),
            url: url,
            needsAISummarize: true  // 标记需要 AI 处理
        }
    });
    console.log('Selection data saved, waiting for sidepanel AI processing');
}

async function handleSelectionCapture(tab: chrome.tabs.Tab, fallbackText?: string): Promise<void> {
    if (!tab.id) return;

    await chrome.sidePanel.open({ tabId: tab.id });

    try {
        await ensureContentScript(tab.id);
        await chrome.tabs.sendMessage(tab.id, { command: 'GET_SELECTION' });
    } catch (error) {
        console.error('Failed to get selection from content script:', error);
        if (fallbackText) {
            await saveSelectionData(fallbackText, tab.url || '');
        }
    }
}

// ============= 初始化 =============

chrome.runtime.onInstalled.addListener(async (details) => {
    chrome.contextMenus.create({
        id: "save-selection",
        title: "保存到知识卡片",
        contexts: ["selection"],
    });

    if (details.reason === 'install' || details.reason === 'update') {
        await injectContentScriptToExistingTabs();
    }
});

// ============= 用户操作 =============

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

// ============= 消息处理 =============

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 处理来自 content script 的选中数据
    if (message.type === 'SELECTION_DATA') {
        const url = message.data.url || sender.tab?.url || '';
        saveSelectionData(message.data.text, url);
        return false;
    }

    // 处理来自 sidepanel 的 Selection 请求
    if (message.command === 'GET_ACTIVE_TAB_SELECTION') {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]?.id) {
                try {
                    await ensureContentScript(tabs[0].id);
                    const response = await chrome.tabs.sendMessage(tabs[0].id, {
                        command: 'GET_SELECTION_FOR_MODAL'
                    });
                    sendResponse(response);
                } catch (error) {
                    sendResponse({
                        success: false,
                        error: '无法获取选中内容'
                    });
                }
            }
        });
        return true;
    }

    // 处理来自 sidepanel 的 Webpage 请求
    if (message.command === 'EXTRACT_CURRENT_WEBPAGE') {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]?.id) {
                try {
                    await ensureContentScript(tabs[0].id);
                    const response = await chrome.tabs.sendMessage(tabs[0].id, {
                        command: 'EXTRACT_WEBPAGE'
                    });
                    sendResponse(response);
                } catch (error) {
                    sendResponse({
                        success: false,
                        error: '无法提取网页内容'
                    });
                }
            }
        });
        return true;
    }

    return false;
});