// Flipkart Tab — popup UI logic
// Depends on window.listifyShared set by popup.js

(function initFlipkartTab() {

    // ── DOM refs ──
    const fkCategoryBadge    = document.getElementById('fkCategoryBadge');
    const fkCategoryName     = document.getElementById('fkCategoryName');
    const fkNoCategoryMsg    = document.getElementById('fkNoCategoryMsg');
    const fkSaveBtn          = document.getElementById('fkSaveTemplateBtn');
    const fkSaveHint         = document.getElementById('fkSaveHint');
    const fkListSection      = document.getElementById('fkListSection');
    const fkTemplateListEl   = document.getElementById('fkTemplateList');
    const fkRecentContainer  = document.getElementById('fkRecentContainer');
    const fkRecentListEl     = document.getElementById('fkRecentList');
    const fkMostUsedContainer= document.getElementById('fkMostUsedContainer');
    const fkMostUsedListEl   = document.getElementById('fkMostUsedList');
    const fkAllContainer     = document.getElementById('fkAllContainer');
    const fkAllTitle         = document.getElementById('fkAllTitle');
    const fkStatusEl         = document.getElementById('fkStatus');
    const fkNotOnFkMsg       = document.getElementById('fkNotOnFlipkartMsg');
    const fkBufferBar        = document.getElementById('fkBufferBar');
    const fkBufferCount      = document.getElementById('fkBufferCount');
    const fkClearBufferBtn   = document.getElementById('fkClearBufferBtn');

    let fkCategory  = '';
    let fkVertical  = '';
    let fkBrand     = '';
    let fkActiveTab = null;
    let _savedInfo  = null; // { fieldCount, sectionCount } — set after successful save

    // ── Helpers ──
    function fkSetStatus(msg, color) {
        fkStatusEl.textContent = msg;
        fkStatusEl.style.color = color || 'var(--muted)';
    }

    // Inject a toast notification into the Flipkart page
    function showFkToast(tabId, message, type = 'success') {
        if (!chrome.runtime?.id) return; // extension context invalidated (e.g. after reload)
        try {
            chrome.scripting.executeScript({
            target: { tabId, frameIds: [0] },
            func: (msg, toastType) => {
                const existing = document.getElementById('__listify_toast__');
                if (existing) existing.remove();

                const colors = {
                    success: { bg: '#1a9e5a', icon: '✓' },
                    info:    { bg: '#2563eb', icon: 'ℹ' },
                    error:   { bg: '#dc2626', icon: '✕' },
                };
                const { bg, icon } = colors[toastType] || colors.success;

                const toast = document.createElement('div');
                toast.id = '__listify_toast__';
                toast.innerHTML = `<span style="font-size:15px;font-weight:700;">${icon}</span><span>${msg}</span>`;
                Object.assign(toast.style, {
                    position: 'fixed',
                    bottom: '28px',
                    right: '28px',
                    zIndex: '2147483647',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: bg,
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
                    boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                    opacity: '0',
                    transform: 'translateY(12px)',
                    transition: 'opacity 0.25s ease, transform 0.25s ease',
                    pointerEvents: 'none',
                });
                document.body.appendChild(toast);

                requestAnimationFrame(() => {
                    toast.style.opacity = '1';
                    toast.style.transform = 'translateY(0)';
                });

                setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(12px)';
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            },
            args: [message, type],
        }).catch(() => {});
        } catch (_) { /* extension context died mid-call */ }
    }

    function getToken()  { return window.listifyShared?.getAuthToken?.() || ''; }
    // FK_API_URL is a global const from config.js → /api/flipkart/templates
    function getApiUrl() { return (typeof FK_API_URL !== 'undefined' ? FK_API_URL : '') || ''; }
    function authHdrs()  {
        return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
    }

    // Module-level cache of the most-recently-loaded Flipkart templates, used
    // to look up siblings when enforcing per-category auto-fill uniqueness.
    let _fkTemplates = [];

    function _catKey(c) {
        return (c || '').toLowerCase().trim();
    }

    async function _putAutoFill(id, val) {
        try {
            const r = await fetch(`${getApiUrl()}/${id}`, {
                method: 'PUT',
                headers: authHdrs(),
                body: JSON.stringify({ autoFill: val }),
            });
            if (!r.ok) {
                console.warn('[FK TAB] autoFill PUT failed', id, val, r.status);
            }
            return r.ok;
        } catch (e) {
            console.warn('[FK TAB] autoFill PUT error', id, val, e);
            return false;
        }
    }

    // Ensure every category with ≥1 template has exactly one autoFill=true.
    // If none is ON, activate the most recent. If multiple are ON, keep the
    // most recent and turn the rest OFF. Runs after each template list load.
    async function enforceFkCategoryAuto() {
        const byCat = new Map();
        for (const t of _fkTemplates) {
            const k = _catKey(t.category);
            if (!k) continue;
            if (!byCat.has(k)) byCat.set(k, []);
            byCat.get(k).push(t);
        }

        const updates = [];
        for (const list of byCat.values()) {
            const sorted = [...list].sort((a, b) =>
                new Date(b.lastUsedAt || b.createdAt || 0) - new Date(a.lastUsedAt || a.createdAt || 0)
            );
            const onTemplates = sorted.filter(t => t.autoFill);

            // Auto must ONLY be on when the user explicitly clicks it.
            // Do not auto-promote a default. Do not silently demote duplicates.
            // If multiple are ON (e.g. failed cascade), leave them visible so
            // the user can resolve it; if none is on, leave none on.
            void onTemplates;
        }
        if (updates.length) await Promise.all(updates);
    }

    // ── Inject FK scripts (fill + autofill) ──
    async function ensureFkScript(tabId) {
        for (const file of ['platforms/flipkart/fk-fill.js', 'platforms/flipkart/fk-autofill.js']) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId, allFrames: true },
                    files:  [file],
                });
            } catch (_) { /* guard already set */ }
        }
    }

    function isOnFlipkart(url) {
        return !!(url && url.includes('seller.flipkart.com'));
    }


    // ── UI states ──
    function hideSaveSectionIfOpen() {
        const ss = document.getElementById('fkSaveSection');
        if (ss) ss.style.display = 'none';
    }

    function showNotOnFlipkart() {
        fkNotOnFkMsg.style.display    = 'block';
        fkCategoryBadge.style.display = 'none';
        fkNoCategoryMsg.style.display = 'none';
        fkSaveBtn.style.display       = 'none';
        fkSaveHint.style.display      = 'none';
        fkBufferBar.style.display     = 'none';
        hideSaveSectionIfOpen();
    }

    function showNoCategory() {
        fkNotOnFkMsg.style.display    = 'none';
        fkCategoryBadge.style.display = 'none';
        fkNoCategoryMsg.style.display = 'block';
        fkSaveBtn.style.display       = 'block';
        fkSaveHint.style.display      = 'block';
        fkBufferBar.style.display     = 'block';
    }

    function showReady(cat) {
        fkCategoryName.textContent    = cat;
        fkNotOnFkMsg.style.display    = 'none';
        fkCategoryBadge.style.display = 'block';
        fkNoCategoryMsg.style.display = 'none';
        fkSaveBtn.style.display       = 'block';
        fkSaveHint.style.display      = 'block';
        fkBufferBar.style.display     = 'block';
    }

    // ── Buffer UI — push-driven (no polling) ──
    function updateBufferUI(count, sectionCount) {
        fkSaveBtn.disabled      = false;
        fkSaveBtn.style.opacity = '1';

        if (count > 0) {
            // New fields being captured — clear saved state
            _savedInfo = null;
            const sc = sectionCount || 0;
            fkBufferCount.textContent =
                `${count} field${count !== 1 ? 's' : ''} captured` +
                (sc > 0 ? ` across ${sc} section${sc !== 1 ? 's' : ''}` : '');
            fkBufferCount.style.color = 'var(--green)';
        } else if (_savedInfo) {
            // Buffer was cleared after a save — show what was saved
            const { fieldCount, sectionCount: sc } = _savedInfo;
            fkBufferCount.textContent =
                `Saved — ${fieldCount} field${fieldCount !== 1 ? 's' : ''}` +
                (sc > 0 ? ` across ${sc} section${sc !== 1 ? 's' : ''}` : '');
            fkBufferCount.style.color = 'var(--green)';
        } else {
            fkBufferCount.textContent = 'Fill form sections — fields are captured automatically';
            fkBufferCount.style.color = 'var(--muted)';
        }
    }

    // Listen for push from fk-fill.js — fires every time a field is captured
    chrome.runtime?.onMessage.addListener((msg) => {
        if (msg.action === 'fk_buffer_updated') {
            updateBufferUI(msg.count, msg.sectionCount);
        }
    });

    // ── Clear buffer ──
    if (fkClearBufferBtn) {
        fkClearBufferBtn.addEventListener('click', async () => {
            if (!fkActiveTab?.id) return;
            try {
                // background.js owns the storage — send directly with tabId
                await chrome.runtime?.sendMessage({ action: 'fk_clear_buffer', tabId: fkActiveTab.id });
                updateBufferUI(0, 0);
                fkSetStatus('Buffer cleared — fill sections again to recapture.', 'var(--muted)');
            } catch (_) {}
        });
    }

    // ── Load & render Flipkart templates ──
    async function fkLoadTemplates() {
        if (!getToken()) return;
        try {
            const res = await fetch(
                `${getApiUrl()}?url=${encodeURIComponent('seller.flipkart.com')}&limit=50`,
                { headers: authHdrs() }
            );
            if (!res.ok) return;

            const data      = await res.json();
            const templates = Array.isArray(data) ? data : (data.templates || []);

            // Cache for sibling lookups + enforce one-auto-per-category
            _fkTemplates = templates;
            await enforceFkCategoryAuto();

            // Reset all lists
            fkRecentListEl.innerHTML    = '';
            fkMostUsedListEl.innerHTML  = '';
            fkTemplateListEl.innerHTML  = '';
            fkRecentContainer.style.display   = 'none';
            fkMostUsedContainer.style.display = 'none';
            fkAllContainer.style.display      = 'none';
            fkListSection.style.display       = 'none';

            if (templates.length === 0) return;

            const shownIds = new Set();

            // Recent: 1 most recently used/created
            const recent = [...templates]
                .sort((a, b) => new Date(b.lastUsedAt || b.createdAt) - new Date(a.lastUsedAt || a.createdAt))
                .slice(0, 1);
            if (recent.length > 0) {
                recent.forEach(t => { renderTemplateRow(t, fkRecentListEl); shownIds.add(t._id); });
                fkRecentContainer.style.display = 'block';
            }

            // Most Used: top 3 by usageCount (excluding recent)
            const mostUsed = [...templates]
                .filter(t => (t.usageCount || 0) > 0 && !shownIds.has(t._id))
                .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
                .slice(0, 3);
            if (mostUsed.length > 0) {
                mostUsed.forEach(t => { renderTemplateRow(t, fkMostUsedListEl); shownIds.add(t._id); });
                fkMostUsedContainer.style.display = 'block';
            }

            // All others
            const rest = templates.filter(t => !shownIds.has(t._id));
            if (rest.length > 0) {
                fkAllTitle.textContent = shownIds.size > 0 ? 'All Templates' : 'Flipkart Templates';
                rest.forEach(t => renderTemplateRow(t, fkTemplateListEl));
                fkAllContainer.style.display = 'block';
            }

            fkListSection.style.display = 'block';

        } catch (e) {
            console.error('[FK TAB] Load templates error:', e);
        }
    }

    function renderTemplateRow(t, containerEl) {
        const sections   = Array.isArray(t.sections) ? t.sections : [];
        const fieldCount = Array.isArray(t.fields)   ? t.fields.length : 0;

        const li = document.createElement('li');
        li.className = 'template-item';

        // Left info
        const infoDiv = document.createElement('div');
        infoDiv.className = 'template-info';

        const nameSpan = document.createElement('span');
        nameSpan.className   = 'template-name';
        nameSpan.textContent = t.name;
        nameSpan.title       = t.name;
        infoDiv.appendChild(nameSpan);

        if (t.category) {
            const catSpan = document.createElement('span');
            catSpan.className   = 'template-cat';
            catSpan.textContent = t.category;
            infoDiv.appendChild(catSpan);
        }

        // Right actions: AutoFill icon · Fill · Details · Delete
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'template-actions';

        // ── Auto toggle button (marks this template as category's auto-fill) ──
        const autoFillIconBtn = document.createElement('button');
        autoFillIconBtn.className = 'btn-autofill btn-auto-toggle';
        autoFillIconBtn.textContent = 'Auto';

        const fillBtn = document.createElement('button');
        fillBtn.className   = 'btn-fill';
        fillBtn.textContent = 'Fill';
        fillBtn.title       = `Fill form with "${t.name}" (${fieldCount} fields · ${sections.length} sections)`;

        const detailsBtn = document.createElement('button');
        detailsBtn.className   = 'btn-autofill';
        detailsBtn.textContent = '···';
        detailsBtn.title       = 'Show/hide field details';

        const delBtn = document.createElement('button');
        delBtn.className   = 'btn-delete';
        delBtn.textContent = 'Delete';
        delBtn.title       = 'Delete template';

        actionsDiv.appendChild(autoFillIconBtn);
        actionsDiv.appendChild(fillBtn);
        actionsDiv.appendChild(detailsBtn);
        actionsDiv.appendChild(delBtn);
        li.appendChild(infoDiv);
        li.appendChild(actionsDiv);
        containerEl.appendChild(li);

        // Expandable detail panel
        const detail = document.createElement('div');
        detail.style.cssText =
            'display:none;padding:8px 10px 10px;border:1px solid var(--border);border-top:none;' +
            'background:var(--surface2);margin-top:-6px;margin-bottom:6px;border-radius:0 0 8px 8px;';
        detail.innerHTML = buildDetailHTML(t);
        containerEl.appendChild(detail);

        // Reflect current auto-fill state on button
        autoFillIconBtn.classList.toggle('active', !!t.autoFill);
        autoFillIconBtn.title = t.autoFill
            ? `Auto-fill ON for "${t.category || 'this category'}" — click to disable`
            : `Click to make this the auto-fill template for "${t.category || 'this category'}"`;

        // ── Auto toggle: marks this template as the auto-fill for its category ──
        autoFillIconBtn.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            console.log('[FK TAB] Auto click', { id: t._id, name: t.name, currentAutoFill: !!t.autoFill });
            autoFillIconBtn.disabled = true;
            const newVal = !t.autoFill;

            // Optimistic UI — flip the clicked button immediately so the user
            // sees feedback even if the network call is slow.
            autoFillIconBtn.classList.toggle('active', newVal);
            autoFillIconBtn.title = newVal
                ? `Auto-fill ON for "${t.category || 'this category'}" — click to disable`
                : `Click to make this the auto-fill template for "${t.category || 'this category'}"`;

            const ok = await _putAutoFill(t._id, newVal);
            if (!ok) {
                // Revert optimistic flip
                autoFillIconBtn.classList.toggle('active', !!t.autoFill);
                fkSetStatus('Could not update Auto — check connection.', 'var(--red)');
                autoFillIconBtn.disabled = false;
                return;
            }
            t.autoFill = newVal;

            const catK = _catKey(t.category);
            if (catK) {
                const siblings = _fkTemplates.filter(x => x._id !== t._id && _catKey(x.category) === catK);
                if (newVal) {
                    const toOff = siblings.filter(s => s.autoFill);
                    const results = await Promise.all(toOff.map(async s => {
                        const sok = await _putAutoFill(s._id, false);
                        if (sok) s.autoFill = false;
                        return sok;
                    }));
                    if (results.some(r => !r)) {
                        fkSetStatus('Auto updated, but one sibling failed to turn off — try again.', 'var(--gold)');
                    }
                }
                // When user turns Auto OFF, do NOT auto-promote a sibling.
                // Leaving zero Autos in the category is the correct state per user request.
            }

            autoFillIconBtn.disabled = false;
            // Re-render to reflect sibling state changes across other rows
            fkLoadTemplates();
        });

        // ── Details toggle ──
        detailsBtn.addEventListener('click', () => {
            const open = detail.style.display !== 'none';
            detail.style.display    = open ? 'none' : 'block';
            detailsBtn.textContent  = open ? '···' : '▲';
        });

        // ── Fill button ──
        fillBtn.addEventListener('click', async () => {
            if (!fkActiveTab?.id) {
                return fkSetStatus('No active Flipkart tab.', 'var(--red)');
            }

            fillBtn.disabled    = true;
            fillBtn.textContent = '...';
            fkSetStatus(`Filling "${t.name}"…`, 'var(--muted)');
            showFkToast(fkActiveTab.id, `Filling "${t.name}"…`, 'info');

            try {
                await ensureFkScript(fkActiveTab.id);

                const res = await chrome.tabs.sendMessage(fkActiveTab.id, {
                    action:   'fk_autofill',
                    template: t,
                });

                if (res?.success) {
                    fkSetStatus(
                        `Filled ${res.totalFilled} field${res.totalFilled !== 1 ? 's' : ''}` +
                        (res.totalMissed > 0 ? ` (${res.totalMissed} not found on page)` : '') +
                        ` from "${t.name}".`,
                        res.totalMissed > 0 ? 'var(--gold)' : 'var(--green)'
                    );
                    // Track usage
                    fetch(`${getApiUrl()}/${t._id}/use`, { method: 'POST', headers: authHdrs() }).catch(() => {});
                } else {
                    fkSetStatus('Fill failed: ' + (res?.error || 'unknown error'), 'var(--red)');
                }
            } catch (e) {
                console.error('[FK TAB] Fill error:', e);
                fkSetStatus('Fill error: ' + e.message, 'var(--red)');
            } finally {
                fillBtn.disabled    = false;
                fillBtn.textContent = 'Fill';
            }
        });

        // ── Delete ──
        delBtn.addEventListener('click', async () => {
            if (!confirm(`Delete template "${t.name}"?`)) return;
            try {
                const r = await fetch(`${getApiUrl()}/${t._id}`, {
                    method: 'DELETE', headers: authHdrs()
                });
                if (r.ok) { fkSetStatus(`"${t.name}" deleted.`, 'var(--muted)'); fkLoadTemplates(); }
                else       fkSetStatus('Delete failed.', 'var(--red)');
            } catch (_) { fkSetStatus('Delete failed.', 'var(--red)'); }
        });
    }

    // Builds the expandable field detail panel HTML
    function buildDetailHTML(t) {
        const sections  = Array.isArray(t.sections) ? t.sections : [];
        const flatFields = Array.isArray(t.fields) ? t.fields : [];

        if (sections.length > 0) {
            // Show section-by-section breakdown
            return sections.map(s => {
                const title = s.title === '_unknown' ? 'Other Fields' : esc(s.title);
                const rows  = (s.fields || []).map(f =>
                    `<tr>
                        <td style="padding:3px 6px;color:var(--soft);font-size:10.5px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(f.label || f.placeholder || f.name || '—')}</td>
                        <td style="padding:3px 6px;color:var(--text);font-size:10.5px;font-weight:600;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(String(f.value ?? ''))}</td>
                    </tr>`
                ).join('');

                return `
                    <div style="margin-bottom:8px;">
                        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--accent);margin-bottom:4px;">${title}</div>
                        <table style="width:100%;border-collapse:collapse;background:var(--surface2);border-radius:6px;overflow:hidden;">
                            ${rows || '<tr><td colspan="2" style="padding:4px 6px;color:var(--muted);font-size:10px;">No fields</td></tr>'}
                        </table>
                    </div>
                `;
            }).join('');
        }

        // Fallback: flat field list
        if (flatFields.length > 0) {
            const rows = flatFields.map(f =>
                `<tr>
                    <td style="padding:3px 6px;color:var(--soft);font-size:10.5px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(f.label || f.placeholder || f.name || '—')}</td>
                    <td style="padding:3px 6px;color:var(--text);font-size:10.5px;font-weight:600;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(String(f.value ?? ''))}</td>
                </tr>`
            ).join('');
            return `
                <table style="width:100%;border-collapse:collapse;background:var(--surface2);border-radius:6px;overflow:hidden;">
                    ${rows}
                </table>
            `;
        }

        return '<div style="font-size:11px;color:var(--muted);">No field data stored.</div>';
    }

    function esc(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ── Init ──
    async function fkInit() {
        fkSetStatus('');
        fkCategory  = '';
        fkVertical  = '';
        fkBrand     = '';
        fkActiveTab = null;
        _savedInfo  = null;

        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        fkActiveTab = tabs[0] || null;

        if (!isOnFlipkart(fkActiveTab?.url || '')) {
            showNotOnFlipkart();
            fkLoadTemplates();
            return;
        }

        // Inject fk-fill.js to ensure it's running
        await ensureFkScript(fkActiveTab.id);

        // Tell fk-fill.js its tabId so it can set the storage key
        chrome.tabs.sendMessage(fkActiveTab.id, { action: 'fk_set_tab_id', tabId: fkActiveTab.id }).catch(() => {});

        // Get detected category — content script checks sessionStorage then chrome.storage?.local
        try {
            const res = await chrome.tabs.sendMessage(
                fkActiveTab.id,
                { action: 'get_tab_category' }
            );
            fkCategory = (res?.category || '').trim();
            fkVertical = (res?.vertical || '').trim();
            fkBrand    = (res?.brand || '').trim();
        } catch (_) { fkCategory = ''; }

        // Last resort: read tab-specific key from chrome.storage?.local directly
        if (!fkCategory && fkActiveTab?.id) {
            try {
                const key    = `listify_cat_${fkActiveTab.id}`;
                const stored = await chrome.storage?.local.get(key);
                fkCategory   = (stored?.[key] || '').trim();
            } catch (_) {}
        }

        if (!fkCategory) {
            showNoCategory();
            fkLoadTemplates();
            return;
        }

        showReady(fkCategory);
        fkLoadTemplates();
    }

    // ── Save flow (two-step: naming → save) ──
    const fkSaveSection       = document.getElementById('fkSaveSection');
    const fkTemplateNameInput = document.getElementById('fkTemplateNameInput');
    const fkCategoryInput     = document.getElementById('fkCategoryInput');
    const fkConfirmSaveBtn    = document.getElementById('fkConfirmSaveBtn');
    const fkCancelSaveBtn     = document.getElementById('fkCancelSaveBtn');

    function openFkSaveSection() {
        fkTemplateNameInput.value = fkCategory || '';
        fkCategoryInput.value = fkCategory || '';
        fkSaveSection.style.display = 'block';
        fkSaveBtn.style.display = 'none';
        fkListSection.style.display = 'none';
        fkSetStatus('');
        setTimeout(() => { fkTemplateNameInput.focus(); fkTemplateNameInput.select(); }, 0);
    }

    function closeFkSaveSection() {
        fkSaveSection.style.display = 'none';
        fkSaveBtn.style.display = '';
        fkListSection.style.display = '';
        fkSetStatus('');
    }

    fkSaveBtn.addEventListener('click', () => {
        if (!getToken())      return fkSetStatus('Not signed in.', 'var(--red)');
        if (!fkActiveTab?.id) return fkSetStatus('No active Flipkart tab.', 'var(--red)');
        openFkSaveSection();
    });

    fkCancelSaveBtn.addEventListener('click', closeFkSaveSection);

    fkConfirmSaveBtn.addEventListener('click', async () => {
        const name     = fkTemplateNameInput.value.trim();
        const category = fkCategoryInput.value.trim() || name;
        if (!name) return fkSetStatus('Please enter a template name.', 'var(--red)');

        console.group('[FK TAB] Confirm Save');
        console.log('name:', name, 'category:', category);

        fkConfirmSaveBtn.disabled = true;
        fkSetStatus('Reading saved fields…', 'var(--muted)');

        try {
            await ensureFkScript(fkActiveTab.id);

            // ── Pre-flight: open every collapsed section so fk-fill.js can capture
            //    pre-filled values that aren't in the DOM yet. ──
            fkSetStatus('Opening sections to capture fields…', 'var(--muted)');
            try {
                const capRes = await chrome.tabs.sendMessage(
                    fkActiveTab.id,
                    { action: 'fk_capture_all_sections' }
                );
                console.log('[FK SAVE] Capture-all result:', capRes);
            } catch (e) {
                console.warn('[FK SAVE] capture_all_sections failed:', e);
            }
            await new Promise(r => setTimeout(r, 300));

            // ── Read all captured fields from chrome.storage.session ──
            const storKey = `fk_buffer_${fkActiveTab.id}`;
            const stored  = await chrome.storage.session.get([storKey]);
            const buf     = stored[storKey] || { fields: {}, sections: {} };

            console.log('[FK SAVE] Buffer from session storage:', buf);

            // Build clean fields array and sections (strip internal _key, _section props)
            const allFields = Object.values(buf.fields || {}).map(({ _key, _section, ...f }) => f);
            let sections  = Object.entries(buf.sections || {})
                .map(([title, fieldsMap]) => ({
                    title,
                    fields: Object.values(fieldsMap).map(({ _key, _section, ...f }) => f),
                }))
                .filter(s => s.fields.length > 0);

            // Sort sections by their DOM order on the page so the template reflects
            // the visual card sequence, then enforce the preferred section order.
            try {
                const orderRes = await chrome.tabs.sendMessage(fkActiveTab.id, { action: 'fk_get_section_order' });
                if (orderRes?.order?.length) {
                    const domOrder = orderRes.order.map(t => t.toLowerCase().trim());
                    sections.sort((a, b) => {
                        const ai = domOrder.indexOf(a.title.toLowerCase().trim());
                        const bi = domOrder.indexOf(b.title.toLowerCase().trim());
                        const an = ai === -1 ? 999 : ai;
                        const bn = bi === -1 ? 999 : bi;
                        return an - bn;
                    });
                    console.log('[FK SAVE] Sections sorted by DOM order:', sections.map(s => s.title));
                }
            } catch (_) {
                console.warn('[FK SAVE] Could not get DOM section order — keeping insertion order');
            }

            // Enforce preferred section order:
            // Price, Stock and Shipping Information → Product Description → Additional Description
            const PREFERRED_ORDER = [
                'price, stock and shipping information',
                'product description',
                'additional description',
            ];
            sections.sort((a, b) => {
                const ai = PREFERRED_ORDER.indexOf(a.title.toLowerCase().trim());
                const bi = PREFERRED_ORDER.indexOf(b.title.toLowerCase().trim());
                // Both in preferred list — sort by preferred position
                if (ai !== -1 && bi !== -1) return ai - bi;
                // Only a is in preferred list — a comes first
                if (ai !== -1) return -1;
                // Only b is in preferred list — b comes first
                if (bi !== -1) return 1;
                // Neither in preferred list — keep existing relative order (stable)
                return 0;
            });
            console.log('[FK SAVE] Sections after preferred order:', sections.map(s => s.title));

            console.log(`[FK SAVE] ${allFields.length} fields across ${sections.length} section(s)`);
            sections.forEach(s => console.log(`  [${s.title}]: ${s.fields.length} field(s)`));
            const imgCount = allFields.filter(f => f.type === 'image').length;
            console.log(`[FK SAVE] image fields in payload: ${imgCount}`);
            if (imgCount) console.log('[FK SAVE] image URLs:', allFields.filter(f => f.type === 'image').map(f => f.value));

            if (!allFields.length) {
                console.groupEnd();
                fkConfirmSaveBtn.disabled = false;
                return fkSetStatus(
                    'No filled fields found. Fill form sections first, then save.',
                    'var(--red)'
                );
            }

            fkSetStatus(`Saving "${name}" — ${allFields.length} fields, ${sections.length} sections…`, 'var(--muted)');

            const saveRes = await fetch(getApiUrl(), {
                method: 'POST',
                headers: authHdrs(),
                body: JSON.stringify({
                    name,
                    url:      'seller.flipkart.com',
                    category,
                    vertical: fkVertical,
                    brand:    fkBrand,
                    fields:   allFields,
                    sections,
                    autoFill: true,
                }),
            });

            console.log('[FK SAVE] API status:', saveRes.status);

            if (saveRes.ok) {
                console.groupEnd();
                fkSetStatus(
                    `"${name}" saved! ${allFields.length} fields across ${sections.length} section(s).`,
                    'var(--green)'
                );
                showFkToast(fkActiveTab.id, `Template saved — ${allFields.length} fields`, 'success');
                _savedInfo = { fieldCount: allFields.length, sectionCount: sections.length };
                chrome.runtime?.sendMessage({ action: 'fk_clear_buffer', tabId: fkActiveTab.id }).catch(() => {});
                updateBufferUI(0, 0);
                closeFkSaveSection();
                fkLoadTemplates();
            } else {
                let msg = `Error ${saveRes.status}`;
                try { const d = await saveRes.json(); msg = d.error || msg; } catch (_) {}
                console.error('[FK SAVE] API error:', msg);
                console.groupEnd();
                fkSetStatus(msg, 'var(--red)');
            }

        } catch (e) {
            console.error('[FK TAB] Save error:', e);
            console.groupEnd();
            fkSetStatus('Error: ' + e.message, 'var(--red)');
        } finally {
            fkConfirmSaveBtn.disabled = false;
        }
    });

    window.fkInit = fkInit;

})();
