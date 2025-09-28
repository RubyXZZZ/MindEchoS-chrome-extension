function getSelectionText(): string {
    return window.getSelection()?.toString().trim() || '';
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.command === 'PING') {
        // Respond to the ping to confirm the content script is alive
        sendResponse(true);
        return true;
    }

    if (msg.command === 'GET_SELECTION') {
        const selection = getSelectionText();
        if (selection && selection.length > 2) {
            chrome.runtime.sendMessage({
                type: 'SELECTION_TO_SAVE',
                text: selection.substring(0, 5000), // Limit length
            });
        }
        // Even if there's no selection, respond to acknowledge the message
        sendResponse(true);
        return true;
    }
});
