// background.ts
// 职责：处理用户操作（右键菜单、快捷键），管理 content script 注入，存储数据

// ============= Content Script 管理 =============

/**
 * 确保 content script 已注入到指定标签页
 * @param tabId 标签页 ID
 */
async function ensureContentScript(tabId: number): Promise<void> {
    try {
        // 尝试 ping content script
        await chrome.tabs.sendMessage(tabId, { command: 'PING' });
        console.log(`Content script already active in tab ${tabId}`);
    } catch (_error) {
        // Content script 不存在，需要注入
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

/**
 * 在扩展安装/更新时注入 content script 到现有标签页
 */
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
                // 忽略无法注入的页面（如 Chrome Web Store）
            }
        }
    }
}

// ============= 数据处理 =============

/**
 * 保存选中内容到 session storage
 * @param text 选中的文本
 * @param url 来源网页 URL
 */
async function saveSelectionData(text: string, url: string): Promise<void> {
    // 验证文本有效性（虽然 content script 已验证，但 fallback 文本也需要验证）
    if (!text || text.length <= 2) {
        console.log('Invalid selection: text too short (<=2 characters)');
        return;
    }

    const selectionData = {
        text: text.substring(0, 5000), // 统一限制最大长度
        url: url || ''
    };

    await chrome.storage.session.set({
        pendingSelection: selectionData
    });
}

/**
 * 处理选中内容的捕获（统一处理右键菜单和快捷键）
 * @param tab 当前标签页
 * @param fallbackText 备用文本（来自右键菜单的 selectionText）
 */
async function handleSelectionCapture(tab: chrome.tabs.Tab, fallbackText?: string): Promise<void> {
    if (!tab.id) return;

    // 1. 立即打开侧边栏（响应用户操作）
    await chrome.sidePanel.open({ tabId: tab.id });

    // 2. 尝试从 content script 获取选中文本
    try {
        await ensureContentScript(tab.id);
        await chrome.tabs.sendMessage(tab.id, { command: 'GET_SELECTION' });
    } catch (error) {
        console.error('Failed to get selection from content script:', error);

        // 3. 如果失败且有备用文本，使用备用文本
        if (fallbackText) {
            await saveSelectionData(fallbackText, tab.url || '');
        }
    }
}

// ============= 扩展初始化 =============

chrome.runtime.onInstalled.addListener(async (details) => {
    // 创建右键菜单
    chrome.contextMenus.create({
        id: "save-selection",
        title: "保存到知识卡片",
        contexts: ["selection"],
    });

    // 安装或更新时，注入 content script 到现有标签页
    if (details.reason === 'install' || details.reason === 'update') {
        await injectContentScriptToExistingTabs();
    }
});

// ============= 用户操作处理 =============

// 右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "save-selection" && tab) {
        // 统一处理，提供 fallback 文本
        await handleSelectionCapture(tab, info.selectionText);
    }
});

// 快捷键命令
chrome.commands.onCommand.addListener(async (command, tab) => {
    if (command === "extract-knowledge" && tab) {
        // 统一处理，无 fallback 文本
        await handleSelectionCapture(tab);
    }
});

// 扩展图标点击
chrome.action.onClicked.addListener(async (tab) => {
    if (tab?.id) {
        await chrome.sidePanel.open({ tabId: tab.id });
    }
});

// ============= 消息处理 =============

// 接收来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'SELECTION_DATA') {
        // URL 已经在消息中，直接使用（更高效）
        // 如果没有提供 URL，才从 sender.tab 获取作为备用
        const url = message.data.url || sender.tab?.url || '';
        saveSelectionData(message.data.text, url);
    }
    return true;
});