// This file handles background tasks for the bookmark manager extension.

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['bm_bookmarks_v1','bm_folders_v1'], (data) => {
        const initial = {};
        if (!Array.isArray(data['bm_bookmarks_v1'])) initial['bm_bookmarks_v1'] = [];
        if (!Array.isArray(data['bm_folders_v1'])) initial['bm_folders_v1'] = ['Uncategorized'];
        if (Object.keys(initial).length) chrome.storage.local.set(initial);
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // keep existing messaging if you need it — this file can remain a simple helper
    if (request.action === 'getBookmarks') {
        chrome.storage.local.get('bm_bookmarks_v1', (data) => sendResponse(data['bm_bookmarks_v1'] || []));
        return true;
    }
    if (request.action === 'saveBookmark') {
        chrome.storage.local.get('bm_bookmarks_v1', (data) => {
            const bookmarks = Array.isArray(data['bm_bookmarks_v1']) ? data['bm_bookmarks_v1'] : [];
            bookmarks.unshift(request.bookmark);
            chrome.storage.local.set({ 'bm_bookmarks_v1': bookmarks }, () => sendResponse({ success: true }));
        });
        return true;
    }
    if (request.action === 'deleteBookmark') {
        chrome.storage.local.get('bm_bookmarks_v1', (data) => {
            const bookmarks = Array.isArray(data['bm_bookmarks_v1']) ? data['bm_bookmarks_v1'] : [];
            const updated = bookmarks.filter(b => b.id !== request.id);
            chrome.storage.local.set({ 'bm_bookmarks_v1': updated }, () => sendResponse({ success: true }));
        });
        return true;
    }
    if (request.action === 'getFolders') {
        chrome.storage.local.get('bm_folders_v1', (data) => sendResponse(data['bm_folders_v1'] || []));
        return true;
    }
    if (request.action === 'saveFolders') {
        chrome.storage.local.set({ 'bm_folders_v1': request.folders }, () => sendResponse({ success: true }));
        return true;
    }
});