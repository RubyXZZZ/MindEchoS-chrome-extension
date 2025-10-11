// content.ts
// 职责：响应 background 的请求，获取网页上的选中文本或完整网页内容

import { Readability } from '@mozilla/readability';

/**
 * 获取当前页面的选中文本
 */
function getSelectionText(): string {
    return window.getSelection()?.toString().trim() || '';
}

/**
 * 使用 Readability 提取网页内容
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
                title: article.title || document.title || '',  // 添加降级处理
                content: article.textContent.substring(0, 8000), // 限制最大长度
                url: window.location.href
            };
        }
    } catch (error) {
        console.warn("Readability extraction failed:", error);
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
        if (selectionText && selectionText.length > 2) {
            chrome.runtime.sendMessage({
                type: 'SELECTION_DATA',
                data: {
                    text: selectionText.substring(0, 5000), // 限制最大长度
                    url: window.location.href,
                    needsSummarize: true  // 标记需要 AI 总结
                }
            });
        }

        // 无论是否有选中文本，都响应确认收到消息
        sendResponse({ received: true });
        return true;
    }

    // 获取当前页面选中内容（用于 AddCardModal 的 Selection 按钮）
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
                error: '请先在网页上选中待提炼的内容'
            });
        }
        return true;
    }

    // 提取整个网页内容（用于 AddCardModal 的 Webpage 按钮）
    if (message.command === 'EXTRACT_WEBPAGE') {
        const pageData = extractPageContent();
        sendResponse({
            success: true,
            data: pageData
        });
        return true;
    }
});