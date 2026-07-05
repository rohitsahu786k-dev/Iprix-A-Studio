; (function () {
    if (window.__listifyFkAutofill) return;
    window.__listifyFkAutofill = true;

    if (window !== window.top) return;
    if (!window.location.hostname.includes('seller.flipkart.com')) return;

    console.log('[LISTIFY FK AUTOFILL] Loaded');

    // Section-scoped logger for "Price, Stock and Shipping Information".
    // Other sections keep their existing console.* prefixes for now.
    const pssLog = (self.LisstifyLog && self.LisstifyLog.create)
        ? self.LisstifyLog.create('FK-PRICE/STOCK', '#10b981')
        : { debug: () => {}, info: console.log, log: console.log, warn: console.warn, error: console.error };

    // Focused logger for Package Details (Length / Breadth / Height / Weight).
    const pkgLog = (self.LisstifyLog && self.LisstifyLog.create)
        ? self.LisstifyLog.create('FK-PKG', '#f59e0b')
        : { debug: () => {}, info: console.log, log: console.log, warn: console.warn, error: console.error };

    const _PKG_LABELS = ['length', 'breadth', 'height', 'weight'];
    function _isPkgField(label) {
        const l = String(label || '').toLowerCase().trim();
        return _PKG_LABELS.some(p => l === p || l.startsWith(p + ' ') || l.endsWith(' ' + p));
    }

    // Debug-log filter for per-field fill logs (FILL / MULTITEXT / MULTICHECK
    // / COMBO / PLAIN). When non-empty, only fields whose label matches one of
    // these substrings (case-insensitive) print verbose logs. Workflow-level
    // logs (tab summaries, NOT FILLED list) always print.
    // Set to [] to log every field.
    const _FK_DEBUG_LABELS = ['color', 'sleeve', 'fabric', 'fit', 'image'];
    function dbg(label, level, ...args) {
        if (level === 'warn' || level === 'error' || !_FK_DEBUG_LABELS.length) { (console[level] || console.log)(...args); return; }
        const l = String(label || '').toLowerCase();
        if (_FK_DEBUG_LABELS.some(x => l.includes(x))) (console[level] || console.log)(...args);
    }

    // Only log unexpected redirect OUT of Flipkart during an active fill (real logout signal).
    // Noisy beforeunload warning was removed — it fired on every normal navigation.
    const _navObserver = new MutationObserver(() => {
        const url = window.location.href;
        if (window.__listify_fk_is_filling && !url.includes('seller.flipkart.com')) {
            console.error('[LISTIFY FK] REDIRECTED OUT of Flipkart during fill → URL:', url,
                '| last_action:', window.__listify_fk_last_action || 'none');
        }
    });
    _navObserver.observe(document.documentElement, { childList: true, subtree: false });

    function logButtonClick(label, btn) {
        window.__listify_fk_last_action = label;
    }

    // ─────────────────────────────────────────────────────
    // REACT-COMPATIBLE VALUE SETTERS
    // Direct .value = x doesn't trigger React's synthetic
    // events — must use the native descriptor setter.
    // ─────────────────────────────────────────────────────
    const inputSetter    = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,  'value')?.set;
    const selectSetter   = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
    const textareaSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;

    function setReactValue(el, value) {
        try {
            if (el.tagName === 'SELECT') {
                if (selectSetter) selectSetter.call(el, value);
                else el.value = value;
                el.dispatchEvent(new Event('change', { bubbles: true }));

            } else if (el.tagName === 'TEXTAREA') {
                if (textareaSetter) textareaSetter.call(el, value);
                else el.value = value;
                el.dispatchEvent(new Event('input',  { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));

            } else if (el.type === 'checkbox') {
                el.checked = Boolean(value);
                el.dispatchEvent(new Event('change', { bubbles: true }));

            } else {
                if (inputSetter) inputSetter.call(el, String(value));
                else el.value = String(value);
                el.dispatchEvent(new Event('input',  { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.dispatchEvent(new Event('blur',   { bubbles: true }));
            }
            return true;
        } catch (e) {
            console.warn('[LISTIFY FK AUTOFILL] setReactValue error:', e);
            return false;
        }
    }

    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ─────────────────────────────────────────────────────
    // FIND INPUT ELEMENT for a saved field
    // Priority: selector → id → name → placeholder
    // ─────────────────────────────────────────────────────
    function findElement(field) {
        // selector (#id or [name="..."])
        if (field.selector) {
            try {
                const el = document.querySelector(field.selector);
                if (el) return el;
            } catch (_) {}
        }
        // id
        if (field.id) {
            const el = document.getElementById(field.id);
            if (el) return el;
        }
        // name attribute
        if (field.name) {
            const el = document.querySelector(`[name="${CSS.escape(field.name)}"]`);
            if (el) return el;
        }
        // placeholder (trimmed exact match)
        if (field.placeholder) {
            const el = document.querySelector(`[placeholder="${CSS.escape(field.placeholder)}"]`);
            if (el) return el;
        }
        return null;
    }

    // ─────────────────────────────────────────────────────
    // FIND SECTION CONTAINER by title text
    // ─────────────────────────────────────────────────────
    function findSectionByTitle(title) {
        if (!title || title === '_unknown') return null;

        const normalise = t => t.replace(/\(\d+\/\d+\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
        const target    = normalise(title);

        // Fast path: Flipkart attribute card layout — div[height="min"] cards
        // Each card has a title span and an EDIT/SAVE button. Matching here
        // returns the full card so SAVE buttons inside the expanded form are found.
        for (const card of document.querySelectorAll('div[height="min"]')) {
            for (const span of card.querySelectorAll('span')) {
                if (span.children.length === 0 && normalise(span.textContent) === target) {
                    return card;
                }
            }
        }

        // Walk headings (most reliable for non-card layouts)
        for (const el of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
            if (normalise(el.textContent) === target) {
                let p = el.parentElement;
                for (let i = 0; i < 10; i++) {
                    if (!p || p === document.body) break;
                    const btns = [...p.querySelectorAll('button,[role="button"]')]
                        .map(b => (b.textContent || '').trim().toUpperCase());
                    if (btns.includes('EDIT') || btns.includes('SAVE') || btns.includes('CANCEL')) return p;
                    p = p.parentElement;
                }
            }
        }

        // Fallback: any short-text element whose text matches
        for (const el of document.querySelectorAll('div,span,p')) {
            if (el.children.length > 5) continue;
            if (normalise(el.textContent) === target) {
                let p = el.parentElement;
                for (let i = 0; i < 10; i++) {
                    if (!p || p === document.body) break;
                    const btns = [...p.querySelectorAll('button,[role="button"]')]
                        .map(b => (b.textContent || '').trim().toUpperCase());
                    if (btns.includes('EDIT') || btns.includes('SAVE') || btns.includes('CANCEL')) return p;
                    p = p.parentElement;
                }
            }
        }
        return null;
    }

    function isSectionOpen(sectionEl) {
        return [...sectionEl.querySelectorAll('button,[role="button"]')]
            .some(b => (b.textContent || '').trim().toUpperCase() === 'SAVE');
    }

    function findEditButton(sectionEl) {
        const byClass = sectionEl.querySelector('button.hTTPSU[data-testid="button"]');
        if (byClass) return byClass;
        return [...sectionEl.querySelectorAll('button,[role="button"]')]
            .find(b => (b.textContent || '').trim().toUpperCase() === 'EDIT') || null;
    }

    // Section-level SAVE button (inside a section container, NOT the modal confirm).
    // Identified by DOM position — it lives inside the section card, not in a floating modal.
    function findSectionSaveBtn(sectionEl) {
        return [...sectionEl.querySelectorAll('button[data-testid="button"]')]
            .find(b => (b.textContent || '').trim().toUpperCase() === 'SAVE') || null;
    }

    // Any section-level SAVE on the full page (used for _unknown sections).
    // Must be inside a div[height="min"] card — not a floating modal button.
    function findPageSaveBtn() {
        return [...document.querySelectorAll('div[height="min"] button[data-testid="button"]')]
            .find(b => (b.textContent || '').trim().toUpperCase() === 'SAVE') || null;
    }

    // Any EDIT button on the full page (used for _unknown sections)
    function findPageEditBtn() {
        return document.querySelector('button.hTTPSU[data-testid="button"]') || null;
    }

    function waitForModalSaveBtn(timeoutMs = 5000) {
        return new Promise((resolve) => {
            // The modal confirm SAVE is outside any div[height="min"] section card.
            // Using DOM position instead of minified class names that change on deploys.
            function findBtn() {
                return [...document.querySelectorAll('button[data-testid="button"]')]
                    .find(b =>
                        (b.textContent || '').trim().toLowerCase() === 'save' &&
                        !b.closest('div[height="min"]')
                    ) || null;
            }

            const existing = findBtn();
            if (existing) return resolve(existing);
            const timer = setTimeout(() => {
                observer.disconnect();
                console.warn('[LISTIFY FK] Modal SAVE button timed out');
                resolve(null);
            }, timeoutMs);
            const observer = new MutationObserver(() => {
                const btn = findBtn();
                if (btn) {
                    observer.disconnect();
                    clearTimeout(timer);
                    resolve(btn);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    // ─────────────────────────────────────────────────────
    // FILL A SINGLE SECTION
    // ─────────────────────────────────────────────────────
    async function fillSection(title, fields) {
        let sectionEl = null;
        let opened = false;

        if (title === '_unknown') {
            // Click the next available EDIT button on the page
            const editBtn = findPageEditBtn();
            console.log(`[LISTIFY FK] _unknown — page EDIT button:`, editBtn);
            if (editBtn) {
                logButtonClick('PAGE EDIT (_unknown)', editBtn);
                editBtn.click();
                console.log(`[LISTIFY FK] ✅ Clicked page EDIT for _unknown section`);
                await wait(900);
                opened = true;
            } else {
                console.warn(`[LISTIFY FK] ❌ No EDIT button found on page for _unknown section`);
            }
        } else {
            sectionEl = findSectionByTitle(title);
            console.log(`[LISTIFY FK] sectionEl found:`, !!sectionEl, sectionEl);
            if (sectionEl) {
                const alreadyOpen = isSectionOpen(sectionEl);
                console.log(`[LISTIFY FK] Section already open:`, alreadyOpen);
                if (!alreadyOpen) {
                    const editBtn = findEditButton(sectionEl);
                    console.log(`[LISTIFY FK] EDIT button:`, editBtn);
                    if (editBtn) {
                        logButtonClick(`EDIT "${title}"`, editBtn);
                        editBtn.click();
                        console.log(`[LISTIFY FK] ✅ Clicked EDIT for "${title}"`);
                        await wait(900);
                        opened = true;
                    } else {
                        console.warn(`[LISTIFY FK] ❌ No EDIT button found in section "${title}"`);
                    }
                } else {
                    opened = true;
                    console.log(`[LISTIFY FK] Section "${title}" was already open`);
                }
            } else {
                console.warn(`[LISTIFY FK] ❌ Section not found on page: "${title}"`);
            }
        }

        let filled = 0;
        let missed = 0;

        for (const field of fields) {
            const el = findElement(field);
            if (!el) {
                console.warn(`[LISTIFY FK] ❌ Input not found:`, { label: field.label, name: field.name, placeholder: field.placeholder, id: field.id });
                missed++;
                continue;
            }
            // Skip Flipkart nav menu inputs (Log Out, Switch Account, etc.)
            if (el.id && el.id.startsWith('checkMarkOption_')) {
                console.warn(`[LISTIFY FK] ⚠ Skipping nav menu input "${field.label || field.name}"`);
                continue;
            }
            const ok = setReactValue(el, field.value);
            if (ok) {
                filled++;
                console.log(`[LISTIFY FK] ✅ Filled "${field.label || field.name}" = "${field.value}"`);
            } else {
                console.warn(`[LISTIFY FK] ❌ setReactValue failed for "${field.label || field.name}"`);
                missed++;
            }
            await wait(40);
        }

        console.log(`[LISTIFY FK] Fields done — filled: ${filled}, missed: ${missed}`);

        if (opened && title !== '_unknown') {
            const sectionSaveBtn = (sectionEl ? findSectionSaveBtn(sectionEl) : null)
                || findPageSaveBtn();
            if (sectionSaveBtn) {
                logButtonClick(`SECTION SAVE "${title}"`, sectionSaveBtn);
                sectionSaveBtn.click();
                await wait(600);
            } else {
                console.warn(`[LISTIFY FK] ❌ Section SAVE button not found for "${title}"`);
            }

            const modalSaveBtn = await waitForModalSaveBtn(5000);
            if (modalSaveBtn) {
                logButtonClick(`MODAL SAVE "${title}"`, modalSaveBtn);
                modalSaveBtn.click();
                await wait(1000);
            } else {
                console.warn(`[LISTIFY FK] ❌ Modal SAVE not found for "${title}"`);
            }
        }

        return { filled, missed, opened };
    }

    // ─────────────────────────────────────────────────────
    // CLICK TOP-LEVEL EDIT BUTTON
    // ─────────────────────────────────────────────────────
    function findTopLevelEditBtn() {
        const byClass = document.querySelector('button.hTTPSU[data-testid="button"]');
        const byText  = [...document.querySelectorAll('button[data-testid="button"]')]
            .find(b => b.textContent.trim().toUpperCase() === 'EDIT') || null;
        return byClass || byText || null;
    }

    async function clickTopLevelEditIfNeeded() {
        const btn = findTopLevelEditBtn();
        if (!btn) return;
        btn.click();
        await wait(1000);
    }

    // ─────────────────────────────────────────────────────
    // NORMALISE a section title for comparison
    // ─────────────────────────────────────────────────────
    function normaliseTitle(t) {
        return (t || '').replace(/\(\d+\/\d+\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    // ─────────────────────────────────────────────────────
    // TABBED LAYOUT FILL — used when Flipkart renders the
    // form as [role="tab"] panels (no per-section EDIT/SAVE).
    // ─────────────────────────────────────────────────────
    function findTabs() {
        return [...document.querySelectorAll('button[role="tab"]')];
    }

    function tabTitle(tab) {
        const t = tab.querySelector('[class*="Title"]') || tab;
        return (t.textContent || '').replace(/\(\d+\/\d+\)/g, '').replace(/\s+/g, ' ').trim();
    }

    function getActiveTabPanel() {
        return document.querySelector('div[role="tabpanel"]:not([aria-hidden="true"])');
    }

    async function setComboboxValue(btn, value) {
        if (!btn || !value) return false;
        try {
            btn.click();
            // Poll for the popover (up to ~1.2s)
            const target = String(value).trim().toLowerCase();
            let pop = null;
            for (let i = 0; i < 12 && !pop; i++) {
                await wait(100);
                pop = findOpenPopoverFor(btn);
            }
            if (!pop) {
                console.warn('[LISTIFY FK] combobox: popover never opened for', value);
                return false;
            }

            // 1) Try radios with data-label
            const radios = pop.querySelectorAll('input[type="radio"]');
            for (const r of radios) {
                const dl = (r.getAttribute('data-label') || '').trim().toLowerCase();
                if (dl && dl === target) {
                    const lbl = pop.querySelector(`label[for="${CSS.escape(r.id)}"]`);
                    (lbl || r).click();
                    await wait(200);
                    return true;
                }
            }
            // 2) Match by visible <label> text
            for (const lbl of pop.querySelectorAll('label')) {
                const txt = (lbl.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
                if (txt === target) { lbl.click(); await wait(200); return true; }
            }
            // 3) Partial / startsWith match (e.g. saved "Active" vs popover "ACTIVE - listed")
            for (const lbl of pop.querySelectorAll('label')) {
                const txt = (lbl.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
                if (txt.startsWith(target) || target.startsWith(txt)) { lbl.click(); await wait(200); return true; }
            }
            // 4) Any clickable [role="option"]
            for (const opt of pop.querySelectorAll('[role="option"]')) {
                const txt = (opt.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
                if (txt === target || txt.startsWith(target)) { opt.click(); await wait(200); return true; }
            }
            console.warn('[LISTIFY FK] combobox: no option matched', JSON.stringify(value),
                '— popover labels:', [...pop.querySelectorAll('label')].map(l => l.textContent.trim()).slice(0, 20));
            document.body.click();
            return false;
        } catch (e) {
            console.warn('[LISTIFY FK] setComboboxValue error:', e);
            return false;
        }
    }

    function findOpenPopoverFor(btn) {
        // Try local sibling first
        const local = btn.parentElement?.querySelector('[role="dialog"]');
        if (local) {
            try { if (local.matches(':popover-open')) return local; } catch (_) {}
            // Even without :popover-open support, if it has visible options it's the one
            if (local.querySelector('input[type="radio"], label, [role="option"]')) return local;
        }
        // Any globally open popover
        const all = [...document.querySelectorAll('[role="dialog"]')];
        for (const p of all) {
            try { if (p.matches(':popover-open')) return p; } catch (_) {}
        }
        // Last resort: most recently mounted dialog with options
        for (const p of all.reverse()) {
            if (p.querySelector('input[type="radio"], label, [role="option"]')) return p;
        }
        return null;
    }

    // Find all field wrappers in the active panel that have the given label.
    // Returns an array — multiple matches mean repeated labels (e.g. "Length" L/W/H/Wt).
    function findWrappersByLabel(panel, labelText) {
        const target = (labelText || '').replace(/\*/g, '').trim().toLowerCase();
        if (!target) return [];
        const wrappers = [...panel.querySelectorAll(
            '[class*="EditAttributeItemWrapper"], [class*="FocusWrapper"]'
        )];

        // Pass 1: exact label-text match. Multi-input wrappers (Package
        // Details: Length/Breadth/Height/Weight share one wrapper) carry
        // several label nodes — check ALL of them, not just the first.
        const exact = [];
        for (const w of wrappers) {
            const lbls = w.querySelectorAll('[class*="AttributeItemLabelName"]');
            for (const lbl of lbls) {
                const text = lbl.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
                if (text === target) { exact.push(w); break; }
            }
        }
        if (exact.length) return exact;

        // Pass 2: fallback — match by input's placeholder / name / aria-label.
        // Older templates saved placeholder text ("Search for SKU ID", "Enter Brand Name")
        // or input name ("string") as the label, so try those attributes here.
        const fallback = [];
        for (const w of wrappers) {
            const inputs = w.querySelectorAll('input:not([type="hidden"]):not([type="file"]):not([id="checkmarkgroup-search"]):not([id^="checkbox-tree-"]), textarea');
            for (const inp of inputs) {
                const ph = (inp.getAttribute('placeholder') || '').trim().toLowerCase();
                const nm = (inp.getAttribute('name') || '').trim().toLowerCase();
                const al = (inp.getAttribute('aria-label') || '').trim().toLowerCase();
                if (ph === target || nm === target || al === target) {
                    fallback.push(w);
                    break;
                }
            }
        }
        return fallback;
    }

    async function fillFieldInActivePanel(field, usedWrappers) {
        const isPkg = _isPkgField(field.label);
        const panel = getActiveTabPanel();
        if (!panel) {
            if (isPkg) pkgLog.error(`✗ "${field.label}" — no active tab panel`);
            dbg(field.label, 'warn', `[LISTIFY FK FILL] no active panel for "${field.label}"`);
            return false;
        }

        const wrappers = findWrappersByLabel(panel, field.label);
        if (!wrappers.length) {
            if (isPkg) pkgLog.error(`✗ "${field.label}" — NO WRAPPER FOUND on active panel (label not on page or different text). type=${field.type}`);
            dbg(field.label, 'warn', `[LISTIFY FK FILL] no wrapper for label "${field.label}" type=${field.type}`);
            return false;
        }
        if (isPkg) pkgLog.info(`◷ "${field.label}" — found ${wrappers.length} wrapper(s) on active panel, type=${field.type}`);

        const fieldType = field.type || 'text';
        const isPlainType = !['combobox', 'multitext', 'multicheckbox', 'checkbox', 'image'].includes(fieldType);
        // Allow combobox + plain-input on the same wrapper (compound fields like
        // Maximum Shelf Life: number input + unit combobox in one wrapper).
        // For plain inputs, also allow re-using a wrapper that still has
        // unfilled inputs (Package Details share one wrapper with L/B/H/Wt).
        const wrapperRec = (w) => usedWrappers.get(w) || { types: new Set(), inputs: new Set() };
        const plainInputCount = (w) => [...w.querySelectorAll(
            'input:not([type="hidden"]):not([type="file"]):not([id="checkmarkgroup-search"]):not([id^="checkbox-tree-"]),textarea'
        )].filter(e => !e.closest('[role="combobox"], [role="dialog"]') && !(e.readOnly && e.tagName === 'INPUT')).length;
        const wrapper = wrappers.find(w => {
            const rec = wrapperRec(w);
            if (isPlainType) return rec.inputs.size < plainInputCount(w);
            return !rec.types.has(fieldType);
        });
        if (!wrapper) {
            dbg(field.label, 'warn', `[LISTIFY FK FILL] all wrappers exhausted for "${field.label}" (type=${fieldType}, candidates=${wrappers.length})`);
            return false;
        }
        if (!usedWrappers.has(wrapper)) usedWrappers.set(wrapper, { types: new Set(), inputs: new Set() });
        usedWrappers.get(wrapper).types.add(fieldType);
        dbg(field.label, 'log', `[LISTIFY FK FILL] → "${field.label}" type=${fieldType} value=${JSON.stringify(field.value).slice(0,80)}`);

        if (field.type === 'multitext') {
            const container = wrapper.querySelector('.rti--container');
            if (!container) {
                dbg(field.label, 'warn', `[LISTIFY FK MULTITEXT] no .rti--container for "${field.label}"`);
                return false;
            }
            // Some chip fields (e.g. sales_package / Items Included) hide the
            // <input> until the container is clicked. Activate edit mode.
            const labelledBy = container.getAttribute('aria-labelledby') || '';
            const activate = () => {
                try { container.scrollIntoView({ block: 'center' }); } catch (_) {}
                try { container.click(); } catch (_) {}
                try { (container.parentElement || container).click(); } catch (_) {}
            };
            const findInput = () => {
                // 1. Inside .rti--container
                let el = container.querySelector('input.rti--input, input[type="text"]');
                if (el) return el;
                // 2. Match by aria-labelledby on the input
                if (labelledBy) {
                    el = wrapper.querySelector(`input[aria-labelledby="${labelledBy}"]`);
                    if (el) return el;
                }
                // 3. Anywhere in the wrapper that isn't a known unrelated input
                el = wrapper.querySelector('input.rti--input');
                if (el) return el;
                el = wrapper.querySelector('input[type="text"]:not([id="checkmarkgroup-search"]):not([id^="checkbox-tree-"]):not([readonly])');
                if (el) return el;
                // 4. Fallback — any text input in the wrapper
                return wrapper.querySelector('input:not([type="hidden"]):not([readonly])');
            };
            let input = findInput();
            if (!input) {
                dbg(field.label, 'warn', `[LISTIFY FK MULTITEXT] no input for "${field.label}" — activating container`);
                activate();
                await wait(120);
                input = findInput();
            }
            if (!input) {
                dbg(field.label, 'warn', `[LISTIFY FK MULTITEXT] still no input for "${field.label}" after activation. labelledBy=${labelledBy} wrapper html len=${wrapper.innerHTML.length}`);
                return false;
            }
            dbg(field.label, 'log', `[LISTIFY FK MULTITEXT] found input for "${field.label}":`, input.outerHTML.slice(0, 200));
            const chipSet = () => new Set(
                [...container.querySelectorAll('[role="tab"][label]')]
                    .map(c => (c.getAttribute('label') || '').trim().toLowerCase())
            );
            const values = String(field.value || '').split('||').map(s => s.trim()).filter(Boolean);
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            const fireKey = (target, type) => {
                const ev = new KeyboardEvent(type, { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true });
                try { Object.defineProperty(ev, 'keyCode',  { get: () => 13 }); } catch (_) {}
                try { Object.defineProperty(ev, 'which',    { get: () => 13 }); } catch (_) {}
                try { Object.defineProperty(ev, 'charCode', { get: () => type === 'keypress' ? 13 : 0 }); } catch (_) {}
                target.dispatchEvent(ev);
            };

            // Type one character — beforeinput + value-setter + input event.
            // react-tag-input's onChange reads .value from the input event,
            // so we mutate the value before dispatching `input`.
            const typeChar = async (el, ch) => {
                const cur = el.value || '';
                const next = cur + ch;
                try {
                    const bi = new InputEvent('beforeinput', {
                        bubbles: true, cancelable: true, inputType: 'insertText', data: ch
                    });
                    el.dispatchEvent(bi);
                } catch (_) {}
                setter.call(el, next);
                try {
                    const ie = new InputEvent('input', {
                        bubbles: true, cancelable: false, inputType: 'insertText', data: ch
                    });
                    el.dispatchEvent(ie);
                } catch (_) {
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                }
                await wait(15);
            };

            // Commit one chip with verify+retry. Simulates real typing
            // (per-char beforeinput/input) then fires Enter.
            const commitOne = async (v) => {
                const lower = v.toLowerCase();
                for (let attempt = 0; attempt < 3; attempt++) {
                    let el = findInput();
                    if (!el) {
                        activate();
                        await wait(120);
                        el = findInput();
                    }
                    if (!el) return false;
                    try { el.scrollIntoView({ block: 'center' }); } catch (_) {}
                    try { el.click(); } catch (_) {}
                    el.focus();
                    await wait(40);
                    // clear any stale value
                    if (el.value) {
                        setter.call(el, '');
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        await wait(20);
                    }
                    // type each character
                    for (const ch of v) await typeChar(el, ch);
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    await wait(120 + attempt * 60);
                    // commit via Enter on input AND on form (some impls listen on form)
                    fireKey(el, 'keydown');
                    fireKey(el, 'keypress');
                    fireKey(el, 'keyup');
                    const form = el.form || el.closest('form');
                    if (form) {
                        fireKey(form, 'keydown');
                        try { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); } catch (_) {}
                    }
                    await wait(180 + attempt * 100);
                    if (chipSet().has(lower)) return true;
                    // Some chip libs commit on blur — try that too
                    try { el.dispatchEvent(new FocusEvent('blur', { bubbles: true })); } catch (_) {}
                    el.blur();
                    await wait(140);
                    if (chipSet().has(lower)) return true;
                }
                return false;
            };

            const before = chipSet();
            dbg(field.label, 'log', `[LISTIFY FK MULTITEXT] "${field.label}" wanted=${JSON.stringify(values)} existing=${JSON.stringify([...before])}`);
            for (const v of values) {
                if (before.has(v.toLowerCase())) continue;
                const ok = await commitOne(v);
                if (ok) dbg(field.label, 'log', `[LISTIFY FK MULTITEXT]   ✓ "${v}"`);
                else dbg(field.label, 'warn', `[LISTIFY FK MULTITEXT]   ✗ "${v}" after 3 attempts`);
            }
            const finalEl = findInput();
            if (finalEl) finalEl.blur();
            return true;
        }

        if (field.type === 'multicheckbox') {
            const cb = wrapper.querySelector('button[role="combobox"]');
            if (!cb) {
                dbg(field.label, 'warn', `[LISTIFY FK MULTICHECK] no combobox for "${field.label}"`);
                return false;
            }
            const wanted = String(field.value || '').split('||').map(s => s.trim().toLowerCase()).filter(Boolean);
            if (!wanted.length) return false;
            dbg(field.label, 'log', `[LISTIFY FK MULTICHECK] "${field.label}" wanted=${JSON.stringify(wanted)}`);

            // ── Pre-check: if the helper text already contains all wanted values,
            // the field is already filled — skip the popover entirely.
            const _helperEl = wrapper.querySelector('[class*="MultiSelectHelperText"]');
            if (_helperEl) {
                const _helperVals = (_helperEl.textContent || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                const _alreadyFilled = wanted.every(w => _helperVals.some(h => h === w || h.startsWith(w) || w.startsWith(h)));
                if (_alreadyFilled) {
                    dbg(field.label, 'log', `[LISTIFY FK MULTICHECK] "${field.label}" already filled: ${JSON.stringify(_helperVals)}`);
                    return true;
                }
            }

            // ── Broadened selector for finding the multiselect popover/dialog
            const _popoverSel = '#content-multi-select, div[role="dialog"][id*="multi-select"], div[role="dialog"][class*="multi-select" i], [popover]';

            // ── Scan the whole document for any visible checkbox container
            const _scanDom = () => {
                const _seen = new Set();
                for (const _cbEl of document.querySelectorAll('input[type="checkbox"]')) {
                    const _r = _cbEl.getBoundingClientRect();
                    if (_r.width === 0 && _r.height === 0) continue;
                    let _c = _cbEl.parentElement;
                    while (_c && _c !== document.documentElement && !_seen.has(_c)) {
                        const _cr = _c.getBoundingClientRect();
                        if (_cr.height > 40 && _cr.width > 80) {
                            _seen.add(_c);
                            const _sig = [..._c.querySelectorAll('input[type="checkbox"]')]
                                .map(i => i.getAttribute('value') || i.id || '').join('|');
                            if (_sig) return _c;
                            break;
                        }
                        _c = _c.parentElement;
                    }
                }
                return null;
            };

            // ── Find any visible popover/dialog or fallback to scanning the DOM
            const _getVisiblePopover = () => {
                for (const el of document.querySelectorAll(_popoverSel)) {
                    const r = el.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0) return el;
                }
                return _scanDom();
            };

            // ── Signature of any pre-existing visible popover so we can detect when our click
            // causes the shared #content-multi-select to load THIS field's options.
            const _preEl = _getVisiblePopover();
            const _preSig = _preEl
                ? [..._preEl.querySelectorAll('input[type="checkbox"]')].map(i => i.getAttribute('value') || i.id || '').join('|')
                : '';

            // ── Click via React fiber handler (onMouseDown/onClick) AND native DOM events.
            // Flipkart may check event.isTrusted; as a last resort we also try page-world
            // script injection which runs the events inside the page's own JS context.
            const _fireClick = (el) => {
                // Direct fiber handler
                const _fk = Object.keys(el).find(k => /^__reactFiber|^__reactInternalInstance/.test(k));
                if (_fk) {
                    let _f = el[_fk];
                    while (_f) {
                        for (const _prop of ['onMouseDown', 'onClick']) {
                            const _h = _f?.memoizedProps?.[_prop];
                            if (typeof _h === 'function') {
                                try { _h({ type: _prop === 'onMouseDown' ? 'mousedown' : 'click', target: el, currentTarget: el, preventDefault() {}, stopPropagation() {}, persist() {}, nativeEvent: new MouseEvent('click', { bubbles: true }) }); } catch (_e) {}
                            }
                        }
                        if (_f?.memoizedProps?.onMouseDown || _f?.memoizedProps?.onClick) break;
                        _f = _f?.return;
                    }
                }
                // Native DOM events
                try { el.focus(); } catch (_e) {}
                el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
                el.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, cancelable: true, view: window }));
                el.dispatchEvent(new MouseEvent('click',     { bubbles: true, cancelable: true, view: window }));
            };

            // ── Page-world injection: run click inside the page's own JS context so
            // Event.isTrusted can be temporarily overridden. Falls back gracefully if CSP blocks it.
            const _fireClickInPageWorld = (el) => {
                try {
                    const _attr = 'data-l-tmp-' + Date.now();
                    el.setAttribute(_attr, '1');
                    const sc = document.createElement('script');
                    sc.textContent = `(()=>{try{
                        var t=document.querySelector('[${_attr}]');
                        if(!t)return;
                        var d=Object.getOwnPropertyDescriptor(Event.prototype,'isTrusted');
                        if(d&&d.configurable)Object.defineProperty(Event.prototype,'isTrusted',{get(){return true;},configurable:true});
                        try{t.focus();}catch(_){}
                        t.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,view:window}));
                        t.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true,view:window}));
                        t.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
                        if(d&&d.configurable)Object.defineProperty(Event.prototype,'isTrusted',d);
                    }catch(e){}})();`;
                    (document.head || document.documentElement).appendChild(sc);
                    sc.remove();
                    el.removeAttribute(_attr);
                } catch (_e) {}
            };

            const _dispatchEscape = () => {
                const _esc = () => new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
                document.dispatchEvent(_esc()); window.dispatchEvent(_esc()); document.body.dispatchEvent(_esc());
            };

            // ── Close any active popovers/dialogs by simulating a click outside and dispatching Escape
            const _closeActivePopover = async () => {
                const _epClose = _getVisiblePopover();
                if (_epClose && typeof _epClose.hidePopover === 'function') {
                    try { _epClose.hidePopover(); } catch (_) {}
                }
                _dispatchEscape();

                // Dispatch click outside to trigger React click-outside handlers
                try {
                    const opts = { bubbles: true, cancelable: true, view: window };
                    const target = document.body || document.documentElement;
                    target.dispatchEvent(new MouseEvent('mousedown', opts));
                    target.dispatchEvent(new MouseEvent('mouseup', opts));
                    target.dispatchEvent(new MouseEvent('click', opts));
                    document.body.click();
                } catch (_) {}

                await wait(300);
            };

            // ── Phase 1: click and wait for the correct field popover to appear.
            // Two passes: first with normal events, then with page-world injection after closing stale ones.
            let popover = null;
            for (let _pass = 0; _pass < 2 && !popover; _pass++) {
                if (_pass === 0) _fireClick(cb);
                else {
                    await _closeActivePopover();
                    _fireClickInPageWorld(cb);
                }

                // Watch for newly added nodes (React portal pattern)
                let _moFound = null;
                const _mo = new MutationObserver(recs => {
                    if (_moFound) return;
                    for (const rec of recs) {
                        for (const nd of rec.addedNodes) {
                            if (nd.nodeType !== 1) continue;
                            if (nd.querySelector('input[type="checkbox"]')) { _moFound = nd; return; }
                        }
                    }
                });
                _mo.observe(document.body, { childList: true, subtree: false });

                for (let _pi = 0; _pi < 25 && !popover; _pi++) {
                    await wait(200);
                    if (_moFound && _moFound.querySelector('input[type="checkbox"]')) { popover = _moFound; break; }
                    
                    const _p = _getVisiblePopover();
                    if (_p) {
                        const _s = [..._p.querySelectorAll('input[type="checkbox"]')].map(i => i.getAttribute('value') || i.id || '').join('|');
                        if (_s && (!_preSig || _s !== _preSig)) { popover = _p; break; }
                    }
                }
                _mo.disconnect();
            }

            if (!popover) {
                // Final diagnostic: log all visible checkbox containers found in DOM
                const _containers = [];
                const _seenD = new Set();
                for (const _cbEl of document.querySelectorAll('input[type="checkbox"]')) {
                    const _r = _cbEl.getBoundingClientRect();
                    if (_r.width === 0 && _r.height === 0) continue;
                    let _c = _cbEl.parentElement;
                    while (_c && _c !== document.body && !_seenD.has(_c)) {
                        const _cr = _c.getBoundingClientRect();
                        if (_cr.height > 40 && _cr.width > 80) {
                            _seenD.add(_c);
                            _containers.push(`id="${_c.id}" pos=(${Math.round(_cr.top)},${Math.round(_cr.left)}) n=${_c.querySelectorAll('input[type="checkbox"]').length}`);
                            break;
                        }
                        _c = _c.parentElement;
                    }
                }
                dbg(field.label, 'warn', `[LISTIFY FK MULTICHECK] "${field.label}" — no new popover found after click. Visible checkbox containers: [${_containers.join(' | ')}]`);
                return false;
            }

            // Phase 2: wait for options to stabilize (content signature).
            {
                const _sig = () => [...popover.querySelectorAll('input[type="checkbox"]')]
                    .map(i => (i.getAttribute('value') || i.id || '').toLowerCase()).join('|');
                let _prevSig = _sig();
                let _stableMs = 0;
                for (let _wi = 0; _wi < 30 && _stableMs < 800; _wi++) {
                    await wait(200);
                    const _nowSig = _sig();
                    if (_nowSig === _prevSig) { _stableMs += 200; } else { _prevSig = _nowSig; _stableMs = 0; }
                }
                dbg(field.label, 'log', `[LISTIFY FK MULTICHECK] "${field.label}" options stabilized at ${popover.querySelectorAll('input[type="checkbox"]').length} items`);
            }

            const checkboxes = popover.querySelectorAll('input[type="checkbox"]');
            const allValues = [...checkboxes].map(i => (i.getAttribute('value') || i.id || '').trim().toLowerCase());
            dbg(field.label, 'log', `[LISTIFY FK MULTICHECK] "${field.label}" available=${JSON.stringify(allValues)}`);
            const matched = [];
            for (const input of checkboxes) {
                const val = (input.getAttribute('value') || input.id || '').trim().toLowerCase();
                if (!val || val === 'select_all') continue;
                const li = input.closest('li, [class*="CheckboxWithLabelWrapper"]') || input.parentElement;
                const labelTxt = (li?.querySelector('label')?.textContent || '').trim().toLowerCase();
                let isWanted = wanted.includes(val);
                if (!isWanted && labelTxt) {
                    isWanted = wanted.includes(labelTxt)
                        || wanted.some(w => labelTxt.startsWith(w) || labelTxt.endsWith(w));
                }
                if (!isWanted) continue;
                matched.push(val || labelTxt);
                const svg = li && li.querySelector('svg title');
                const isChecked = svg && /^CheckBox$/i.test((svg.textContent || '').trim());
                if (isChecked) { dbg(field.label, 'log', `[LISTIFY FK MULTICHECK]   "${val||labelTxt}" already checked`); continue; }
                const wrapperDiv = input.closest('[class*="InputCheckboxWrapper"]') || input.parentElement;
                const label = li && li.querySelector('label');
                (wrapperDiv || label || input).click();
                await wait(150);
                const svg2 = li && li.querySelector('svg title');
                const nowChecked = svg2 && /^CheckBox$/i.test((svg2.textContent || '').trim());
                if (!nowChecked && label) { label.click(); await wait(120); }
                const svg3 = li && li.querySelector('svg title');
                const finallyChecked = svg3 && /^CheckBox$/i.test((svg3.textContent || '').trim());
                dbg(field.label, 'log', `[LISTIFY FK MULTICHECK]   ${finallyChecked ? '✓' : '✗'} "${val||labelTxt}"`);
            }
            const unmatched = wanted.filter(w => !matched.includes(w));
            if (unmatched.length) dbg(field.label, 'warn', `[LISTIFY FK MULTICHECK] no match: ${JSON.stringify(unmatched)} — available: ${JSON.stringify(allValues)}`);

            await _closeActivePopover();
            return matched.length > 0;
        }

        if (field.type === 'combobox') {
            const cb = wrapper.querySelector('button[role="combobox"], [role="combobox"]');
            if (!cb) {
                dbg(field.label, 'warn', `[LISTIFY FK COMBO] no combobox for "${field.label}"`);
                return false;
            }
            const ok = await setComboboxValue(cb, field.value);
            dbg(field.label, 'log', `[LISTIFY FK COMBO] "${field.label}" → ${ok ? '✓' : '✗'} value=${JSON.stringify(field.value)}`);
            return ok;
        }

        // Plain input/textarea — must skip combobox-internal inputs and the
        // popover search inputs. For wrappers that ALSO contain a combobox
        // (e.g. Maximum Shelf Life: number + unit), pick the real input.
        const alreadyFilled = usedWrappers.get(wrapper)?.inputs || new Set();
        const candidates = [...wrapper.querySelectorAll(
            'input:not([type="hidden"]):not([type="file"]):not([id="checkmarkgroup-search"]):not([id^="checkbox-tree-"]),' +
            'textarea'
        )].filter(e => {
            if (e.closest('[role="combobox"], [role="dialog"]')) return false;
            if (e.readOnly && e.tagName === 'INPUT') return false;
            if (alreadyFilled.has(e)) return false;
            return true;
        });
        if (isPkg) {
            pkgLog.info(`▶ START "${field.label}" want=${JSON.stringify(field.value)} | wrapper found, ${candidates.length} candidate input(s)`);
            candidates.forEach((c, i) => pkgLog.debug(`   cand[${i}] <${c.tagName.toLowerCase()} id="${c.id||''}" name="${c.name||''}" type="${c.type||''}" placeholder="${c.placeholder||''}" aria-label="${c.getAttribute('aria-label')||''}" disabled=${c.disabled} readOnly=${c.readOnly} value="${c.value}">`));
        }
        // When the wrapper holds multiple inputs (e.g. Package Details:
        // Length/Breadth/Height/Weight share one wrapper), candidates[0] is
        // always the first input → every field overwrites Length. Match by
        // placeholder / aria-label / name to field.label first.
        let el = candidates[0];
        if (candidates.length > 1) {
            const target = String(field.label || '').replace(/\*/g, '').trim().toLowerCase();
            // 1. Try placeholder / aria-label / name first
            let matched = candidates.find(c => {
                const ph = (c.getAttribute('placeholder') || '').trim().toLowerCase();
                const al = (c.getAttribute('aria-label') || '').trim().toLowerCase();
                const nm = (c.getAttribute('name') || '').trim().toLowerCase();
                return ph === target || al === target || nm === target;
            });
            let matchedBy = matched ? 'placeholder/aria-label/name' : null;
            // 2. Fallback: match by the nearest PRECEDING label node in the
            //    wrapper (Package Details — Length/Breadth/Height/Weight each
            //    sit after their own .styles__AttributeItemLabelName label).
            if (!matched) {
                const labelNodes = [...wrapper.querySelectorAll('[class*="AttributeItemLabelName"]')];
                const targetLabel = labelNodes.find(l =>
                    l.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase() === target
                );
                if (targetLabel) {
                    let best = null;
                    for (const c of candidates) {
                        if (targetLabel.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) {
                            // candidate is AFTER the label; pick the closest one
                            if (!best) best = c;
                            else {
                                // closer if its preceding distance to label is smaller
                                const a = best.compareDocumentPosition(c);
                                if (a & Node.DOCUMENT_POSITION_PRECEDING) best = c;
                            }
                        }
                    }
                    if (best) { matched = best; matchedBy = 'preceding-label'; }
                }
            }
            if (matched) {
                el = matched;
                if (isPkg) pkgLog.info(`  ↳ multi-input wrapper: matched "${field.label}" by ${matchedBy}`);
            } else if (isPkg) {
                pkgLog.warn(`  ⚠ multi-input wrapper but NO match for "${field.label}" — falling back to candidates[0]`);
            }
        }
        if (!el) {
            if (isPkg) pkgLog.error(`✗ "${field.label}" — NO fillable input found in wrapper (wrapper html len=${wrapper.innerHTML.length})`);
            dbg(field.label, 'warn', `[LISTIFY FK PLAIN] no fillable input for "${field.label}"`);
            return false;
        }

        if (isPkg) {
            pkgLog.info(`  picked <${el.tagName.toLowerCase()} id="${el.id||''}" name="${el.name||''}" type="${el.type||''}"> | disabled=${el.disabled} readOnly=${el.readOnly} | currentValue="${el.value}"`);
        }

        usedWrappers.get(wrapper).inputs.add(el);
        const ok = setReactValue(el, field.value);

        if (isPkg) pkgLog.info(`  setReactValue returned ${ok} | value RIGHT AFTER set="${el.value}"`);

        // Verify React didn't revert the value (e.g. cross-field validation
        // on Package Details rejects Breadth when Length is still empty).
        // If reverted, free the input so a retry pass can pick it again.
        await wait(220);
        const stillThere = el.value;
        const heldOk = String(stillThere) === String(field.value);
        if (!heldOk) {
            usedWrappers.get(wrapper).inputs.delete(el);
            if (isPkg) {
                pkgLog.warn(`  ⚠ "${field.label}" value REVERTED — now="${stillThere}" wanted="${field.value}" (will retry after sibling fields fill)`);
                const err = wrapper.querySelector('[aria-invalid="true"], .error, [class*="error" i]');
                if (err) pkgLog.warn(`  ⚠ wrapper has error indicator: ${err.outerHTML.slice(0, 160)}`);
            }
        } else if (isPkg) {
            pkgLog.info(`  ✓ "${field.label}" value HELD = "${stillThere}"`);
        }

        dbg(field.label, 'log', `[LISTIFY FK PLAIN] "${field.label}" → ${heldOk ? '✓' : '✗ reverted'} value=${JSON.stringify(field.value)} on <${el.tagName.toLowerCase()} type="${el.type||''}" name="${el.name||''}">`);
        return heldOk;
    }

    // ── Image slot fill ──
    // Saved field: { type:"image", value:"<flixcart CDN url>", _slotIndex, label }.
    // Flipkart uses ONE shared <input id="upload-image"> file input, triggered
    // by clicking a slot tile. So: click the target slot → fetch CDN bytes →
    // assign to the file input via DataTransfer → dispatch change.
    async function fillImageSlot(field, panel) {
        if (!panel) return false;

        // Slots have stable IDs #thumbnail_0..#thumbnail_9 — look up directly.
        const idx = Number.isFinite(field._slotIndex) ? field._slotIndex : 0;
        const slot = panel.querySelector(`#thumbnail_${idx}`)
            || document.querySelector(`#thumbnail_${idx}`);
        if (!slot) {
            console.warn(`[LISTIFY FK FILL] image slot ${idx}: #thumbnail_${idx} not in DOM`);
            return false;
        }

        // Skip if slot is already filled (preview <img> present)
        if (slot.querySelector('[class*="ProductImageWrapper"] img[src*="flixcart.com"]')
            || slot.querySelector('img[src*="flixcart.com"]')) {
            console.log(`[LISTIFY FK FILL] image slot ${idx}: already filled — skipping`);
            return true;
        }

        // Fetch the CDN bytes via background (covers CORS)
        const fetchRes = await new Promise((resolve) => {
            chrome.runtime?.sendMessage({ action: 'fk_fetch_image', url: field.value }, (r) => resolve(r || { ok: false }));
        });
        if (!fetchRes.ok) {
            console.warn(`[LISTIFY FK FILL] image fetch failed for ${field.value}:`, fetchRes.error);
            return false;
        }
        const blob = await (await fetch(fetchRes.dataUrl)).blob();
        const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
        const file = new File([blob], `image.${ext}`, { type: blob.type });

        // Click the slot to mount <input id="upload-image">. Flipkart's React
        // handler also invokes input.click() (which opens the OS file picker) —
        // potentially asynchronously, so we stub HTMLInputElement.prototype.click
        // for the entire fillImageSlot lifecycle and restore in finally.
        try { slot.scrollIntoView({ block: 'center' }); } catch (_) {}
        const origInputClick = HTMLInputElement.prototype.click;
        HTMLInputElement.prototype.click = function () {
            if (this.type === 'file') return; // swallow — we feed files directly
            return origInputClick.apply(this, arguments);
        };

        try {
            // Pick an inner element with a real click handler — the FullSizeDiv
            // wraps the visual area Flipkart binds events to.
            const target = slot.querySelector('[class*="FullSizeDiv"]') || slot;
            const evtOpts = { bubbles: true, cancelable: true, view: window, button: 0 };
            target.dispatchEvent(new PointerEvent('pointerdown', evtOpts));
            target.dispatchEvent(new MouseEvent('mousedown', evtOpts));
            target.dispatchEvent(new PointerEvent('pointerup', evtOpts));
            target.dispatchEvent(new MouseEvent('mouseup', evtOpts));
            target.dispatchEvent(new MouseEvent('click', evtOpts));
            await wait(150);

            let input = document.getElementById('upload-image')
                || document.querySelector('input[type="file"][accept*="image"], input[type="file"]');
            const start = Date.now();
            while (!input && Date.now() - start < 3000) {
                await wait(100);
                // Re-dispatch click periodically in case mount needs a retry
                if ((Date.now() - start) % 500 < 110) {
                    try { target.dispatchEvent(new MouseEvent('click', evtOpts)); } catch (_) {}
                }
                input = document.getElementById('upload-image')
                    || document.querySelector('input[type="file"]');
            }
            if (!input) {
                console.warn(`[LISTIFY FK FILL] image slot ${idx}: shared file input never appeared`);
                return false;
            }

            const dt = new DataTransfer();
            dt.items.add(file);
            try {
                input.files = dt.files;
            } catch (e) {
                console.warn('[LISTIFY FK FILL] could not assign files to input:', e);
                return false;
            }
            input.dispatchEvent(new Event('change', { bubbles: true }));

            const t0 = Date.now();
            while (Date.now() - t0 < 8000) {
                if (slot.querySelector('img[src*="flixcart.com"], img[src^="blob:"]')) break;
                await wait(200);
            }
            console.log(`[LISTIFY FK FILL]   ✓ image slot=${idx} "${field.label}"`);
            return true;
        } finally {
            HTMLInputElement.prototype.click = origInputClick;
        }
    }

    // ── Variant addition tab fill ──
    // Saved fields with type:"variant" carry { label: attr, value: chipLabel }.
    // For each attribute, find its row, then for each saved value not already
    // present as a chip, type into the input and click "Create".
    // Quantity is compound: chip label is "{unit} : {value}" (e.g. "ml : 1").
    async function fillVariantsInActivePanel(variantFields) {
        const panel = getActiveTabPanel();
        if (!panel) return { filled: 0, missed: 0 };

        // Group by attribute label
        const byAttr = new Map();
        for (const f of variantFields) {
            const k = (f.label || '').trim();
            if (!k) continue;
            if (!byAttr.has(k)) byAttr.set(k, []);
            byAttr.get(k).push(String(f.value || '').trim());
        }

        const rows = [...panel.querySelectorAll('[class*="VariantAttributeWrapper"]')];
        // Force a deterministic order: page-row order. Attrs not present on
        // page (shouldn't happen, but defensively) get appended at the end.
        const rowAttrs = rows.map(r => {
            const n = r.querySelector('[class*="AttributeDisplay"]');
            return n ? n.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim() : '';
        }).filter(Boolean);
        const orderedAttrs = [
            ...rowAttrs.filter(a => byAttr.has(a)),
            ...[...byAttr.keys()].filter(a => !rowAttrs.includes(a)),
        ];
        console.log('[LISTIFY FK AUTOFILL] ═══ VARIANT FILL START ═══');
        console.log(`[LISTIFY FK AUTOFILL] Variant attrs to fill (in order): ${orderedAttrs.join(' → ')}`);
        console.log(`[LISTIFY FK AUTOFILL] Variant rows on page: ${rows.length}`);
        let filled = 0, missed = 0;
        const missedDetails = [];

        for (const attr of orderedAttrs) {
            const values = byAttr.get(attr) || [];
            const row = rows.find(r => {
                const n = r.querySelector('[class*="AttributeDisplay"]');
                return n && n.textContent.replace(/\*/g, '').trim().toLowerCase() === attr.toLowerCase();
            });
            if (!row) {
                console.warn(`[LISTIFY FK] ❌ Variant row not found for attr "${attr}" (saved values: ${values.join(', ')})`);
                missed += values.length;
                values.forEach(v => missedDetails.push(`${attr}=${v} (no row)`));
                continue;
            }
            console.log(`[LISTIFY FK AUTOFILL] ▶ Attr "${attr}" — ${values.length} value(s) to create:`, values);

            // Existing chip labels (skip values that already exist)
            const existing = new Set(
                [...row.querySelectorAll('[data-testid^="pillsbar-"][data-testid$="-options"] [role="tab"][label]')]
                    .map(c => (c.getAttribute('label') || '').trim().toLowerCase())
            );

            for (const value of values) {
                if (!value) continue;
                if (existing.has(value.toLowerCase())) {
                    console.log(`[LISTIFY FK] Variant chip "${attr}=${value}" already exists — skip`);
                    continue;
                }

                // Re-resolve row each iteration — panel re-renders after each Create.
                const freshRows = [...panel.querySelectorAll('[class*="VariantAttributeWrapper"]')];
                const freshRow = freshRows.find(r => {
                    const n = r.querySelector('[class*="AttributeDisplay"]');
                    return n && n.textContent.replace(/\*/g, '').trim().toLowerCase() === attr.toLowerCase();
                }) || row;

                const ok = await createVariantChip(freshRow, value);
                if (ok) {
                    filled++;
                    existing.add(value.toLowerCase());
                    console.log(`[LISTIFY FK] ✅ Variant created: ${attr}=${value}`);
                    // Wait for the new chip to actually appear before next value.
                    for (let w = 0; w < 12; w++) {
                        await wait(100);
                        const chips = [...(freshRow.querySelectorAll('[data-testid^="pillsbar-"][data-testid$="-options"] [role="tab"][label]'))];
                        if (chips.some(c => (c.getAttribute('label') || '').trim().toLowerCase() === value.toLowerCase())) break;
                    }
                } else {
                    missed++;
                    missedDetails.push(`${attr}=${value} (create failed)`);
                    console.warn(`[LISTIFY FK] ❌ Variant create failed: ${attr}=${value}`);
                }
                await wait(300);
            }
            console.log(`[LISTIFY FK AUTOFILL] ◀ Attr "${attr}" complete — created ${[...existing].join(', ')}`);
            // Pause between attributes so all chips for this attr settle
            // before starting the next attr's row work.
            await wait(400);
        }
        console.log(`[LISTIFY FK AUTOFILL] ═══ VARIANT FILL END — ${filled} created, ${missed} missed ═══`);
        if (missedDetails.length) {
            console.log('[LISTIFY FK AUTOFILL]   ↳ missed:');
            missedDetails.forEach((d, i) => console.log(`[LISTIFY FK AUTOFILL]     [${i + 1}] ${d}`));
        }
        return { filled, missed };
    }

    async function createVariantChip(row, value) {
        // Compound case (Quantity): chip text can be a single pair "ml : 20"
        // or multi-pair "ml : 20 & ml : 10" (joined by " & "). Each pair
        // becomes one staging slot — we may need to click "+" to add slots.
        const hasCombobox = !!row.querySelector('button[role="combobox"], [role="combobox"]');
        const looksCompound = /:/.test(String(value));

        if (hasCombobox && looksCompound) {
            const pairs = String(value)
                .split(/\s*&\s*/)
                .map(p => {
                    const [unit, val] = p.split(/\s*:\s*/).map(s => s.trim());
                    return { unit, val };
                })
                .filter(p => p.unit && p.val);
            if (!pairs.length) return false;

            for (let i = 0; i < pairs.length; i++) {
                const { unit, val } = pairs[i];

                // Snapshot slots; if i-th doesn't exist yet, click "+" to add one.
                let combos = [...row.querySelectorAll('button[role="combobox"], [role="combobox"]')];
                let inputs = [...row.querySelectorAll('input[placeholder^="Enter New"]')];
                if (!combos[i] || !inputs[i]) {
                    const plus = [...row.querySelectorAll('button')]
                        .find(b => (b.textContent || '').trim() === '+' && !b.disabled);
                    if (!plus) {
                        console.warn(`[LISTIFY FK] Variant: no "+" button to add slot ${i}`);
                        return false;
                    }
                    plus.click();
                    await wait(300);
                    combos = [...row.querySelectorAll('button[role="combobox"], [role="combobox"]')];
                    inputs = [...row.querySelectorAll('input[placeholder^="Enter New"]')];
                }

                const slotCombo = combos[i];
                const slotInput = inputs[i];
                if (!slotCombo || !slotInput) {
                    console.warn(`[LISTIFY FK] Variant: slot ${i} missing combo/input`);
                    return false;
                }

                const okUnit = await setComboboxValue(slotCombo, unit);
                if (!okUnit) {
                    console.warn(`[LISTIFY FK] Variant: unit set failed for "${unit}" in slot ${i}`);
                    return false;
                }
                await wait(200);
                if (!setReactValue(slotInput, val)) {
                    console.warn(`[LISTIFY FK] Variant: value set failed for "${val}" in slot ${i}`);
                    return false;
                }
                await wait(200);
            }

            // After all pairs are staged, click Create once to commit them as one chip.
            const create = findCreateButton(row);
            if (!create) return false;
            for (let i = 0; i < 6 && create.disabled; i++) await wait(100);
            if (create.disabled) {
                console.warn('[LISTIFY FK] Variant Create button stayed disabled for', value);
                return false;
            }
            create.click();
            await wait(600);
            return true;
        }

        // Simple case (Pack of): single input + Create.
        // Re-query input each call (Flipkart re-mounts after each Create).
        let input = row.querySelector('input[placeholder^="Enter New"]');
        if (!input) return false;
        try { input.focus(); } catch (_) {}
        if (!setReactValue(input, String(value))) return false;
        await wait(250);
        // If React rejected the value (cleared), retry once with InputEvent.
        if (!input.value) {
            try {
                input.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: String(value) }));
                setReactValue(input, String(value));
                input.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: false, inputType: 'insertText', data: String(value) }));
            } catch (_) {}
            await wait(200);
        }
        const create = findCreateButton(row);
        if (!create) return false;
        for (let i = 0; i < 10 && create.disabled; i++) await wait(120);
        if (create.disabled) {
            console.warn('[LISTIFY FK] Create button stayed disabled for', value);
            return false;
        }
        create.click();
        await wait(500);
        return true;
    }

    function findCreateButton(row) {
        return [...row.querySelectorAll('button.tertiary, button')]
            .find(b => /create/i.test((b.textContent || '').trim())) || null;
    }

    let _skuSeq = 0;
    function randomSku() {
        // Globally-unique SKU: "L" + base36 timestamp tail + base36 counter +
        // 2 random chars. Length ~10. Practically zero collision risk across
        // listings or with previously-used SKUs on this seller account.
        const ts = Date.now().toString(36).slice(-5).toUpperCase();
        const seq = (_skuSeq++).toString(36).toUpperCase();
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const r = chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
        return `L${ts}${seq}${r}`;
    }

    // Variant Details table: each generated row needs a unique Seller SKU ID
    // for the listing to submit. For testing we drop random 5-char strings into
    // any empty input that looks like the SKU column.
    async function fillRandomSellerSkuIds(panel) {
        // Every Seller SKU ID input on the page needs a unique value.
        // Targets:
        //   1) Variant Details rows: input[id^="variant-cell-"][id$="-sku_id"]
        //   2) Parent Listing Information: input whose label/aria contains "Seller SKU ID"
        const variantSkus = [...document.querySelectorAll('input[id^="variant-cell-"][id$="-sku_id"]')];

        // Parent SKU input(s): label name div is .styles__AttributeItemLabelName-...
        // and starts with "Seller SKU ID". Walk up to the field wrapper and find input.
        const parentSkus = new Set();
        const labelEls = [...document.querySelectorAll('[class*="AttributeItemLabelName"], [class*="AttributeDisplay"]')]
            .filter(el => /^\s*seller\s*sku\s*id\b/i.test((el.textContent || '').trim()));
        console.log(`[LISTIFY FK AUTOFILL] SKU label candidates: ${labelEls.length}`);
        for (const lbl of labelEls) {
            const wrapper = lbl.closest('[class*="EditAttributeItemWrapper"], [class*="FocusWrapper"]')
                || lbl.parentElement?.parentElement?.parentElement;
            if (!wrapper) continue;
            const inp = wrapper.querySelector('input[type="text"], input:not([type])');
            if (!inp || inp.id.startsWith('variant-cell-') || inp.disabled || inp.readOnly) continue;
            // Exclude Flipkart's "copy values from an old SKU" search input.
            const ph = (inp.placeholder || '').toLowerCase();
            const wrapText = (wrapper.textContent || '').toLowerCase();
            if (ph.includes('search') || wrapText.includes('copy the values') || wrapText.includes('old skus')) continue;
            parentSkus.add(inp);
        }
        console.log(`[LISTIFY FK AUTOFILL] Parent SKU inputs found: ${parentSkus.size}`);

        const inputs = [...new Set([...parentSkus, ...variantSkus])];
        const used = new Set();
        // Seed with any existing values from inputs we won't touch (disabled/readonly)
        // so we don't accidentally collide with an immutable parent SKU.
        for (const inp of inputs) {
            if ((inp.disabled || inp.readOnly) && inp.value) used.add(inp.value.trim().toUpperCase());
        }
        let count = 0;
        for (const inp of inputs) {
            if (inp.disabled || inp.readOnly) continue;
            // Idempotent: skip if this input already holds one of our random
            // SKUs (matches L<base36>...). Lets the SKU fill run safely after
            // every tab without overwriting earlier-filled values.
            const cur = (inp.value || '').trim();
            if (/^L[A-Z0-9]{6,}$/.test(cur)) {
                used.add(cur.toUpperCase());
                continue;
            }
            let value;
            for (let tries = 0; tries < 20; tries++) {
                value = randomSku();
                if (!used.has(value.toUpperCase())) break;
            }
            used.add(value.toUpperCase());
            try { inp.focus(); } catch (_) {}
            if (!setReactValue(inp, value)) continue;
            try {
                inp.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: value }));
                inp.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: false, inputType: 'insertText', data: value }));
                inp.dispatchEvent(new Event('change', { bubbles: true }));
                inp.dispatchEvent(new Event('blur', { bubbles: true }));
            } catch (_) {}
            count++;
            await wait(80);
        }
        console.log(`[LISTIFY FK AUTOFILL] SKU fill — ${inputs.length} sku inputs, ${count} filled, ${used.size} unique values`);
        return count;
    }

    async function autofillTabbed(template) {
        // Flatten fields from sections and top-level fields. Section titles in
        // the template may not match new tab titles (esp. for templates saved
        // under the old layout), so we try every field in every tab.
        const allFields = [];
        const seenInSections = new Set();
        if (Array.isArray(template.sections)) {
            for (const s of template.sections) {
                if (Array.isArray(s.fields)) {
                    for (const f of s.fields) {
                        const sig = `${f.type || ''}|${f.label || ''}|${f.value || ''}|${f.id || ''}|${f.name || ''}`;
                        seenInSections.add(sig);
                        allFields.push({ ...f, section: s.title });
                    }
                }
            }
        }
        if (Array.isArray(template.fields)) {
            for (const f of template.fields) {
                const sig = `${f.type || ''}|${f.label || ''}|${f.value || ''}|${f.id || ''}|${f.name || ''}`;
                if (!seenInSections.has(sig)) {
                    allFields.push(f);
                }
            }
        }

        // De-dupe by _key, falling back to (type + label). _key gets stripped
        // before save (see fk-buttons.js / fk-tab.js), so fallback must include
        // type — otherwise composite wrappers (e.g. Quantity = multitext chip
        // + combobox unit, both label "Quantity") collide and one is dropped.
        // _key is stripped before save (fk-buttons.js / fk-tab.js), so fallback
        // must include type AND, for images, _slotIndex — all image fields share
        // label "Image"/"Front View" and would otherwise collapse to one.
        const dedupKey = (f) => {
            if (f._key) return String(f._key).toLowerCase();
            if (f.type === 'image') return `image|${f._variant || ''}|${f._slotIndex ?? ''}|${f.label || ''}`.toLowerCase();
            // Variant chips share label (e.g. multiple "Pack of") — distinguish by value.
            if (f.type === 'variant') return `variant|${f.label || ''}|${f.value || ''}`.toLowerCase();
            // Variant cells share label/type — distinguish by stable id.
            if (f.type === 'variant_cell') return `variant_cell|${f.id || ''}`.toLowerCase();
            return `${f.type || ''}|${f.section || ''}|${f.label || ''}`.toLowerCase();
        };
        const seen = new Set();
        const fields = allFields.filter(f => {
            // Strip Seller SKU ID from legacy templates — must be unique per
            // listing, generated fresh by fillRandomSellerSkuIds at the end.
            if (/^\s*seller\s*sku\s*id\b/i.test(f.label || '')) return false;
            const k = dedupKey(f);
            if (!k || seen.has(k)) return false;
            seen.add(k);
            return true;
        });

        const initialTabs = findTabs();
        const tabCount = initialTabs.length;
        const filledKeys = new Set();
        let totalFilled = 0, totalMissed = 0;

        for (let i = 0; i < tabCount; i++) {
            // Re-find tabs every iteration (DOM can re-render between tabs)
            const tabs = findTabs();
            const tab = tabs[i];
            if (!tab) { console.warn(`[LISTIFY FK AUTOFILL] Tab ${i} not found on re-query`); continue; }

            const title = tabTitle(tab);

            // Close any open popover from previous tab (clicks outside dismiss popovers)
            try { document.body.click(); } catch (_) {}
            await wait(100);

            try {
                tab.click();
            } catch (e) {
                console.warn(`[LISTIFY FK AUTOFILL] Tab click failed for "${title}":`, e);
                continue;
            }
            await wait(1500);

            const panel = getActiveTabPanel();

            // Variant addition tab — entirely different DOM (chip-based).
            if (/variant addition/i.test(title)) {
                const panelTxt = (panel?.textContent || '');
                if (/fix errors first/i.test(panelTxt)) {
                    console.log('[LISTIFY FK AUTOFILL] ⚠ Variant tab gated — skipping (fix prior tab errors first)');
                    continue;
                }
                const variantFields = fields.filter(f => f.type === 'variant' && !filledKeys.has((f._key || '').toLowerCase()));
                console.log(`[LISTIFY FK AUTOFILL] ▶ Tab "${title}" — variant fields: ${variantFields.length}`);
                if (variantFields.length) {
                    const r = await fillVariantsInActivePanel(variantFields);
                    totalFilled += r.filled;
                    for (const f of variantFields) filledKeys.add((f._key || '').toLowerCase());
                    console.log(`[LISTIFY FK AUTOFILL] ✅ Tab "${title}" — variants created ${r.filled}, missed ${r.missed}`);
                }
                continue;
            }

            // Image addition tab — skipped intentionally.
            // Image upload is not supported during autofill; only text/select values are filled.
            if (/image addition/i.test(title)) {
                console.log(`[LISTIFY FK AUTOFILL] ▶ Tab "${title}" — image upload skipped (not supported)`);
                continue;
            }

            const wrapperCount = panel ? panel.querySelectorAll(
                '[class*="EditAttributeItemWrapper"], [class*="FocusWrapper"]'
            ).length : 0;
            console.log(`[LISTIFY FK AUTOFILL] ▶ Tab "${title}" — panel:${!!panel} wrappers:${wrapperCount}`);

            // Map<wrapper, Set<fieldType>> so a wrapper can host both a
            // combobox AND a plain input (e.g. Max Shelf Life unit + number).
            const usedWrappers = new Map();
            let tabFilled = 0;
            const tabMissedLabels = [];
            for (const field of fields) {
                const k = dedupKey(field);
                if (filledKeys.has(k)) continue;
                // variant_cell fields are filled in a dedicated final pass by
                // stable ID — skip them in the label-based per-tab loop.
                if (field.type === 'variant_cell') continue;
                // Image upload is not supported — skip silently.
                if (field.type === 'image') continue;

                // If this field belongs to a specific section/tab, and that section name is
                // different from the current tab title, skip it if the page has a tab for it.
                if (field.section && title) {
                    const normFieldSec = normaliseTitle(field.section);
                    const normTabTitle = normaliseTitle(title);
                    if (normFieldSec !== normTabTitle) {
                        const hasMatchingTab = initialTabs.some(t => normaliseTitle(tabTitle(t)) === normFieldSec);
                        if (hasMatchingTab) {
                            continue; // Skip, will be filled when its matching tab is active
                        }
                    }
                }

                let ok = false;
                try {
                    ok = await fillFieldInActivePanel(field, usedWrappers);
                } catch (e) {
                    console.warn(`[LISTIFY FK AUTOFILL] field "${field.label}" threw:`, e);
                }
                if (ok) {
                    filledKeys.add(k);
                    tabFilled++;
                    totalFilled++;
                } else {
                    tabMissedLabels.push(field.label || field._key);
                }
                await wait(40);
            }
            console.log(`[LISTIFY FK AUTOFILL] ✅ Tab "${title}" — filled ${tabFilled} | not-matched-here: ${tabMissedLabels.length}`);

            // Retry pass — fields whose values were reverted by cross-field
            // validation (e.g. Package Details rejects Breadth/Height while
            // Length is still empty). Now that siblings are filled, retry.
            const retryFields = fields.filter(f => {
                if (filledKeys.has(dedupKey(f))) return false;
                if (f.type === 'variant_cell') return false;
                if (f.type === 'image') return false;
                if (!tabMissedLabels.includes(f.label || f._key)) return false;
                return true;
            });
            if (retryFields.length) {
                console.log(`[LISTIFY FK AUTOFILL] ↻ Retry pass on "${title}" — ${retryFields.length} field(s)`);
                await wait(200);
                for (const field of retryFields) {
                    let ok = false;
                    try {
                        ok = await fillFieldInActivePanel(field, usedWrappers);
                    } catch (e) {
                        console.warn(`[LISTIFY FK AUTOFILL] retry "${field.label}" threw:`, e);
                    }
                    if (ok) {
                        filledKeys.add(dedupKey(field));
                        tabFilled++;
                        totalFilled++;
                    }
                    await wait(60);
                }
                console.log(`[LISTIFY FK AUTOFILL] ↻ Retry done on "${title}" — total now filled ${tabFilled}`);
            }

            // Per-tab SKU pass — fills the parent SKU as soon as the tab
            // hosting it is active, so it's locked in even if later steps
            // navigate away. Idempotent (skips already-random-filled inputs).
            try {
                await wait(150);
                const n = await fillRandomSellerSkuIds(null);
                if (n) console.log(`[LISTIFY FK AUTOFILL] 🔖 SKU pass after "${title}": ${n}`);
            } catch (_) {}

            await wait(300);
        }

        totalMissed = fields.length - totalFilled;
        if (totalMissed > 0) {
            const unmatched = fields
                .filter(f => !filledKeys.has(dedupKey(f)))
                .map(f => ({ label: f.label, value: String(f.value).slice(0, 50), type: f.type, section: f._section }));
            console.log(`[LISTIFY FK AUTOFILL] >>> ${totalMissed} field(s) NOT FILLED in any tab:`);
            unmatched.forEach((u, i) => console.log(`[LISTIFY FK AUTOFILL]   #${i + 1}`, JSON.stringify(u)));
        }
        // Switch to Price/Stock tab (parent SKU + Variant Details table both
        // live there). Flipkart unmounts non-active tab content.
        try {
            const allTabs = findTabs();
            const priceTab = allTabs.find(t => /price|stock|shipping|listing/i.test(tabTitle(t)));
            if (priceTab) {
                pssLog.info(`Switching to "${tabTitle(priceTab)}" for variant cell + SKU fill`);
                try { document.body.click(); } catch (_) {}
                await wait(100);
                priceTab.click();
                await wait(1200);
            }
        } catch (_) {}

        // Final pass step 1: fill Variant Details table per-row inputs (MRP,
        // Selling Price, etc.) by stable ID. Rows render progressively after
        // chip creation, so wait+retry per cell until its input mounts.
        try {
            // Filter legacy garbage — old saves captured dropdown <option>
            // elements (IDs ending in "-opt-AI", "-opt-AL", etc.) as cells.
            const cellFields = fields.filter(f => f.type === 'variant_cell' && f.id && !f.id.includes('-opt-'));
            pssLog.info(`═══ VARIANT CELL FILL — ${cellFields.length} fields ═══`);
            let cellFilled = 0, cellMissed = 0, cellDisabled = 0, cellSetFailed = 0;
            const cellMissedDetails = [];
            for (const f of cellFields) {
                let inp = document.getElementById(f.id);
                for (let r = 0; r < 15 && !inp; r++) {
                    await wait(200);
                    inp = document.getElementById(f.id);
                }
                if (!inp) {
                    cellMissed++;
                    cellMissedDetails.push(`${f._attrCode}@${f._rowIdentity} → input #${f.id} never mounted`);
                    pssLog.warn(`🧩 ❌ cell input not found: #${f.id}`);
                    continue;
                }
                if (inp.disabled || inp.readOnly) {
                    cellDisabled++;
                    cellMissedDetails.push(`${f._attrCode}@${f._rowIdentity} → disabled/readonly`);
                    continue;
                }
                const val = String(f.value);
                try { inp.focus(); } catch (_) {}
                if (!setReactValue(inp, val)) {
                    cellSetFailed++;
                    cellMissedDetails.push(`${f._attrCode}@${f._rowIdentity} → setReactValue rejected`);
                    continue;
                }
                try {
                    inp.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: val }));
                    inp.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: false, inputType: 'insertText', data: val }));
                    inp.dispatchEvent(new Event('change', { bubbles: true }));
                    inp.dispatchEvent(new Event('blur', { bubbles: true }));
                } catch (_) {}
                cellFilled++;
                pssLog.debug(`🧩   ✓ ${f._attrCode}@${f._rowIdentity} = ${val.slice(0, 30)}`);
                await wait(80);
            }
            pssLog.info(`═══ VARIANT CELL FILL END — filled=${cellFilled} missed=${cellMissed} disabled=${cellDisabled} setFailed=${cellSetFailed} / total=${cellFields.length} ═══`);
            if (cellMissedDetails.length) {
                pssLog.warn('  ↳ cell misses:');
                cellMissedDetails.forEach((d, i) => pssLog.warn(`    [${i + 1}] ${d}`));
            }
        } catch (e) {
            pssLog.error('Variant cell fill failed:', e);
        }

        // Final pass step 2: fill ALL Seller SKU IDs (parent + every variant
        // row) in one shot — runs AFTER cells so variant rows have rendered
        // and their sku_id inputs exist.
        try {
            await wait(300);
            const skuFilled = await fillRandomSellerSkuIds(null);
            if (skuFilled) pssLog.info(`🔖 Seller SKU IDs filled (random): ${skuFilled}`);
        } catch (e) {
            pssLog.error('Seller SKU random fill failed:', e);
        }

        console.log(`[LISTIFY FK AUTOFILL] Tabbed done — ${totalFilled} filled, ${totalMissed} missed`);
        return { totalFilled, totalMissed };
    }

    // ─────────────────────────────────────────────────────
    // MAIN AUTOFILL
    // Driven by the PAGE's div[height="min"] cards, not by
    // the template's section list.  For each card on the
    // page:  detect EDIT → click it → wait → fill → save.
    // ─────────────────────────────────────────────────────
    async function autofill(template) {
        // Detect new tabbed layout — if [role="tab"] buttons exist, route through tabbed fill.
        if (findTabs().length > 0) {
            console.log('[LISTIFY FK AUTOFILL] 🆕 Tabbed layout detected — using autofillTabbed');
            return autofillTabbed(template);
        }

        // Build a normalised-title → fields map from the template
        const sectionMap = {};
        if (Array.isArray(template.sections)) {
            for (const s of template.sections) {
                if (s.fields?.length) sectionMap[normaliseTitle(s.title)] = s.fields;
            }
        }
        const flatFields = Array.isArray(template.fields) ? template.fields : [];

        let totalFilled = 0;
        let totalMissed = 0;

        // ── Section-driven loop ───────────────────────────
        // Iterate by section titles from the template (in preferred order).
        // Each fillSection() does a fresh DOM lookup — avoids stale card
        // references that occur after page re-renders between saves.
        const PREFERRED_FILL_ORDER = [
            'price, stock and shipping information',
            'product description',
            'additional description',
        ];

        // Build ordered list of [title, fields] from template sections,
        // sorted by preferred order (unknowns keep insertion order after).
        const sectionEntries = Object.entries(sectionMap).sort((a, b) => {
            const ai = PREFERRED_FILL_ORDER.indexOf(a[0]);
            const bi = PREFERRED_FILL_ORDER.indexOf(b[0]);
            if (ai !== -1 && bi !== -1) return ai - bi;
            if (ai !== -1) return -1;
            if (bi !== -1) return 1;
            return 0;
        });

        console.log(`[LISTIFY FK AUTOFILL] Sections to fill (${sectionEntries.length}):`, sectionEntries.map(([t]) => t));

        for (const [title, fields] of sectionEntries) {
            // Skip _unknown sections entirely — they contain nav menu items and other
            // non-form fields. Clicking their EDIT/SAVE buttons causes page navigation.
            if (title === '_unknown') {
                console.log(`[LISTIFY FK AUTOFILL] ⏭ Skipping "_unknown" section (${fields.length} fields)`);
                continue;
            }
            console.log(`[LISTIFY FK AUTOFILL] Processing section "${title}" (${fields.length} fields)`);
            const r = await fillSection(title, fields);
            totalFilled += r.filled;
            totalMissed += r.missed;
            await wait(400); // allow page to re-render after section save before opening next
        }

        // ── Fallback: flat fields with no section structure ──
        if (Object.keys(sectionMap).length === 0 && flatFields.length > 0) {
            await clickTopLevelEditIfNeeded();
            for (const field of flatFields) {
                const el = findElement(field);
                if (!el) { totalMissed++; continue; }
                if (el.id && el.id.startsWith('checkMarkOption_')) continue;
                if (setReactValue(el, field.value)) totalFilled++;
                else totalMissed++;
                await wait(40);
            }
        }

        console.log(`[LISTIFY FK AUTOFILL] Done — ${totalFilled} filled, ${totalMissed} missed`);
        return { totalFilled, totalMissed };
    }

    // ─────────────────────────────────────────────────────
    // MESSAGE HANDLER
    // ─────────────────────────────────────────────────────
    // ── Find and click "Add Single Catalog" button ──
    // Uses MutationObserver — fires instantly when button appears, no polling loop
    function clickAddSingleCatalog() {
        return new Promise((resolve, reject) => {

            function findBtn() {
                return [...document.querySelectorAll('button,a,[role="button"]')]
                    .find(b => /add\s+single/i.test(b.textContent));
            }

            // Debug — log all visible buttons so we can see exact text
            function logAllButtons() {
                const all = [...document.querySelectorAll('button,a,[role="button"]')]
                    .map(b => b.textContent.trim())
                    .filter(t => t.length > 0 && t.length < 60);
                console.log('[LISTIFY FK] All buttons on page:', all);
            }

            // Already in DOM — click immediately
            const existing = findBtn();
            if (existing) {
                existing.click();
                console.log('[LISTIFY FK] Clicked "Add Single Catalog" (already in DOM)');
                return resolve({ ok: true });
            }

            // Log what's currently there to help debug
            logAllButtons();

            // Watch for button to appear
            const observer = new MutationObserver(() => {
                const btn = findBtn();
                if (btn) {
                    observer.disconnect();
                    clearTimeout(timer);
                    btn.click();
                    console.log('[LISTIFY FK] Clicked "Add Single Catalog" (via MutationObserver)');
                    resolve({ ok: true });
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            // Safety timeout — log buttons again before giving up
            const timer = setTimeout(() => {
                observer.disconnect();
                console.warn('[LISTIFY FK] "Add Single Catalog" button not found after 10s');
                logAllButtons();
                reject(new Error('Button not found'));
            }, 10000);
        });
    }

    // ── Toolbar trigger (from initFkToolbar in content-script.js) ──
    window.addEventListener('listify_fk_autofill', async (e) => {
        const template = e.detail;
        if (!template) { pkgLog.error('listify_fk_autofill fired with NO template'); return; }
        pkgLog.info(`🚀 AUTOFILL TRIGGERED via toolbar/Fill button | template="${template.name}" sections=${template.sections?.length} fields=${template.fields?.length}`);
        console.log('[LISTIFY FK AUTOFILL] Triggered via toolbar');
        try {
            const result = await autofill(template);
            window.dispatchEvent(new CustomEvent('listify_fk_autofill_done', { detail: result }));
        } catch (err) {
            console.error('[LISTIFY FK AUTOFILL] Toolbar trigger error:', err);
            window.dispatchEvent(new CustomEvent('listify_fk_autofill_done', { detail: { totalFilled: 0, totalMissed: 0 } }));
        }
    });

    // ─────────────────────────────────────────────────────
    // AUTO-FILL TRIGGER  (mirrors Meesho behaviour)
    // Fires when:
    //   1. Category saved to storage → storage.onChanged
    //   2. SPA navigates to a listing page (URL contains 'addListings')
    //   3. Script loads on a listing page that already has a stored category
    // Respects the global listify_autofill_enabled toggle.
    // ─────────────────────────────────────────────────────
    window.__listify_fk_page_filled  = false;
    window.__listify_fk_is_filling   = false;
    let _lastFkUrl = window.location.href;

    async function checkAndAutoFill() {
        if (!window.location.href.includes('addListings')) return;
        if (window.__listify_fk_page_filled)  return;
        if (window.__listify_fk_is_filling)   return;
        if (document.visibilityState !== 'visible') return;

        const stored = await chrome.storage?.local.get(['listify_autofill_enabled']);
        if (stored.listify_autofill_enabled === false) return;

        const catRes = await chrome.runtime?.sendMessage({ action: 'get_my_tab_category' });
        const cat = (catRes?.category || '').trim();
        if (!cat) return;

        // Wait for React form to fully mount after SPA navigation
        await wait(2500);

        if (window.__listify_fk_page_filled) return;
        if (!window.location.href.includes('addListings')) return;
        if (window.__listify_fk_is_filling)  return;

        window.__listify_fk_is_filling = true;
        try {
            const result = await chrome.runtime?.sendMessage({
                action: 'fk_trigger_autofill_fk',
                domCategory: cat,
                autoTriggered: true,
            });
            if (result?.ok && result.template) {
                window.__listify_fk_page_filled = true;
                console.log('[LISTIFY FK] Auto-filling category:', result.category);
                await autofill(result.template);
                chrome.runtime?.sendMessage({ action: 'record_template_usage', templateId: result.template._id });
            }
        } catch (e) {
            console.warn('[LISTIFY FK] Auto-fill error:', e);
        } finally {
            window.__listify_fk_is_filling = false;
        }
    }

    // 1. Category written to storage → trigger auto-fill
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        const catKey = Object.keys(changes).find(k => k.startsWith('listify_cat_'));
        if (!catKey || !changes[catKey].newValue) return;
        setTimeout(checkAndAutoFill, 2500);
    });

    // 2. SPA URL change → reset filled flag, trigger if new URL is a listing page
    setInterval(() => {
        const url = window.location.href;
        if (url !== _lastFkUrl) {
            _lastFkUrl = url;
            window.__listify_fk_page_filled = false;
            window.__listify_fk_is_filling  = false;
            if (url.includes('addListings')) checkAndAutoFill();
        }
    }, 1000);

    // 3. Initial check (handles hard refresh on a listing page)
    checkAndAutoFill();

    chrome.runtime?.onMessage.addListener((req, _sender, sendResponse) => {

        if (req.action === 'fk_get_section_order') {
            // Runs only in the top frame (fk-autofill.js has window !== window.top guard)
            // so div[height="min"] cards are always the real page cards, not iframe content.
            const order = [...document.querySelectorAll('div[height="min"]')]
                .map(card => {
                    for (const span of card.querySelectorAll('span')) {
                        if (span.children.length > 0) continue;
                        const t = span.textContent.replace(/\(\d+\/\d+\)/g, '').replace(/\s+/g, ' ').trim();
                        if (t && t.length > 5 && t.length < 120 && !/^(EDIT|SAVE|CANCEL|\d+.*)$/i.test(t)) return t;
                    }
                    return null;
                })
                .filter(Boolean);
            console.log('[LISTIFY FK] fk_get_section_order →', order);
            sendResponse({ order });
            return false;
        }

        if (req.action === 'fk_click_add_single') {
            clickAddSingleCatalog()
                .then(res => sendResponse(res))
                .catch(e => sendResponse({ ok: false, error: e.message }));
            return true; // async
        }

        if (req.action === 'fk_autofill') {
            pkgLog.info(`🚀 AUTOFILL TRIGGERED via popup Fill | template="${req.template?.name}" sections=${req.template?.sections?.length} fields=${req.template?.fields?.length}`);
            console.group('[LISTIFY FK AUTOFILL] Starting autofill');
            console.log('Template:', req.template?.name, '| Sections:', req.template?.sections?.length, '| Fields:', req.template?.fields?.length);
            autofill(req.template)
                .then(result => {
                    console.log('Result:', result);
                    console.groupEnd();
                    sendResponse({ success: true, ...result });
                })
                .catch(err => {
                    console.error('[LISTIFY FK AUTOFILL] Error:', err);
                    console.groupEnd();
                    sendResponse({ success: false, error: err.message });
                });
            return true; // async response
        }
    });

})();
