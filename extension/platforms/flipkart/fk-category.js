; (function () {
    if (window.__listifyFkCat) return;
    window.__listifyFkCat = true;

    // Only run in the main frame on Flipkart Seller Hub
    if (window !== window.top) return;
    if (!window.location.hostname.includes('seller.flipkart.com')) return;

    // ── Extract category from the path breadcrumb div ──
    // Target: <div class="select-category__ProductPath-sc-3br0ie-5 eIuqkr">
    //   <span>Browse Verticals:</span> Baby Care / Bath Care, Diapering & Potty / Wipes
    // We split on "/" and take the last segment → "Wipes"
    function extractCategory() {
        const el = document.querySelector('[class*="select-category__ProductPath-"]');
        if (!el) return '';

        // Get all text but skip the <span> label (e.g. "Browse Verticals:")
        let text = '';
        el.childNodes.forEach(node => {
            // Skip the label span ("Browse Verticals:")
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            } else if (
                node.nodeType === Node.ELEMENT_NODE &&
                node.tagName !== 'SPAN'
            ) {
                text += node.textContent;
            } else if (
                node.nodeType === Node.ELEMENT_NODE &&
                node.tagName === 'SPAN' &&
                !node.textContent.includes(':')
            ) {
                // Include span content if it doesn't look like a label
                text += node.textContent;
            }
        });

        // Fallback: use full text if above yields nothing
        if (!text.trim()) text = el.textContent || '';

        // Remove the "Browse Verticals:" label prefix if present
        text = text.replace(/^[^:]+:\s*/, '').trim();

        // Split on "/" and take the last segment
        const parts = text.split('/');
        const last = parts[parts.length - 1].trim();

        return last.replace(/\s+/g, ' ').trim();
    }

    function extractVerticalAndBrand() {
        let vertical = '', brand = '';
        const step0 = document.querySelector('[data-testid="undefined-step-0"]');
        const step1 = document.querySelector('[data-testid="undefined-step-1"]');
        if (step0) {
            const val = step0.querySelector('[class*="PanelNameLabel"]');
            if (val) vertical = val.textContent.trim();
        }
        if (step1) {
            const val = step1.querySelector('[class*="PanelNameLabel"]');
            if (val) brand = val.textContent.trim();
        }
        return { vertical, brand };
    }

    let _savedCat = '';
    let _savedVertical = '';
    let _savedBrand = '';

    function saveCategory(cat) {
        if (!cat || cat.length < 2) return;
        if (cat === _savedCat) return;
        _savedCat = cat;

        sessionStorage.setItem('listify_tab_category', cat);
        try {
            chrome.runtime?.sendMessage({ action: 'save_tab_category', category: cat });
        } catch (_) {}

        console.log('[LISTIFY FK] Category detected & saved:', cat);
    }

    function saveVerticalAndBrand(vertical, brand) {
        if (vertical === _savedVertical && brand === _savedBrand) return;
        _savedVertical = vertical;
        _savedBrand = brand;

        if (vertical) sessionStorage.setItem('listify_tab_vertical', vertical);
        if (brand) sessionStorage.setItem('listify_tab_brand', brand);
        try {
            chrome.runtime?.sendMessage({ action: 'save_tab_vertical_brand', vertical, brand });
        } catch (_) {}

        console.log('[LISTIFY FK] Vertical:', vertical, '| Brand:', brand);
    }

    // Run once on load
    const initial = extractCategory();
    if (initial) saveCategory(initial);
    const { vertical: initV, brand: initB } = extractVerticalAndBrand();
    if (initV || initB) saveVerticalAndBrand(initV, initB);

    // Watch for DOM changes — Flipkart is a SPA
    const observer = new MutationObserver(() => {
        const cat = extractCategory();
        if (cat) saveCategory(cat);
        const { vertical, brand } = extractVerticalAndBrand();
        if (vertical || brand) saveVerticalAndBrand(vertical, brand);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    console.log('[LISTIFY FK] Category detector active on', window.location.href);
})();
