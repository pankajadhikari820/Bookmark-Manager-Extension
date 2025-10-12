(function () {
    // Elements
    const form = document.getElementById('bookmark-form');
    const titleEl = document.getElementById('bookmark-title');
    const urlEl = document.getElementById('bookmark-url');
    const descEl = document.getElementById('bookmark-desc');
    const tagsEl = document.getElementById('bookmark-tags');
    const folderSelect = document.getElementById('bookmark-folder');
    const newFolderEl = document.getElementById('new-folder');
    const addFolderBtn = document.getElementById('add-folder-btn');
    const useCurrentBtn = document.getElementById('use-current-btn');
    const listEl = document.getElementById('bookmark-list');
    const searchEl = document.getElementById('search');
    const importFileEl = document.getElementById('import-file');
    const importBtn = document.getElementById('import-btn');
    const exportBtn = document.getElementById('export-btn');
    const selectAllEl = document.getElementById('select-all');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const folderListEl = document.getElementById('folder-list');
    const openWindowBtn = document.getElementById('open-window-btn');

    openWindowBtn && openWindowBtn.addEventListener('click', () => {
        const optionsUrl = chrome.runtime && chrome.runtime.getURL ? chrome.runtime.getURL('options.html') : 'options.html';

        function copyToClipboard(text) {
            if (!text) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).catch(() => {});
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); } catch (e) {}
                ta.remove();
            }
        }

        // Get the active tab in the last focused window; fallback to any http(s) tab
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            let url = (tabs && tabs[0] && tabs[0].url) ? tabs[0].url : '';
            const isExt = url && chrome.runtime && url.startsWith(chrome.runtime.getURL(''));
            const isInternal = url && (url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('edge://'));

            if (!url || isExt || isInternal) {
                chrome.tabs.query({ lastFocusedWindow: true }, (all) => {
                    const good = (all || []).find(t => t.url && /^https?:\/\//.test(t.url));
                    if (good) url = good.url;
                    if (url) copyToClipboard(url);
                    openFullView(optionsUrl);
                });
            } else {
                copyToClipboard(url);
                openFullView(optionsUrl);
            }
        });

        function openFullView(url) {
            if (chrome && chrome.windows && chrome.windows.create) {
                chrome.windows.create({ url, type: 'popup', state: 'fullscreen' }, (w) => {
                    if (chrome.runtime.lastError || !w) {
                        chrome.windows.create({ url, type: 'popup', state: 'maximized' });
                    }
                });
            } else {
                window.open(url, '_blank', `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${screen.width},height=${screen.height}`);
            }
        }
    });

    // Storage keys
    const KEYS = {
        BOOKMARKS: 'bm_bookmarks_v1',
        FOLDERS: 'bm_folders_v1',
        VIEW: 'bm_view_v1'
    };

    // In-memory store (fallback to localStorage)
    let store = {
        bookmarks: [],
        folders: ['Uncategorized'],
        view: 'list'
    };

    // storage helpers (chrome.storage.local or fallback)
    function safeSet(obj) {
        try {
            if (chrome && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set(obj);
            } else {
                const raw = JSON.stringify(obj);
                localStorage.setItem('bm_fallback', raw);
            }
        } catch (e) {
            localStorage.setItem('bm_fallback', JSON.stringify(obj));
        }
    }

    function safeGet(keys, cb) {
        try {
            if (chrome && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(keys, cb);
            } else {
                const raw = localStorage.getItem('bm_fallback');
                const parsed = raw ? JSON.parse(raw) : {};
                const res = {};
                keys.forEach(k => res[k] = parsed[k]);
                cb(res);
            }
        } catch (e) {
            const raw = localStorage.getItem('bm_fallback');
            const parsed = raw ? JSON.parse(raw) : {};
            const res = {};
            keys.forEach(k => res[k] = parsed[k]);
            cb(res);
        }
    }

    function persist() {
        const obj = {};
        obj[KEYS.BOOKMARKS] = store.bookmarks;
        obj[KEYS.FOLDERS] = store.folders;
        obj[KEYS.VIEW] = store.view;
        safeSet(obj);
    }

    function loadInitial() {
        safeGet([KEYS.BOOKMARKS, KEYS.FOLDERS, KEYS.VIEW], data => {
            try {
                if (Array.isArray(data[KEYS.BOOKMARKS])) store.bookmarks = data[KEYS.BOOKMARKS];
                if (Array.isArray(data[KEYS.FOLDERS])) store.folders = data[KEYS.FOLDERS];
                if (typeof data[KEYS.VIEW] === 'string') store.view = data[KEYS.VIEW];
            } catch (e) { /* ignore */ }
            if (!store.folders.includes('Uncategorized')) store.folders.unshift('Uncategorized');
            applyView(store.view);
            populateFolderSelect();
            renderFoldersUI();
            renderBookmarks();
        });
    }

    function escapeHtml(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    // --- Folders UI & management ---
    function populateFolderSelect() {
        if (!folderSelect) return;
        folderSelect.innerHTML = '';
        store.folders.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f; opt.textContent = f;
            folderSelect.appendChild(opt);
        });
    }

    function renderFoldersUI() {
        if (!folderListEl) return;
        folderListEl.innerHTML = '';
        store.folders.forEach(folderName => {
            const pill = document.createElement('div');
            pill.className = 'folder-pill';
            pill.dataset.folder = folderName;
            pill.draggable = false; // folders not draggable themselves
            pill.innerHTML = `
                <span class="folder-name">${escapeHtml(folderName)}</span>
                <div class="actions">
                    <button class="rename-folder-btn" title="Rename">✎</button>
                    <button class="delete-folder-btn" title="Delete">🗑</button>
                </div>
            `;
            // drop target for bookmarks
            pill.addEventListener('dragover', (e) => {
                e.preventDefault();
                pill.classList.add('drag-over');
            });
            pill.addEventListener('dragleave', () => pill.classList.remove('drag-over'));
            pill.addEventListener('drop', (e) => {
                e.preventDefault();
                pill.classList.remove('drag-over');
                const id = e.dataTransfer.getData('text/bookmark-id');
                if (!id) return;
                moveBookmarkToFolder(id, folderName);
            });

            // rename
            pill.querySelector('.rename-folder-btn').addEventListener('click', () => {
                showRenameFolderInput(pill, folderName);
            });

            // delete
            pill.querySelector('.delete-folder-btn').addEventListener('click', () => {
                if (folderName === 'Uncategorized') return alert('Cannot delete Uncategorized');
                if (!confirm(`Delete folder "${folderName}"? Bookmarks will be moved to Uncategorized.`)) return;
                deleteFolder(folderName);
            });

            folderListEl.appendChild(pill);
        });
    }

    function showRenameFolderInput(pillEl, oldName) {
        const nameSpan = pillEl.querySelector('.folder-name');
        const actions = pillEl.querySelector('.actions');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = oldName;
        input.className = 'rename-input';
        nameSpan.replaceWith(input);
        actions.style.display = 'none';
        input.focus();
        input.select();
        function finishRename(save) {
            if (save) {
                const newName = (input.value || '').trim();
                if (!newName) { alert('Folder name required'); input.focus(); return; }
                if (newName === oldName) { cancel(); return; }
                if (store.folders.includes(newName)) { alert('Folder already exists'); input.focus(); return; }
                const idx = store.folders.indexOf(oldName);
                if (idx !== -1) store.folders[idx] = newName;
                // move bookmarks folder field
                store.bookmarks.forEach(b => { if (b.folder === oldName) b.folder = newName; });
                persist();
            }
            cancel();
            populateFolderSelect();
            renderFoldersUI();
            renderBookmarks(searchEl ? searchEl.value : '');
        }
        function cancel() {
            input.replaceWith(nameSpan);
            actions.style.display = '';
            document.removeEventListener('click', onDocClick);
        }
        function onDocClick(ev) {
            if (!pillEl.contains(ev.target)) finishRename(true);
        }
        input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') finishRename(true);
            if (ev.key === 'Escape') { cancel(); }
        });
        setTimeout(() => document.addEventListener('click', onDocClick), 10);
    }

    function deleteFolder(folderName) {
        // remove folder from folders list and move bookmarks to Uncategorized
        store.folders = store.folders.filter(f => f !== folderName);
        store.bookmarks.forEach(b => { if (b.folder === folderName) b.folder = 'Uncategorized'; });
        if (!store.folders.includes('Uncategorized')) store.folders.unshift('Uncategorized');
        persist();
        populateFolderSelect();
        renderFoldersUI();
        renderBookmarks(searchEl ? searchEl.value : '');
    }

    function addFolder(name) {
        const n = (name || '').trim();
        if (!n) return alert('Folder name required');
        if (!store.folders.includes(n)) store.folders.push(n);
        persist(); populateFolderSelect(); renderFoldersUI();
    }

    // --- Bookmarks rendering, DnD and reordering ---
    function renderBookmarks(filter = '') {
        const q = (filter || '').toLowerCase().trim();
        listEl.innerHTML = '';
        if (!Array.isArray(store.bookmarks)) store.bookmarks = [];
        store.bookmarks.forEach((b, i) => {
            const combined = [b.title, b.url, (b.tags||[]).join(' '), b.folder, b.description].join(' ').toLowerCase();
            if (q && !combined.includes(q)) return;
            const li = document.createElement('li');
            li.className = 'bookmark-item';
            li.dataset.id = b.id;
            li.draggable = true;

            // show explicit Folder: and Tags: labels
            const folderLabel = `<span class="meta-label" aria-hidden="true">Folder:</span> <span class="meta-value folder-name">${escapeHtml(b.folder || 'Uncategorized')}</span>`;
            const tagsLabel = (b.tags && b.tags.length) ? `<span class="meta-label" aria-hidden="true">Tags:</span> <span class="meta-value tags">${escapeHtml((b.tags||[]).join(', '))}</span>` : '';

            li.innerHTML = `
                <div class="left">
                    <div class="select-wrap"><input type="checkbox" class="sel-chk" data-id="${b.id}"></div>
                    <div class="meta-wrap">
                        <strong class="b-title"><a href="${escapeHtml(b.url)}" target="_blank" rel="noopener">${escapeHtml(b.title)}</a></strong>
                        <div class="meta url"><a href="${escapeHtml(b.url)}" target="_blank" rel="noopener">${escapeHtml(b.url)}</a></div>
                        <div class="desc">${escapeHtml(b.description||'')}</div>
                        <div class="meta small">${folderLabel} ${tagsLabel}</div>
                    </div>
                </div>
                <div class="right">
                    <div style="display:flex; gap:6px;">
                        <button class="edit-btn" data-id="${b.id}">Edit</button>
                        <button class="delete-btn" data-id="${b.id}">Delete</button>
                    </div>
                </div>
            `;

            // drag handlers for reordering and move
            li.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/bookmark-id', String(b.id));
                e.dataTransfer.effectAllowed = 'move';
                li.classList.add('dragging');
            });
            li.addEventListener('dragend', () => li.classList.remove('dragging'));

            li.addEventListener('dragover', (e) => {
                e.preventDefault();
                li.classList.add('drop-target');
            });
            li.addEventListener('dragleave', () => li.classList.remove('drop-target'));

            li.addEventListener('drop', (e) => {
                e.preventDefault();
                li.classList.remove('drop-target');
                const draggedId = e.dataTransfer.getData('text/bookmark-id');
                if (!draggedId) return;
                moveBookmarkToIndex(draggedId, i);
            });

            listEl.appendChild(li);
        });

        // attach handlers after building list
        listEl.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (!confirm('Delete bookmark?')) return;
                store.bookmarks = store.bookmarks.filter(x => String(x.id) !== String(id));
                persist(); renderBookmarks(searchEl ? searchEl.value : '');
            });
        });
        listEl.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const b = store.bookmarks.find(x => String(x.id) === String(id));
                if (!b) return;
                titleEl.value = b.title || '';
                urlEl.value = b.url || '';
                descEl.value = b.description || '';
                tagsEl.value = (b.tags||[]).join(', ');
                populateFolderSelect();
                folderSelect.value = b.folder || 'Uncategorized';
                submitBtn.dataset.editing = id;
                submitBtn.textContent = 'Save Changes';
                if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';
            });
        });
    }

    function moveBookmarkToFolder(id, folderName) {
        const idx = store.bookmarks.findIndex(b => String(b.id) === String(id));
        if (idx === -1) return;
        store.bookmarks[idx].folder = folderName;
        persist(); renderBookmarks(searchEl ? searchEl.value : '');
    }

    function moveBookmarkToIndex(id, targetIndex) {
        const idx = store.bookmarks.findIndex(b => String(b.id) === String(id));
        if (idx === -1) return;
        const [item] = store.bookmarks.splice(idx, 1);
        // if removal was before target index, targetIndex-- because array shortened
        let insertAt = targetIndex;
        if (idx < targetIndex) insertAt = targetIndex - 1;
        store.bookmarks.splice(insertAt, 0, item);
        persist(); renderBookmarks(searchEl ? searchEl.value : '');
    }

    // --- interactions ---
    addFolderBtn && addFolderBtn.addEventListener('click', () => addFolder(newFolderEl.value));
    useCurrentBtn && useCurrentBtn.addEventListener('click', () => {
        if (!chrome || !chrome.tabs) { alert('Tabs API not available'); return; }
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (!tabs || !tabs[0]) return alert('No active tab');
            titleEl.value = tabs[0].title || '';
            urlEl.value = tabs[0].url || '';
        });
    });

    // Submit (add/edit)
    form && form.addEventListener('submit', e => {
        e.preventDefault();
        const title = (titleEl.value || '').trim();
        const url = (urlEl.value || '').trim();
        if (!title || !url) return alert('Title and URL required');
        const description = (descEl.value || '').trim();
        const tags = (tagsEl.value || '').split(',').map(s => s.trim()).filter(Boolean);
        const folder = folderSelect.value || 'Uncategorized';
        const editing = submitBtn && submitBtn.dataset.editing ? String(submitBtn.dataset.editing) : null;

        if (editing) {
            const idx = store.bookmarks.findIndex(b => String(b.id) === editing);
            if (idx !== -1) {
                store.bookmarks[idx].title = title;
                store.bookmarks[idx].url = url;
                store.bookmarks[idx].description = description;
                store.bookmarks[idx].tags = tags;
                store.bookmarks[idx].folder = folder;
                store.bookmarks[idx].updatedAt = new Date().toISOString();
            }
            delete submitBtn.dataset.editing;
            submitBtn.textContent = 'Add Bookmark';
            if (cancelEditBtn) cancelEditBtn.style.display = 'none';
        } else {
            const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
            store.bookmarks.unshift({
                id, title, url, description, tags, folder, createdAt: new Date().toISOString()
            });
        }
        form.reset();
        persist();
        populateFolderSelect();
        renderFoldersUI();
        renderBookmarks(searchEl ? searchEl.value : '');
    });

    cancelEditBtn && cancelEditBtn.addEventListener('click', () => {
        delete submitBtn.dataset.editing;
        submitBtn.textContent = 'Add Bookmark';
        cancelEditBtn.style.display = 'none';
        form.reset();
    });

    // Search
    searchEl && searchEl.addEventListener('input', () => renderBookmarks(searchEl.value));

    // Export / Import (unchanged behavior)
    exportBtn && exportBtn.addEventListener('click', () => {
        const header = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n';
        let body = '';
        store.bookmarks.forEach(b => {
            body += `<DT><A HREF="${escapeHtml(b.url)}">${escapeHtml(b.title)}</A>\n`;
        });
        const footer = '</DL><p>\n';
        const blob = new Blob([header + body + footer], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'bookmarks-export.html';
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });

    importBtn && importBtn.addEventListener('click', () => importFileEl && importFileEl.click());
    importFileEl && importFileEl.addEventListener('change', e => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const doc = new DOMParser().parseFromString(ev.target.result, 'text/html');
                const anchors = Array.from(doc.querySelectorAll('a'));
                if (!anchors.length) return alert('No bookmarks found in file.');
                anchors.forEach(a => {
                    const href = a.getAttribute('href') || a.href || '';
                    const title = (a.textContent || href).trim();
                    const id = Date.now().toString() + Math.floor(Math.random()*1000).toString();
                    store.bookmarks.unshift({ id, title, url: href, description: '', tags: [], folder: 'Imported', createdAt: new Date().toISOString() });
                });
                if (!store.folders.includes('Imported')) store.folders.push('Imported');
                persist(); populateFolderSelect(); renderFoldersUI(); renderBookmarks(searchEl ? searchEl.value : '');
            } catch (err) { alert('Import failed'); }
        };
        reader.readAsText(f); importFileEl.value = '';
    });

    // Select all / delete selected
    selectAllEl && selectAllEl.addEventListener('change', () => {
        const checks = listEl.querySelectorAll('.sel-chk');
        checks.forEach(c => c.checked = selectAllEl.checked);
    });
    deleteSelectedBtn && deleteSelectedBtn.addEventListener('click', () => {
        const checks = Array.from(listEl.querySelectorAll('.sel-chk')).filter(c => c.checked);
        if (!checks.length) return alert('No bookmarks selected');
        if (!confirm(`Delete ${checks.length} selected bookmarks?`)) return;
        const ids = checks.map(c => c.dataset.id);
        store.bookmarks = store.bookmarks.filter(b => !ids.includes(String(b.id)));
        persist(); renderBookmarks(searchEl ? searchEl.value : '');
    });

    // View toggle
    listViewBtn && listViewBtn.addEventListener('click', () => applyView('list'));
    gridViewBtn && gridViewBtn.addEventListener('click', () => applyView('grid'));

    function applyView(v) {
        v = v === 'grid' ? 'grid' : 'list';
        if (v === 'grid') {
            listEl.classList.add('grid-view'); listEl.classList.remove('list-view');
            listViewBtn && listViewBtn.setAttribute('aria-pressed', 'false');
            gridViewBtn && gridViewBtn.setAttribute('aria-pressed', 'true');
        } else {
            listEl.classList.add('list-view'); listEl.classList.remove('grid-view');
            listViewBtn && listViewBtn.setAttribute('aria-pressed', 'true');
            gridViewBtn && gridViewBtn.setAttribute('aria-pressed', 'false');
        }
        store.view = v; persist();
    }

    // Initial load
    loadInitial();
})();