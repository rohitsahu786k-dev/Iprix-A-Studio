;(function () {
    if (window.__listifyFkButtons) return;
    window.__listifyFkButtons = true;

    if (window !== window.top) return;
    if (!window.location.hostname.includes('seller.flipkart.com')) return;

    console.log('[LISTIFY FK BUTTONS] Loaded');

    const FONT = "'Inter',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI Variable','Segoe UI',Roboto,sans-serif";

    (function injectInterFont() {
        try {
            if (document.getElementById('__listify_inter_font__')) return;
            const fontUrl = chrome.runtime?.getURL('fonts/inter-latin.woff2');
            const style = document.createElement('style');
            style.id = '__listify_inter_font__';
            style.textContent =
                "@font-face{font-family:'Inter';font-style:normal;font-weight:400 700;font-display:swap;src:url('" +
                fontUrl +
                "') format('woff2');}";
            (document.head || document.documentElement).appendChild(style);
        } catch (e) {}
    })();
    const sp = (el, prop, val) => el.style.setProperty(prop, val, 'important');
    const applyStyles = (el, styles) => Object.entries(styles).forEach(([k, v]) => sp(el, k, v));

    // ─── Pre-flight: detect Flipkart logout / missing Listify token ──
    // Returns { ok: true } if both sessions are healthy, otherwise
    // { ok: false, reason, msg } and the caller should abort + toast.
    async function preflightAuth() {
        // 1. Flipkart side: login redirect or missing form shell
        const onLogin = /\/login|\/signin|\/account\/login/i.test(location.pathname);
        const hasForm = !!document.querySelector('button[role="tab"], [role="tabpanel"], .styles__EditAttributeItemWrapper-sc-gni56x-0');
        const noFlipkartSession = onLogin || !hasForm;
        if (noFlipkartSession) {
            return {
                ok: false,
                reason: 'flipkart_logged_out',
                msg: onLogin
                    ? 'Flipkart session expired — please log in and reload this page.'
                    : 'Flipkart listing form not detected — reload the page (you may be logged out).',
            };
        }
        // 2. Listify side: token present in chrome.storage
        try {
            const tokRes = await chrome.runtime?.sendMessage({ action: 'get_listify_token_status' });
            if (!tokRes?.hasToken) {
                return {
                    ok: false,
                    reason: 'listify_logged_out',
                    msg: 'Listify not signed in — open the extension popup and log in.',
                };
            }
        } catch (_) {
            // background not reachable — likely extension reload in flight
            return {
                ok: false,
                reason: 'bg_unreachable',
                msg: 'Extension background unreachable — try reloading the page.',
            };
        }
        return { ok: true };
    }

    // ─── Toast ────────────────────────────────────────────────
    function showToast(msg, type = 'success') {
        const existing = document.getElementById('__listify_fk_btn_toast__');
        if (existing) existing.remove();
        const colors = { success: '#1a9e5a', error: '#dc2626', info: '#2563eb', warning: '#b45309' };
        const toast = document.createElement('div');
        toast.id = '__listify_fk_btn_toast__';
        toast.textContent = msg;
        Object.assign(toast.style, {
            position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)', zIndex: '2147483647',
            background: colors[type] || colors.success, color: '#fff',
            padding: '10px 18px', borderRadius: '10px', fontSize: '13px',
            fontWeight: '600', fontFamily: FONT,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)', opacity: '1',
            transition: 'opacity 0.3s',
        });
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
    }

    // ─── Save modal (matches Meesho's modal) ─────────────────
    let _modalEls = null;
    function buildModal() {
        if (_modalEls) return _modalEls;

        const backdrop = document.createElement('div');
        backdrop.id = '__listify_fk_backdrop__';
        applyStyles(backdrop, {
            display: 'none', position: 'fixed', inset: '0', 'z-index': '2147483646',
            background: 'rgba(0,0,0,0.38)', 'align-items': 'center', 'justify-content': 'center',
        });

        const modal = document.createElement('div');
        applyStyles(modal, {
            background: '#fff', 'border-radius': '14px', padding: '22px', width: '300px',
            'box-shadow': '0 10px 40px rgba(0,0,0,0.22)', 'font-family': FONT,
        });
        backdrop.appendChild(modal);

        function makeEl(tag, styles, text) {
            const el = document.createElement(tag);
            if (styles) applyStyles(el, styles);
            if (text !== undefined) el.textContent = text;
            return el;
        }

        const head = makeEl('div', {
            display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', 'margin-bottom': '16px',
        });
        head.appendChild(makeEl('span', { 'font-size': '15px', 'font-weight': '700', color: '#111' }, 'Save Template'));
        head.appendChild(makeEl('span', { 'font-size': '12px', 'font-weight': '600', color: '#ff4f1f' }, 'A+ Studio'));
        modal.appendChild(head);

        function makeField(labelText, placeholder) {
            const lbl = makeEl('label', {
                display: 'block', 'font-size': '11px', 'font-weight': '600', color: '#888',
                'text-transform': 'uppercase', 'letter-spacing': '0.06em',
                'margin-bottom': '5px', 'margin-top': '12px',
            }, labelText);
            modal.appendChild(lbl);
            const inp = makeEl('input', {
                width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb',
                'border-radius': '8px', 'font-size': '13px', color: '#111', outline: 'none',
                'box-sizing': 'border-box', 'font-family': FONT, background: '#fff',
            });
            inp.type = 'text';
            inp.placeholder = placeholder;
            inp.addEventListener('focus', () => sp(inp, 'border', '1.5px solid #ff4f1f'));
            inp.addEventListener('blur', () => sp(inp, 'border', '1.5px solid #e5e7eb'));
            modal.appendChild(inp);
            return inp;
        }

        const nameInput = makeField('Template name', 'e.g. Saree Listing');
        nameInput.style.marginTop = '0';
        const catInput = makeField('Category', 'e.g. Wipes');
        catInput.readOnly = true;
        sp(catInput, 'background', '#f9fafb');
        sp(catInput, 'color', '#6b7280');
        sp(catInput, 'cursor', 'not-allowed');

        const actions = makeEl('div', { display: 'flex', gap: '8px', 'margin-top': '16px' });
        modal.appendChild(actions);

        const saveBtn = makeEl('button', {
            flex: '1', padding: '10px', background: '#ff4f1f', color: '#fff', border: 'none',
            'border-radius': '8px', 'font-size': '13px', 'font-weight': '600', cursor: 'pointer', 'font-family': FONT,
        }, 'Save');
        const cancelBtn = makeEl('button', {
            padding: '10px 14px', background: '#f3f4f6', color: '#555', border: 'none',
            'border-radius': '8px', 'font-size': '13px', cursor: 'pointer', 'font-family': FONT,
        }, 'Cancel');
        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);

        const statusMsg = makeEl('div', {
            'font-size': '12px', 'margin-top': '10px', 'min-height': '16px', color: '#888',
        });
        modal.appendChild(statusMsg);

        document.body.appendChild(backdrop);

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) sp(backdrop, 'display', 'none');
        });
        cancelBtn.addEventListener('click', () => sp(backdrop, 'display', 'none'));

        function setStatus(text, type) {
            statusMsg.textContent = text || '';
            sp(statusMsg, 'color', type === 'ok' ? '#1a9e5a' : type === 'err' ? '#dc2626' : '#888');
        }

        _modalEls = { backdrop, nameInput, catInput, saveBtn, cancelBtn, setStatus };
        return _modalEls;
    }

    function openSaveModal({ defaultName, defaultCategory }) {
        const { backdrop, nameInput, catInput, saveBtn, setStatus } = buildModal();
        nameInput.value = defaultName || defaultCategory || '';
        catInput.value = defaultCategory || '';
        saveBtn.textContent = 'Save';
        saveBtn.disabled = false;
        setStatus('');
        sp(backdrop, 'display', 'flex');
        setTimeout(() => { nameInput.focus(); nameInput.select(); }, 0);
    }

    // ─── Section order from DOM (mirrors fk-autofill.js logic) ──
    function getDomSectionOrder() {
        return [...document.querySelectorAll('div[height="min"]')]
            .map(card => {
                for (const span of card.querySelectorAll('span')) {
                    if (span.children.length > 0) continue;
                    const t = span.textContent.replace(/\(\d+\/\d+\)/g, '').replace(/\s+/g, ' ').trim();
                    if (t && t.length > 5 && t.length < 120 && !/^(EDIT|SAVE|CANCEL|\d+.*)$/i.test(t)) return t;
                }
                return null;
            })
            .filter(Boolean);
    }

    // ─── Save template (invoked from modal Save button) ──────
    async function doSave({ name, category }) {
        const { saveBtn, setStatus } = buildModal();
        saveBtn.disabled = true;
        saveBtn.textContent = 'Capturing…';
        setStatus('');

        try {
            const tabRes = await chrome.runtime?.sendMessage({ action: 'get_tab_id' });
            const tabId = tabRes?.tabId;
            if (!tabId) throw new Error('Could not get tab ID');

            // Walk through every form tab/section so fk-fill.js captures
            // fields on tabs the user never opened. fk_capture_all_sections
            // routes to captureAllTabs (tabbed layout) or captureAllSections.
            saveBtn.textContent = 'Walking all tabs…';
            try {
                const capRes = await chrome.runtime?.sendMessage({ action: 'fk_capture_all_sections' });
                console.log('[LISTIFY FK BUTTONS] capture-all result:', capRes);
            } catch (e) {
                console.warn('[LISTIFY FK BUTTONS] capture_all failed:', e);
            }
            // Allow pending fk_save_field writes (queued in fk-fill.js) to
            // flush through to chrome.storage.session before we read.
            await new Promise(r => setTimeout(r, 600));

            saveBtn.textContent = 'Saving…';

            const bufRes = await chrome.runtime?.sendMessage({ action: 'fk_get_buffer', tabId });
            const buf = bufRes?.buf || { fields: {}, sections: {} };

            const allFields = Object.values(buf.fields || {}).map(({ _key, _section, ...f }) => f);
            if (!allFields.length) {
                // Diagnostic: dump buffer contents + DOM state
                console.warn('[LISTIFY FK BUTTONS] Empty buffer diagnostic:', {
                    bufRes,
                    bufFieldsCount: Object.keys(buf.fields || {}).length,
                    bufSectionKeys: Object.keys(buf.sections || {}),
                    tabId,
                    domHasTabs: document.querySelectorAll('button[role="tab"]').length,
                    domHasWrappers: document.querySelectorAll('.styles__EditAttributeItemWrapper-sc-gni56x-0').length,
                    fkFillLoaded: !!window.__listifyFkFill,
                    url: location.href,
                });
                setStatus('No fields captured — see console for diagnostic. Try typing/changing a field then retry.', 'err');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
                return;
            }

            let sections = Object.entries(buf.sections || {})
                .map(([title, fieldsMap]) => ({
                    title,
                    fields: Object.values(fieldsMap).map(({ _key, _section, ...f }) => f),
                }))
                .filter(s => s.fields.length > 0);

            const domOrder = getDomSectionOrder().map(t => t.toLowerCase().trim());
            if (domOrder.length) {
                sections.sort((a, b) => {
                    const ai = domOrder.indexOf(a.title.toLowerCase().trim());
                    const bi = domOrder.indexOf(b.title.toLowerCase().trim());
                    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
                });
            }

            const PREFERRED = ['price, stock and shipping information', 'product description', 'additional description'];
            sections.sort((a, b) => {
                const ai = PREFERRED.indexOf(a.title.toLowerCase().trim());
                const bi = PREFERRED.indexOf(b.title.toLowerCase().trim());
                if (ai !== -1 && bi !== -1) return ai - bi;
                if (ai !== -1) return -1;
                if (bi !== -1) return 1;
                return 0;
            });

            const vertical = (sessionStorage.getItem('listify_tab_vertical') || '').trim();
            const brand    = (sessionStorage.getItem('listify_tab_brand') || '').trim();

            console.log('[LISTIFY FK BUTTONS] Save payload — sections:',
                sections.map(s => `${s.title}(${s.fields.length})`).join(', '),
                '| total fields:', allFields.length,
                '| image fields:', allFields.filter(f => f.type === 'image').length);
            const saveRes = await chrome.runtime?.sendMessage({
                action: 'fk_save_template_bg',
                payload: { name, url: 'seller.flipkart.com', category, vertical, brand, fields: allFields, sections, autoFill: true },
            });

            if (saveRes?.ok) {
                setStatus(`Saved! ${allFields.length} fields across ${sections.length} section(s).`, 'ok');
                saveBtn.textContent = 'Saved ✓';
                chrome.runtime?.sendMessage({ action: 'fk_clear_buffer' }).catch(() => {});
                const { backdrop } = buildModal();
                setTimeout(() => sp(backdrop, 'display', 'none'), 1500);
            } else {
                setStatus(saveRes?.error || 'Save failed.', 'err');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
            }
        } catch (e) {
            console.error('[LISTIFY FK BUTTONS] Save error:', e);
            setStatus('Error: ' + e.message, 'err');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save';
        }
    }

    // ─── Toolbar buttons (Meesho-style white pill) ───────────
    let _toolbar = null;

    function makeToolbarBtn({ id, label, bg, shadow }) {
        const btn = document.createElement('button');
        btn.id = id;
        btn.textContent = label;
        applyStyles(btn, {
            padding: '7px 14px', 'border-radius': '8px', background: bg, color: '#fff',
            border: 'none', cursor: 'pointer', outline: 'none',
            'box-shadow': `0 2px 8px ${shadow}`, display: 'flex', 'align-items': 'center',
            'justify-content': 'center', 'font-size': '12px', 'font-weight': '600',
            'font-family': FONT, 'letter-spacing': '0.01em', 'white-space': 'nowrap',
            transition: 'opacity 0.15s, box-shadow 0.15s', 'line-height': '1',
        });
        btn.addEventListener('mouseenter', () => sp(btn, 'box-shadow', `0 6px 22px ${shadow.replace('0.3', '0.55')}`));
        btn.addEventListener('mouseleave', () => sp(btn, 'box-shadow', `0 2px 8px ${shadow}`));
        btn.addEventListener('mousedown', () => sp(btn, 'opacity', '0.85'));
        btn.addEventListener('mouseup', () => sp(btn, 'opacity', '1'));
        return btn;
    }

    function makeDragHandle(side) {
        const handle = document.createElement('div');
        handle.className = '__listify_fk_drag_handle__';
        handle.title = 'Drag to move';
        handle.innerHTML = `
            <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true">
              <circle cx="3" cy="3" r="1.3"/><circle cx="9" cy="3" r="1.3"/>
              <circle cx="3" cy="8" r="1.3"/><circle cx="9" cy="8" r="1.3"/>
              <circle cx="3" cy="13" r="1.3"/><circle cx="9" cy="13" r="1.3"/>
            </svg>`;
        applyStyles(handle, {
            display: 'flex', 'align-items': 'center', 'justify-content': 'center',
            padding: '6px 4px',
            [side === 'right' ? 'margin-left' : 'margin-right']: '2px',
            cursor: 'grab', color: '#9ca3af', 'border-radius': '6px',
            transition: 'background 0.15s, color 0.15s',
            'user-select': 'none', '-webkit-user-select': 'none', 'touch-action': 'none',
        });
        handle.addEventListener('mouseenter', () => {
            sp(handle, 'background', '#f3f4f6');
            sp(handle, 'color', '#000');
        });
        handle.addEventListener('mouseleave', () => {
            sp(handle, 'background', 'transparent');
            sp(handle, 'color', '#9ca3af');
        });
        return handle;
    }

    function makeDraggable(toolbar, handles, storageKey) {
        const handleList = Array.isArray(handles) ? handles : [handles];
        let dragging = false;
        let activeHandle = null;
        let startX = 0, startY = 0, initLeft = 0, initTop = 0;

        function applyPos(left, top) {
            sp(toolbar, 'left', left + 'px');
            sp(toolbar, 'top', top + 'px');
            sp(toolbar, 'right', 'auto');
            sp(toolbar, 'bottom', 'auto');
            sp(toolbar, 'transform', 'none');
        }

        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
            if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
                const maxX = Math.max(0, window.innerWidth - 80);
                const maxY = Math.max(0, window.innerHeight - 40);
                applyPos(
                    Math.min(Math.max(0, saved.left), maxX),
                    Math.min(Math.max(0, saved.top), maxY),
                );
            }
        } catch (_) {}

        handleList.forEach((handle) => {
            handle.addEventListener('pointerdown', (e) => {
                dragging = true;
                activeHandle = handle;
                try { handle.setPointerCapture(e.pointerId); } catch (_) {}
                const rect = toolbar.getBoundingClientRect();
                startX = e.clientX; startY = e.clientY;
                initLeft = rect.left; initTop = rect.top;
                sp(handle, 'cursor', 'grabbing');
                sp(toolbar, 'transition', 'none');
                e.preventDefault();
            });

            handle.addEventListener('pointermove', (e) => {
                if (!dragging || activeHandle !== handle) return;
                const rect = toolbar.getBoundingClientRect();
                const maxX = Math.max(0, window.innerWidth - rect.width);
                const maxY = Math.max(0, window.innerHeight - rect.height);
                const left = Math.min(Math.max(0, initLeft + (e.clientX - startX)), maxX);
                const top = Math.min(Math.max(0, initTop + (e.clientY - startY)), maxY);
                applyPos(left, top);
            });

            function endDrag(e) {
                if (!dragging || activeHandle !== handle) return;
                dragging = false;
                activeHandle = null;
                try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
                sp(handle, 'cursor', 'grab');
                sp(toolbar, 'transition', '');
                const rect = toolbar.getBoundingClientRect();
                try {
                    localStorage.setItem(storageKey, JSON.stringify({ left: rect.left, top: rect.top }));
                } catch (_) {}
            }
            handle.addEventListener('pointerup', endDrag);
            handle.addEventListener('pointercancel', endDrag);
        });
    }

    function injectToolbar() {
        if (_toolbar && document.body.contains(_toolbar)) return;

        const toolbar = document.createElement('div');
        toolbar.id = '__listify_fk_toolbar__';
        applyStyles(toolbar, {
            position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            'z-index': '2147483647', display: 'flex', gap: '6px', 'align-items': 'center',
            padding: '6px 4px', background: '#fff', 'border-radius': '14px',
            border: '1px solid #e5e7eb',
            'box-shadow': '0 10px 30px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
            'backdrop-filter': 'saturate(180%) blur(8px)',
        });

        const leftHandle = makeDragHandle('left');
        const rightHandle = makeDragHandle('right');
        toolbar.appendChild(leftHandle);

        const autofillBtn = makeToolbarBtn({
            id: '__listify_fk_fill_btn__', label: 'Fill',
            bg: '#1a9e5a', shadow: 'rgba(26,158,90,0.3)',
        });
        autofillBtn.title = 'Fill form using saved A+ Studio template';
        autofillBtn.addEventListener('click', handleAutofill);

        const saveBtn = makeToolbarBtn({
            id: '__listify_fk_save_btn__', label: 'Save Template',
            bg: '#ff4f1f', shadow: 'rgba(255,79,31,0.3)',
        });
        saveBtn.title = 'Save current form as an A+ Studio template';
        saveBtn.addEventListener('click', handleSaveTemplateClick);

        toolbar.appendChild(autofillBtn);
        toolbar.appendChild(saveBtn);
        toolbar.appendChild(rightHandle);
        document.body.appendChild(toolbar);

        makeDraggable(toolbar, [leftHandle, rightHandle], '__listify_toolbar_pos__');

        _toolbar = toolbar;
        console.log('[LISTIFY FK BUTTONS] Toolbar injected');
    }

    function removeToolbar() {
        if (_toolbar) { _toolbar.remove(); _toolbar = null; }
    }

    // ─── Save click: prefill modal then open ──────────────────
    async function handleSaveTemplateClick() {
        const pre = await preflightAuth();
        if (!pre.ok) { showToast(pre.msg, 'error'); return; }
        let category = (sessionStorage.getItem('listify_tab_category') || '').trim();

        // Open modal immediately with synchronously available data so it appears
        // right on click — before any async background message (which can stall
        // while the service worker wakes up and cause the modal to appear only
        // when the user later clicks the extension icon, creating "cross-matching").
        const defaultName = category || (document.title.replace(/[-|–|:].*$/, '').trim() || 'My Template');
        openSaveModal({ defaultName, defaultCategory: category });

        const { saveBtn, nameInput, catInput, setStatus } = buildModal();
        saveBtn.onclick = () => {
            const name = nameInput.value.trim();
            const cat = catInput.value.trim();
            if (!name) { setStatus('Please enter a template name.', 'err'); return; }
            doSave({ name, category: cat || name });
        };

        // Update category from per-tab chrome.storage asynchronously (only if
        // not already resolved from sessionStorage above).
        if (!category) {
            try {
                const catRes = await chrome.runtime?.sendMessage({ action: 'get_my_tab_category' });
                category = (catRes?.category || '').trim();
                if (category) {
                    catInput.value = category;
                    if (!nameInput.value || nameInput.value === defaultName) {
                        nameInput.value = category;
                    }
                }
            } catch (_) {}
        }
    }

    // ─── Autofill ─────────────────────────────────────────────
    async function handleAutofill() {
        const btn = document.getElementById('__listify_fk_fill_btn__');
        const orig = btn?.textContent || 'Fill';

        const pre = await preflightAuth();
        if (!pre.ok) { showToast(pre.msg, 'error'); return; }

        if (btn) { btn.disabled = true; btn.textContent = 'Filling…'; }

        try {
            let category = (sessionStorage.getItem('listify_tab_category') || '').trim();
            if (!category) {
                const catRes = await chrome.runtime?.sendMessage({ action: 'get_my_tab_category' });
                category = (catRes?.category || '').trim();
            }

            const result = await chrome.runtime?.sendMessage({
                action: 'fk_trigger_autofill_fk',
                domCategory: category,
            });

            if (!result?.ok) {
                const msg = result?.error === 'no_match'
                    ? `Template not saved for this category${category ? ` — "${category}"` : ''}`
                    : (result?.error || 'No matching template found.');
                showToast(msg, 'error');
                return;
            }

            window.dispatchEvent(new CustomEvent('listify_fk_autofill', { detail: result.template }));

            await new Promise(resolve => {
                const handler = (e) => {
                    window.removeEventListener('listify_fk_autofill_done', handler);
                    clearTimeout(timeout);
                    const { totalFilled = 0, totalMissed = 0 } = e.detail || {};
                    const msg = totalMissed
                        ? `Filled ${totalFilled} field(s), ${totalMissed} missed`
                        : `Filled ${totalFilled} field(s)`;
                    showToast(msg, 'success');
                    resolve();
                };
                const timeout = setTimeout(() => {
                    window.removeEventListener('listify_fk_autofill_done', handler);
                    resolve();
                }, 30000);
                window.addEventListener('listify_fk_autofill_done', handler);
            });

            if (result.template?._id) {
                chrome.runtime?.sendMessage({ action: 'record_template_usage', templateId: result.template._id }).catch(() => {});
            }
        } catch (e) {
            console.error('[LISTIFY FK BUTTONS] Autofill error:', e);
            showToast('Fill failed: ' + e.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = orig; }
        }
    }

    // ─── Visibility: only on addListings page ────────────────
    function updateVisibility() {
        if (window.location.href.includes('addListings')) injectToolbar();
        else removeToolbar();
    }

    // Watch URL changes (SPA navigation)
    let _lastUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== _lastUrl) {
            _lastUrl = window.location.href;
            updateVisibility();
        }
    }, 800);

    // Re-inject if React removes it
    const _observer = new MutationObserver(() => {
        if (window.location.href.includes('addListings') && !document.getElementById('__listify_fk_toolbar__')) {
            injectToolbar();
        }
    });
    _observer.observe(document.body, { childList: true, subtree: true });

    updateVisibility();
})();
