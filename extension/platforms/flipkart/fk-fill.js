; (function () {
    if (window.__listifyFkFill) return;
    window.__listifyFkFill = true;

    if (!window.location.hostname.includes('seller.flipkart.com')) return;

    // Debug-log filter. Set to [] to log everything; otherwise only verbose
    // capture/fill logs whose label matches (case-insensitive, substring) get
    // printed. Reduces console noise while debugging one field at a time.
    const _FK_DEBUG_LABELS = ['color', 'sleeve', 'fabric', 'fit', 'image'];
    function dbg(label, ...args) {
        if (!_FK_DEBUG_LABELS.length) { console.log(...args); return; }
        const l = String(label || '').toLowerCase();
        if (_FK_DEBUG_LABELS.some(x => l.includes(x))) console.log(...args);
    }
    window.__fkDebugLabels = _FK_DEBUG_LABELS; // expose so fk-autofill can read

    // QC helper — paste this in DevTools console to see what's in the capture buffer:
    //   window.postMessage({ type: '__LISTIFY_DUMP' }, '*')              // dump all
    //   window.postMessage({ type: '__LISTIFY_DUMP', filter: 'weight' }, '*')  // filter by label
    window.addEventListener('message', (e) => {
        if (!e.data || e.data.type !== '__LISTIFY_DUMP') return;
        const filter = (e.data.filter || '').toLowerCase();
        chrome.runtime.sendMessage({ action: 'fk_get_buffer' }, (r) => {
            const all = Object.values((r && r.buf && r.buf.fields) || {});
            const rows = all
                .filter(f => !filter || (f.label || '').toLowerCase().includes(filter))
                .map(f => ({
                    label:   f.label,
                    type:    f.type,
                    value:   String(f.value ?? '').slice(0, 60),
                    section: f._section,
                    _key:    f._key,
                }));
            console.log(`[LISTIFY DUMP] ${rows.length}/${all.length} fields${filter ? ` (filter="${filter}")` : ''}:`);
            console.table(rows);
        });
    });

    // Only capture fields when the user is on the actual listing form.
    // This prevents login credentials, OTP digits, and nav-menu radio
    // buttons from being saved to the buffer.
    function isListingPage() {
        const url = window.location.href;
        if (url.includes('addListings')) return true;
        if (/#.*(addListing|add-listing|single-listing|inventory\/listing)/i.test(url)) return true;
        // DOM fallback so future Flipkart route renames don't silently break us.
        if (document.querySelector(
            '[class*="EditAttributeItemWrapper"], [class*="FocusWrapper"]'
        )) return true;
        return false;
    }

    // NOTE: chrome.storage.session is NOT accessible from cross-origin iframe content scripts.
    // All storage reads/writes are routed through background.js instead.

    // ── Storage key — set once tabId is known ──
    let _storKey   = null;
    let _pendingQ  = []; // fields captured before storKey is ready

    // ── Declared here so attachAll/startObserver can be called before their definitions ──
    const _attached = new WeakSet();
    let   _observer = null;

    function initStorKey(tabId) {
        if (!tabId || _storKey) return;
        _storKey = `fk_buffer_${tabId}`;
        if (_pendingQ.length) {
            _pendingQ.forEach(saveField);
            _pendingQ = [];
        }
    }

    // Path 1: ask background.js for tabId. Retry on backoff in case background
    // worker is still spinning up — without this, captures sit in _pendingQ
    // until the popup is opened (popup explicitly sends fk_set_tab_id).
    if (!chrome.runtime?.id) { console.warn('[FK FILL] Extension context invalid — reload page'); return; }
    function requestTabId(attempt = 0) {
        if (_storKey) return;
        if (!chrome.runtime?.id) return;
        chrome.runtime.sendMessage({ action: 'get_tab_id' }, (res) => {
            if (chrome.runtime.lastError || !res?.tabId) {
                if (attempt < 6) setTimeout(() => requestTabId(attempt + 1), 500 * (attempt + 1));
                return;
            }
            initStorKey(res.tabId);
        });
    }
    requestTabId();

    // Start attaching listeners immediately — don't wait for tabId
    attachAll();
    startObserver();

    // Re-run attachAll when SPA navigates to the listing form
    let _lastFillUrl = window.location.href;
    setInterval(() => {
        const url = window.location.href;
        if (url !== _lastFillUrl) {
            _lastFillUrl = url;
            if (isListingPage()) {
                attachAll();
            }
        }
    }, 800);

    // ─────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────
    function getLabel(el) {
        // Flipkart new tabbed layout — label sits in a known wrapper class
        const fkWrapper = el.closest(
            '[class*="EditAttributeItemWrapper"], [class*="FocusWrapper"]'
        );
        if (fkWrapper) {
            // Multi-input wrappers (e.g. Package Details — Length/Breadth/Height/Weight
            // share one outer wrapper) have several label nodes. Pick the label that
            // is the closest PRECEDING node of `el` in document order — that's the
            // one visually paired with this input.
            const fkLbls = [...fkWrapper.querySelectorAll('[class*="AttributeItemLabelName"]')];
            if (fkLbls.length > 1) {
                let best = null;
                for (const lbl of fkLbls) {
                    if (el.compareDocumentPosition(lbl) & Node.DOCUMENT_POSITION_PRECEDING) best = lbl;
                }
                if (best) {
                    const t = best.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
                    if (t) return t;
                }
            }
            const fkLbl = fkLbls[0] || fkWrapper.querySelector('[class*="AttributeItemLabelName"]');
            if (fkLbl) {
                const t = fkLbl.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
                if (t) return t;
            }
        }
        const aria = el.getAttribute('aria-label');
        if (aria && aria.trim()) return aria.trim();
        if (el.id) {
            try {
                const lbl = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
                if (lbl) return lbl.textContent.replace(/\s*\*$/, '').trim();
            } catch (_) {}
        }
        const lblId = el.getAttribute('aria-labelledby');
        if (lblId) {
            const lbl = document.getElementById(lblId);
            if (lbl) return lbl.textContent.replace(/\s*\*$/, '').trim();
        }
        const ph = el.getAttribute('placeholder');
        if (ph && ph.trim()) return ph.trim();
        let p = el.parentElement;
        for (let i = 0; i < 10; i++) {
            if (!p || p === document.body) break;
            for (const lbl of p.querySelectorAll('label,p,span')) {
                if (lbl.contains(el)) continue;
                const t = lbl.textContent.replace(/\s*\*$/, '').trim();
                if (t && t.length > 1 && t.length < 80 && !/^\d+$/.test(t)) return t;
            }
            p = p.parentElement;
        }
        return el.name || el.id || '';
    }

    function findAllSectionCards() {
        return [...document.querySelectorAll('div[height="min"]')]
            .filter(card => {
                const btns = [...card.querySelectorAll('button,[role="button"]')]
                    .map(b => (b.textContent || '').trim().toUpperCase());
                return btns.includes('EDIT') || btns.includes('SAVE') || btns.includes('CANCEL');
            });
    }

    function isSectionOpen(card) {
        return [...card.querySelectorAll('button,[role="button"]')]
            .some(b => (b.textContent || '').trim().toUpperCase() === 'SAVE');
    }

    function findEditButtonIn(card) {
        const byClass = card.querySelector('button.hTTPSU[data-testid="button"]');
        if (byClass) return byClass;
        return [...card.querySelectorAll('button,[role="button"]')]
            .find(b => (b.textContent || '').trim().toUpperCase() === 'EDIT') || null;
    }

    function findCancelButtonIn(card) {
        return [...card.querySelectorAll('button,[role="button"]')]
            .find(b => (b.textContent || '').trim().toUpperCase() === 'CANCEL') || null;
    }

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    function getSectionTitle(el) {
        // New tabbed layout — if the field lives inside an active tabpanel,
        // use the tab title as the section name instead of walking for cards.
        if (el.closest('div[role="tabpanel"]:not([aria-hidden="true"])')) {
            const t = getActiveTabTitle();
            // strip trailing error counts e.g. "Price... 13 Errors"
            return t.replace(/\s*\d+\s*Errors?\s*$/i, '').trim() || '_unknown';
        }

        let p = el.parentElement;
        for (let i = 0; i < 20; i++) {
            if (!p || p === document.body) break;

            // Only treat a container as a section if it is a Flipkart card
            // (div[height="min"]).  Page-level wrappers (e.g. the whole form)
            // also have SAVE/CANCEL buttons but must not be used as section
            // boundaries — they produce misleading titles like "Add a Single Listing".
            if (p.getAttribute && p.getAttribute('height') === 'min') {
                const btns = [...p.querySelectorAll('button,[role="button"]')]
                    .map(b => (b.textContent || '').trim().toUpperCase());
                if (btns.includes('SAVE') || btns.includes('CANCEL')) {
                    // Try headings first
                    const h = p.querySelector('h1,h2,h3,h4,h5,h6');
                    if (h) return h.textContent.replace(/\(\d+\/\d+\)/g, '').replace(/\s+/g, ' ').trim();

                    // Flipkart uses a <span> for the card title (not a heading)
                    for (const span of p.querySelectorAll('span')) {
                        if (span.children.length > 0) continue;
                        const t = span.textContent.replace(/\(\d+\/\d+\)/g, '').replace(/\s+/g, ' ').trim();
                        if (t && t.length > 5 && t.length < 120 && !/^(EDIT|SAVE|CANCEL|\d+.*)$/i.test(t)) return t;
                    }
                }
            }

            p = p.parentElement;
        }
        return '_unknown';
    }

    // ─────────────────────────────────────────────────────
    // CAPTURE
    // ─────────────────────────────────────────────────────
    function captureField(el) {
        if (!isListingPage()) return;
        const value = el.type === 'checkbox' ? el.checked : el.value;
        if ((!value && value !== false) || value === '[object Object]') return;

        const label        = getLabel(el).replace(/\s*\*$/, '').trim();
        const ph           = (el.getAttribute('placeholder') || '').trim();
        const sectionTitle = getSectionTitle(el);
        const sectionPrefix = (sectionTitle && sectionTitle !== '_unknown') ? sectionTitle + '_' : '';
        // Prefer label (most stable) → name → id → placeholder (last resort).
        // Placeholder-as-key was causing collisions when multiple inputs shared
        // generic placeholders, and label-mismatches when placeholder differed
        // from the visible label on the page.
        const key          = (sectionPrefix + (label || (el.name || '').trim() || el.id || ph || '')).toLowerCase();
        if (!key) return;

        // Skip Flipkart nav menu items (Profile, Log Out, Switch Account, etc.)
        // These are radio inputs with ids like "checkMarkOption_<seller>_Log Out"
        if (el.id && el.id.startsWith('checkMarkOption_')) return;

        // Skip popover/dialog search inputs — these are noise from open dropdowns,
        // not real form fields. Ids look like "checkmarkgroup-search" or "checkbox-tree-*-search".
        if (el.id === 'checkmarkgroup-search') return;
        if (el.id && el.id.startsWith('checkbox-tree-')) return;
        if (el.closest('[role="dialog"]')) return;

        // Skip the inner text input of a chip-input field (.rti--container).
        // captureMultiTextIn handles these and saves type=multitext with all chips.
        // Capturing here too would save the same field as plain type=text.
        if (el.closest('.rti--container')) return;

        // Skip junk checkbox captures with no meaningful label (e.g. "ty").
        // Short labels usually come from typo placeholders or stray inputs;
        // they pollute the saved listing and break later fills.
        if (el.type === 'checkbox' && (!label || label.length <= 2)) return;

        // Skip ANY field inside a variant attribute wrapper — chip creation
        // inputs ("Enter New Pack of"), unit comboboxes ("from", "mg"), and
        // row-checkboxes are all noise. The real variant chip data is saved
        // separately by captureVariantsIn as type:"variant", and the per-row
        // table cells are saved as type:"variant_cell".
        if (el.closest('[class*="VariantAttributeWrapper"]')) return;
        // Skip Variant Details TABLE inputs — captured separately as variant_cell.
        // Use the input's own id (not a closest('tr,[role="row"]') walk, which
        // false-positives when a non-variant input shares a layout-row ancestor
        // with the variant table — that walk silently dropped Product Description
        // "Pack of" capture in v1.0.15+).
        if (el.id && el.id.startsWith('variant-cell-')) return;

        const field = {
            label, value,
            type: el.tagName === 'SELECT' ? 'select'
                : el.type === 'checkbox'  ? 'checkbox'
                : (el.type || 'text'),
            id:          el.id    || '',
            name:        el.name  || '',
            placeholder: ph,
            selector:    el.id   ? ('#' + el.id) : (el.name ? ('[name="' + el.name + '"]') : ''),
            _section:    sectionTitle,
            _key:        key,
        };

        if (!_storKey) {
            const idx = _pendingQ.findIndex(f => f._key === key);
            if (idx >= 0) _pendingQ[idx] = field; else _pendingQ.push(field);
            return;
        }

        saveField(field);
    }

    // Serialize saveField calls — background.js does read-modify-write on
    // chrome.storage.session, so parallel calls race and clobber each other.
    let _saveQueue = Promise.resolve();
    function saveField(field) {
        if (!chrome.runtime?.id) return Promise.resolve(); // extension context invalidated
        // Never save Seller SKU ID — it must be unique per listing, so the
        // autofill side generates a fresh random value instead of replaying.
        if (field && /^\s*seller\s*sku\s*id\b/i.test(field.label || '')) return Promise.resolve();
        const job = () => new Promise(resolve => {
            chrome.runtime.sendMessage({ action: 'fk_save_field', storKey: _storKey, field }, (res) => {
                if (chrome.runtime.lastError) {
                    console.error('[FK FILL] ❌ fk_save_field failed:', chrome.runtime.lastError.message);
                    return resolve();
                }
                if (res?.fieldCount) notifyPopup(res.fieldCount, res.sectionCount);
                resolve();
            });
        });
        _saveQueue = _saveQueue.then(job, job);
        return _saveQueue;
    }

    // ── Debounced popup notification ──
    let _notifyTimer = null;
    function notifyPopup(fieldCount, sectionCount) {
        clearTimeout(_notifyTimer);
        _notifyTimer = setTimeout(() => {
            if (!chrome.runtime?.id) return;
            chrome.runtime.sendMessage({
                action: 'fk_buffer_updated',
                count:  fieldCount,
                sectionCount,
            }).catch(() => {});
        }, 200);
    }

    // ─────────────────────────────────────────────────────
    // EVENT LISTENERS
    // ─────────────────────────────────────────────────────
    function attachTo(el) {
        if (_attached.has(el)) return;
        _attached.add(el);
        const isImmediate = el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio';
        el.addEventListener(isImmediate ? 'change' : 'input', () => captureField(el));
        el.addEventListener('blur', () => captureField(el));
    }

    function attachAll() {
        if (!isListingPage()) return;
        const els = document.querySelectorAll(
            'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]),' +
            'textarea,select'
        );
        els.forEach(el => {
            attachTo(el);
            // Immediately capture any field that already has a value
            // (handles pre-filled fields, React-restored values, auto-populated dropdowns)
            captureField(el);
        });
        attachComboObservers();
        attachMultiTextObservers();
        attachImageCaptureHandlers();
    }

    // ── Image capture ──
    // Flipkart uploads images to its own CDN (fkmpimages.flixcart.com) and the
    // resulting URL is rendered as <img src="..."> inside each slot tile. The
    // CDN URL is stable, so we only save the URL string — no bytes, no backend.
    // Called from captureAllTabs when the Image addition tab is active.
    function attachImageCaptureHandlers() { /* no-op — capture is read-only from DOM */ }

    async function captureImagesIn(panel) {
        if (!panel) return 0;

        // Variant Image carousel: a side menu lists each variant (parent + per-chip).
        // Clicking an item swaps the carousel content. Iterate each variant so we
        // capture per-variant slot contents. Tag each field with _variant.
        const sideItems = [...panel.querySelectorAll('[class*="SideMenuItem"]')];
        if (sideItems.length > 1) {
            dbg('image', `[LISTIFY FK CAPTURE] Variant image side menu detected (${sideItems.length} variants)`);
            let total = 0;
            for (const item of sideItems) {
                const vName = (item.querySelector('[class*="SideMenuItemText"]')?.textContent || '').trim();
                if (!vName) continue;
                try { item.click(); } catch (_) {}
                await wait(700);
                total += await _captureSlotsInPanel(panel, vName);
            }
            return total;
        }

        return await _captureSlotsInPanel(panel, null);
    }

    async function _captureSlotsInPanel(panel, variantName) {
        const slots = [...panel.querySelectorAll('[id^="thumbnail_"]')];
        dbg('image', `[LISTIFY FK CAPTURE] Image slots (variant=${variantName || 'parent'}): ${slots.length}`);
        let captured = 0;
        for (const slot of slots) {
            const m = slot.id.match(/thumbnail_(\d+)/);
            const slotIndex = m ? parseInt(m[1], 10) : 0;
            const img = slot.querySelector('[class*="ProductImageWrapper"] img[src*="flixcart.com"]')
                || slot.querySelector('img[src*="flixcart.com"]');
            const src = img ? img.getAttribute('src') : '';
            if (!src) continue;

            const labelEl = slot.querySelector('[class*="FaddedTitle"]');
            const label = ((labelEl && labelEl.textContent) || 'Image').trim();
            const sectionTitle = getActiveTabTitle();
            const variantTag = variantName ? `_v_${variantName.toLowerCase().replace(/\s+/g, '_').slice(0, 30)}` : '';
            const key = `image${variantTag}_${slotIndex}_${label.toLowerCase().replace(/\s+/g, '_').slice(0, 40)}`;
            const field = {
                label,
                value: src,
                type: 'image',
                id: '', name: '', placeholder: '', selector: '',
                _section: sectionTitle,
                _key: key,
                _slotIndex: slotIndex,
                _variant: variantName || null,
            };
            dbg('image', `[LISTIFY FK CAPTURE]   image captured variant="${variantName || 'parent'}" slot=${slotIndex} label="${label}" url=${src.slice(0, 60)}`);
            if (_storKey) await saveField(field);
            else {
                const idx = _pendingQ.findIndex(f => f._key === key);
                if (idx >= 0) _pendingQ[idx] = field; else _pendingQ.push(field);
            }
            captured++;
        }
        return captured;
    }

    // Watch each rti--container for chip additions/removals so we capture
    // multitext fields the moment the user presses Enter (no Save Template needed).
    const _rtiObserved = new WeakSet();
    function attachMultiTextObservers() {
        if (!isListingPage()) return;
        document.querySelectorAll('.rti--container').forEach((c) => {
            if (_rtiObserved.has(c)) return;
            _rtiObserved.add(c);
            const obs = new MutationObserver(() => {
                const wrapper = c.closest(
                    '[class*="EditAttributeItemWrapper"], [class*="FocusWrapper"]'
                ) || c.parentElement || document.body;
                try { captureMultiTextIn(wrapper); } catch (_) {}
            });
            obs.observe(c, { childList: true, subtree: true });
        });
    }

    // Per-combobox MutationObservers — defence in depth for keyboard-driven
    // value changes that don't fire a [role="option"] click.
    const _comboObserved = new WeakSet();
    function attachComboObservers() {
        if (!isListingPage()) return;
        const combos = document.querySelectorAll('button[role="combobox"]');
        combos.forEach(btn => {
            if (_comboObserved.has(btn)) return;
            _comboObserved.add(btn);
            let _lastText = readComboboxValue(btn);
            const obs = new MutationObserver(() => {
                const txt = readComboboxValue(btn);
                if (txt === _lastText) return;
                _lastText = txt;
                if (!txt || /^select(\s|$)/i.test(txt)) return;
                const wrapper = btn.closest(
                    '[class*="EditAttributeItemWrapper"], [class*="FocusWrapper"]'
                ) || btn.closest('div[role="tabpanel"]') || document.body;
                try { captureComboboxesIn(wrapper); } catch (_) {}
            });
            obs.observe(btn, { childList: true, characterData: true, subtree: true });
        });
    }

    // Debounced attachAll so rapid DOM mutations don't flood calls
    let _attachTimer = null;
    function attachAllDebounced() {
        clearTimeout(_attachTimer);
        _attachTimer = setTimeout(attachAll, 100);
    }

    function startObserver() {
        if (_observer) return;
        _observer = new MutationObserver(attachAllDebounced);
        _observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });
    }

    // Live-capture for combobox value changes — fires when the user picks an
    // option in the popover, or switches tabs (catches values on previously
    // hidden panels). Strictly event-driven; no polling.
    let _lastComboClicked = null;
    document.addEventListener('click', (e) => {
        if (!isListingPage()) return;
        const t = e.target;
        if (!t || !t.closest) return;

        const combo = t.closest('button[role="combobox"]');
        if (combo) { _lastComboClicked = combo; return; }

        if (t.closest('[role="dialog"][popover] [role="option"], [role="dialog"][popover] label, [role="dialog"][popover] input[type="radio"]')) {
            const btn = _lastComboClicked;
            setTimeout(() => {
                if (!btn || !btn.isConnected) return;
                const wrapper = btn.closest(
                    '[class*="EditAttributeItemWrapper"], [class*="FocusWrapper"]'
                ) || btn.closest('div[role="tabpanel"]') || document.body;
                try { captureComboboxesIn(wrapper); } catch (_) {}
            }, 250);
            return;
        }

        if (t.closest('#content-multi-select input[type="checkbox"], #content-multi-select label')) {
            const btn = _lastComboClicked;
            setTimeout(() => {
                if (!btn || !btn.isConnected) return;
                const wrapper = btn.closest(
                    '[class*="EditAttributeItemWrapper"], [class*="FocusWrapper"]'
                ) || btn.closest('div[role="tabpanel"]') || document.body;
                try { captureMultiCheckboxIn(wrapper); } catch (_) {}
            }, 300);
            return;
        }

        if (t.closest('button[role="tab"]')) {
            setTimeout(() => {
                const panel = getActiveTabPanel();
                if (panel) { try { captureComboboxesIn(panel); } catch (_) {} }
            }, 600);
        }
    }, true);


    // ─────────────────────────────────────────────────────
    // TABBED LAYOUT — Flipkart's new "Add a Single Listing" UI
    // splits the form into [role="tab"] panels. Inactive panels
    // are empty in DOM, so we walk through tabs to capture all
    // fields including custom <button role="combobox"> dropdowns.
    // ─────────────────────────────────────────────────────
    function findTabs() {
        return [...document.querySelectorAll('button[role="tab"]')];
    }

    function getTabTitle(tab) {
        const t = tab.querySelector('[class*="Title"]') || tab;
        return (t.textContent || '').replace(/\(\d+\/\d+\)/g, '').replace(/\s+/g, ' ').trim();
    }

    function getActiveTabPanel() {
        return document.querySelector('div[role="tabpanel"]:not([aria-hidden="true"])');
    }

    function readComboboxValue(btn) {
        // Flipkart wraps the selected text in a div with class ButtonText.
        // Prefer that, then any first span/div, then fall back to stripped textContent.
        const direct = btn.querySelector('[class*="ButtonText"]');
        if (direct && direct.textContent.trim()) {
            return direct.textContent.replace(/\s+/g, ' ').trim();
        }
        const child = btn.querySelector('span, div');
        if (child && child.textContent.trim()) {
            return child.textContent.replace(/\s+/g, ' ').trim();
        }
        const clone = btn.cloneNode(true);
        clone.querySelectorAll('svg, title').forEach(n => n.remove());
        return (clone.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function captureComboboxesIn(panel) {
        if (!panel) return;
        const combos = panel.querySelectorAll('button[role="combobox"]');
        // Panel-level summary — only if no label filter (otherwise too noisy)
        if (!_FK_DEBUG_LABELS.length) console.log(`[LISTIFY FK CAPTURE] captureComboboxesIn — found ${combos.length} comboboxes in panel`);
        combos.forEach((btn, i) => {
            const value = readComboboxValue(btn);
            const fkWrapper = btn.closest(
                '[class*="EditAttributeItemWrapper"], [class*="FocusWrapper"]'
            );
            const fkLbl = fkWrapper && fkWrapper.querySelector('[class*="AttributeItemLabelName"]');
            const labelDbg = fkLbl ? fkLbl.textContent.replace(/\s+/g, ' ').trim() : '(no-wrapper-label)';
            dbg(labelDbg, `[LISTIFY FK CAPTURE]   combo[${i}] label="${labelDbg}" value="${value}" wrapper=${!!fkWrapper}`);
            if (!value || /^select(\s|$)/i.test(value)) {
                dbg(labelDbg, `[LISTIFY FK CAPTURE]   combo[${i}] SKIPPED — value is empty or "Select"`);
                return;
            }

            // Multi-select summary like "4 Selected" / "12 Selected" is NOT a
            // real combobox value — it's just a count. Saving it would break
            // fill (autofill would type "4 Selected" into the multiselect).
            // Defer to captureMultiCheckboxIn (fires when user opens the
            // dropdown and ticks/unticks options).
            if (/^\d+\s*Selected$/i.test(value)) {
                dbg(labelDbg, `[LISTIFY FK CAPTURE]   combo[${i}] SKIPPED — multi-select summary "${value}". Open the dropdown so we can read the actual selections.`);
                if (fkWrapper) {
                    try { captureMultiCheckboxIn(fkWrapper); } catch (_) {}
                }
                return;
            }

            // Prefer Flipkart wrapper-based label lookup; fall back to ancestor walk.
            let label = '';
            if (fkLbl) label = fkLbl.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
            if (!label) {
                let p = btn.parentElement;
                for (let i = 0; i < 8 && p; i++) {
                    const lbl = p.querySelector('[class*="AttributeItemLabelName"]');
                    if (lbl) { label = lbl.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim(); break; }
                    p = p.parentElement;
                }
            }
            if (!label) return;

            // Determine field name from radio inputs in popover (e.g. "listing_status_0_value")
            let fieldName = '';
            const radios = btn.parentElement?.querySelectorAll('input[type="radio"][name]');
            if (radios && radios.length) fieldName = radios[0].getAttribute('name') || '';

            const sectionTitle = getActiveTabTitle();
            const sectionPrefix = (sectionTitle && sectionTitle !== '_unknown') ? sectionTitle + '_' : '';
            const key = ('combo_' + sectionPrefix + (fieldName || label)).toLowerCase();

            const field = {
                label, value,
                type:        'combobox',
                id:          '',
                name:        fieldName,
                placeholder: '',
                selector:    '',
                _section:    sectionTitle,
                _key:        key,
            };

            if (!_storKey) {
                const idx = _pendingQ.findIndex(f => f._key === key);
                if (idx >= 0) _pendingQ[idx] = field; else _pendingQ.push(field);
                return;
            }
            saveField(field);
        });
    }

    // ── Multi-text capture ──
    // Flipkart "rti--container" fields hold a list of chips (role="tab" with
    // label/value attrs) plus an input for typing more. Used by Quantity,
    // Items Included, Dosage, etc. We save the full list of chip values.
    function captureMultiTextIn(panel) {
        if (!panel) return;
        const containers = panel.querySelectorAll('.rti--container');
        containers.forEach((c) => {
            const chips = c.querySelectorAll('[role="tab"][label]');
            const values = [...chips].map(ch => (ch.getAttribute('label') || '').trim()).filter(Boolean);
            if (!values.length) return;
            const fkWrapper = c.closest(
                '[class*="EditAttributeItemWrapper"], [class*="FocusWrapper"]'
            );
            const fkLbl = fkWrapper && fkWrapper.querySelector('[class*="AttributeItemLabelName"]');
            const label = fkLbl ? fkLbl.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim() : '';
            if (!label) return;
            const fieldName = c.getAttribute('aria-labelledby') || '';
            const sectionTitle = getActiveTabTitle();
            const sectionPrefix = (sectionTitle && sectionTitle !== '_unknown') ? sectionTitle + '_' : '';
            const key = ('multitext_' + sectionPrefix + (fieldName || label)).toLowerCase();
            const field = {
                label,
                value:       values.join('||'),
                type:        'multitext',
                id:          '',
                name:        fieldName,
                placeholder: '',
                selector:    '',
                _section:    sectionTitle,
                _key:        key,
            };
            dbg(label, `[LISTIFY FK CAPTURE]   multitext label="${label}" values=${JSON.stringify(values)}`);
            if (!_storKey) {
                const idx = _pendingQ.findIndex(f => f._key === key);
                if (idx >= 0) _pendingQ[idx] = field; else _pendingQ.push(field);
                return;
            }
            saveField(field);
        });
    }

    // ── Multi-checkbox capture ──
    // Flipkart multi-select dropdowns use a popover with <input type="checkbox">.
    // When closed, selected values render below the button as
    // .styles__MultiSelectHelperText-sc-... (comma-separated).
    function captureMultiCheckboxIn(panel) {
        if (!panel) return;
        const combos = panel.querySelectorAll('button[role="combobox"]');
        combos.forEach((btn) => {
            const fkWrapper = btn.closest(
                '[class*="EditAttributeItemWrapper"], [class*="FocusWrapper"]'
            );
            if (!fkWrapper) return;
            const helper = fkWrapper.querySelector('[class*="MultiSelectHelperText"]');
            if (!helper) return;
            const raw = (helper.textContent || '').replace(/\s+/g, ' ').trim();
            if (!raw) return;
            const values = raw.split(/\s*,\s*/).map(s => s.trim()).filter(Boolean);
            if (!values.length) return;
            const fkLbl = fkWrapper.querySelector('[class*="AttributeItemLabelName"]');
            const label = fkLbl ? fkLbl.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim() : '';
            if (!label) return;
            const sectionTitle = getActiveTabTitle();
            const sectionPrefix = (sectionTitle && sectionTitle !== '_unknown') ? sectionTitle + '_' : '';
            const key = ('multicheckbox_' + sectionPrefix + label).toLowerCase();
            const field = {
                label,
                value:       values.join('||'),
                type:        'multicheckbox',
                id:          '',
                name:        '',
                placeholder: '',
                selector:    '',
                _section:    sectionTitle,
                _key:        key,
            };
            dbg(label, `[LISTIFY FK CAPTURE]   multicheckbox label="${label}" values=${JSON.stringify(values)}`);
            if (!_storKey) {
                const idx = _pendingQ.findIndex(f => f._key === key);
                if (idx >= 0) _pendingQ[idx] = field; else _pendingQ.push(field);
                return;
            }
            saveField(field);
        });
    }

    function getActiveTabTitle() {
        const active = document.querySelector('button[role="tab"][aria-selected="true"]');
        if (!active) return '_unknown';
        return getTabTitle(active).replace(/\s*\d+\s*Errors?\s*$/i, '').trim() || '_unknown';
    }

    // ── Variant addition tab — capture existing chips ──
    // Each .VariantAttributeWrapper holds one attribute (e.g. "Pack of", "Quantity").
    // Existing chips live in [data-testid^="pillsbar-"][data-testid$="-options"]
    // as <div role="tab" label="..."> elements. We save each (attr, value) pair
    // as type:"variant" so the fill side can recreate them.
    function captureVariantsIn(panel) {
        if (!panel) return 0;
        console.log('[LISTIFY FK CAPTURE] ═══ VARIANT CAPTURE START ═══');
        let saved = 0;
        const skippedAttrs = [];
        const rows = panel.querySelectorAll('[class*="VariantAttributeWrapper"]');
        console.log(`[LISTIFY FK CAPTURE] Variant rows found: ${rows.length}`);
        for (const row of rows) {
            const nameEl = row.querySelector('[class*="AttributeDisplay"]');
            if (!nameEl) { skippedAttrs.push('(no name element)'); continue; }
            const attr = nameEl.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
            if (!attr) { skippedAttrs.push('(empty attr name)'); continue; }
            const chips = row.querySelectorAll('[data-testid^="pillsbar-"][data-testid$="-options"] [role="tab"][label]');
            console.log(`[LISTIFY FK CAPTURE]   "${attr}" → ${chips.length} chip(s):`,
                [...chips].map(c => c.getAttribute('label')));
            if (chips.length === 0) skippedAttrs.push(`${attr} (no chips)`);
            for (const chip of chips) {
                const value = (chip.getAttribute('label') || '').trim();
                if (!value) { console.warn(`[LISTIFY FK CAPTURE]   ⚠ chip with empty label in "${attr}"`); continue; }
                const sectionTitle = getActiveTabTitle();
                const key = `variant_${attr}_${value}`.toLowerCase();
                const field = {
                    label:       attr,
                    value,
                    type:        'variant',
                    id:          '',
                    name:        '',
                    placeholder: '',
                    selector:    '',
                    _section:    sectionTitle,
                    _key:        key,
                };
                if (!_storKey) {
                    const idx = _pendingQ.findIndex(f => f._key === key);
                    if (idx >= 0) _pendingQ[idx] = field; else _pendingQ.push(field);
                } else {
                    saveField(field);
                }
                saved++;
            }
        }
        // Variant Details TABLE — per-row inputs/selects with stable IDs
        // like variant-cell-{rowIdentity}-{attrCode}. The {rowIdentity} can be
        // a number (variant-cell-0-mrp) OR an encoded variant value
        // (variant-cell-pack_of_5_q_1ml_20-mrp). We don't parse — the full ID
        // is what we use to look it up at fill time.
        // Skip sku_id — autofill generates a fresh random per row.
        // Only real form inputs — dropdown <option> elements share the
        // variant-cell-* ID prefix but aren't user-fillable. Their IDs look
        // like variant-cell-{row}-{attr}-opt-{code} (e.g. -opt-AI, -opt-AL),
        // saving them as fields produced 400+ phantom rows on country dropdowns.
        const cellInputs = panel.querySelectorAll(
            'input[id^="variant-cell-"], select[id^="variant-cell-"], textarea[id^="variant-cell-"]'
        );
        let cellSaved = 0, cellSkippedEmpty = 0, cellSkippedSku = 0, cellSkippedOpt = 0;
        for (const el of cellInputs) {
            const id = el.id || '';
            if (id.endsWith('-sku_id')) { cellSkippedSku++; continue; }
            if (id.includes('-opt-')) { cellSkippedOpt++; continue; }
            const dashIdx = id.lastIndexOf('-');
            if (dashIdx < 0) continue;
            const rowIdentity = id.slice('variant-cell-'.length, dashIdx);
            const attrCode = id.slice(dashIdx + 1);
            if (!rowIdentity || !attrCode) continue;
            const value = (el.value || '').trim();
            if (!value) { cellSkippedEmpty++; continue; }
            const sectionTitle = getActiveTabTitle();
            const key = `variant_cell_${rowIdentity}_${attrCode}`;
            const prettyAttr = attrCode.toUpperCase().replace(/_/g, ' ');
            const field = {
                label:       `${prettyAttr} · ${rowIdentity}`,
                value,
                type:        'variant_cell',
                id,
                name:        '',
                placeholder: '',
                selector:    `#${CSS.escape(id)}`,
                _section:    sectionTitle,
                _key:        key,
                _rowIdentity: rowIdentity,
                _attrCode:   attrCode,
            };
            if (!_storKey) {
                const idx = _pendingQ.findIndex(f => f._key === key);
                if (idx >= 0) _pendingQ[idx] = field; else _pendingQ.push(field);
            } else {
                saveField(field);
            }
            cellSaved++;
        }
        saved += cellSaved;
        console.log(`[LISTIFY FK CAPTURE] ═══ VARIANT CAPTURE END — total saved: ${saved} (${saved - cellSaved} chips + ${cellSaved} cells) ═══`);
        return saved;
    }

    async function captureAllTabs() {
        if (!isListingPage()) return { tabs: 0, skipped: 0 };

        const tabs = findTabs();
        if (!tabs.length) return { tabs: 0, skipped: 0 };

        const original = document.querySelector('button[role="tab"][aria-selected="true"]');
        let visited = 0, skipped = 0;

        for (const tab of tabs) {
            const title = getTabTitle(tab);

            tab.click();
            await wait(900);
            await wait(150); // let attachAllDebounced flush

            const panel = getActiveTabPanel();
            if (/variant addition/i.test(title)) {
                // Skip variant capture if the tab is gated by "Fix errors first".
                const txt = (panel?.textContent || '');
                if (/fix errors first/i.test(txt)) {
                    console.log('[LISTIFY FK CAPTURE] Variant tab gated — skipping');
                } else {
                    captureVariantsIn(panel);
                }
            } else if (/image addition/i.test(title)) {
                // Wait extra for slot images to lazy-load after tab switch
                await wait(800);
                try {
                    let captured = await captureImagesIn(panel);
                    // Retry once if no images found — sometimes the CDN <img> tags
                    // mount after a second tick.
                    if (!captured) {
                        await wait(800);
                        captured = await captureImagesIn(getActiveTabPanel() || panel);
                    }
                    console.log(`[LISTIFY FK CAPTURE] Image addition tab — captured ${captured} image(s)`);
                } catch (e) { console.warn('[LISTIFY FK CAPTURE] image capture failed', e); }
            } else {
                // Active panel now contains the inputs — capture comboboxes explicitly
                // (plain inputs auto-captured via MutationObserver → attachAll → captureField)
                captureComboboxesIn(panel);
                captureMultiTextIn(panel);
                captureMultiCheckboxIn(panel);
            }
            visited++;
        }

        if (original) { original.click(); await wait(400); }
        return { tabs: visited, skipped };
    }

    // ─────────────────────────────────────────────────────
    // CAPTURE ALL SECTIONS — opens collapsed sections so the existing
    // attachAll/MutationObserver chain can capture pre-filled values.
    // ─────────────────────────────────────────────────────
    async function captureAllSections() {
        if (!isListingPage()) return { opened: 0, alreadyOpen: 0, skipped: 0 };

        const cards = findAllSectionCards();
        let opened = 0, alreadyOpen = 0, skipped = 0;

        for (const card of cards) {
            if (isSectionOpen(card)) { alreadyOpen++; continue; }

            const editBtn = findEditButtonIn(card);
            if (!editBtn) { skipped++; continue; }

            editBtn.click();
            await wait(900);
            await wait(150); // give attachAllDebounced (100ms) room to flush
            opened++;

            const cancelBtn = findCancelButtonIn(card);
            if (cancelBtn) {
                cancelBtn.click();
                await wait(400);
            }
        }

        return { opened, alreadyOpen, skipped };
    }

    // ─────────────────────────────────────────────────────
    // MESSAGE HANDLER
    // ─────────────────────────────────────────────────────
    chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {

        if (req.action === 'get_tab_category') {
            const fromSession = sessionStorage.getItem('listify_tab_category') || '';
            const vertical    = sessionStorage.getItem('listify_tab_vertical') || '';
            const brand       = sessionStorage.getItem('listify_tab_brand') || '';
            if (fromSession) {
                sendResponse({ category: fromSession, vertical, brand });
                return false;
            }
            chrome.runtime.sendMessage({ action: 'get_tab_category_bg' }, (res) => {
                const cat = res?.category || '';
                if (cat) sessionStorage.setItem('listify_tab_category', cat);
                if (res?.vertical) sessionStorage.setItem('listify_tab_vertical', res.vertical);
                if (res?.brand) sessionStorage.setItem('listify_tab_brand', res.brand);
                sendResponse({
                    category: cat,
                    vertical: res?.vertical || vertical,
                    brand:    res?.brand || brand,
                });
            });
            return true;
        }

        // Popup sends tabId directly — most reliable path
        if (req.action === 'fk_set_tab_id') {
            initStorKey(req.tabId);
            sendResponse({ ok: true });
            return false;
        }

        if (req.action === 'fk_clear_buffer') {
            // background.js handles the actual storage removal (we can't access storage from iframes)
            _pendingQ = [];
            sendResponse({ ok: true });
            return false;
        }

        if (req.action === 'fk_capture_all_sections') {
            const useTabs = findTabs().length > 0;
            const fn = useTabs ? captureAllTabs : captureAllSections;
            fn()
                .then(stats => sendResponse({ ok: true, layout: useTabs ? 'tabs' : 'cards', ...stats }))
                .catch(e => sendResponse({ ok: false, error: e.message }));
            return true; // async response
        }
    });

})();
