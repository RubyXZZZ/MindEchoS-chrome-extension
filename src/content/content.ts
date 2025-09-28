// content.ts
// 职责：响应 background 的请求，获取网页上的选中文本

/**
 * 获取当前页面的选中文本
 */
function getSelectionText(): string {
    return window.getSelection()?.toString().trim() || '';
}

/**
 * 监听来自 background script 的消息
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // 响应 PING 检查 content script 是否存活
    if (message.command === 'PING') {
        sendResponse({ alive: true });
        return true;
    }

    // 获取选中文本并发送给 background
    if (message.command === 'GET_SELECTION') {
        const selectionText = getSelectionText();

        // 验证选中文本有效性：必须存在且大于2个字符
        // 小于等于2个字符的选中内容被视为无效（如单个字母、标点等）
        if (selectionText && selectionText.length > 2) {
            chrome.runtime.sendMessage({
                type: 'SELECTION_DATA',
                data: {
                    text: selectionText.substring(0, 5000), // 限制最大长度为5000字符
                    url: window.location.href  // 直接在 content script 中获取当前页面 URL
                }
            });
        }

        // 无论是否有选中文本，都响应确认收到消息
        sendResponse({ received: true });
        return true;
    }
});