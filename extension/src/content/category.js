/* A+ Studio content-script module — page category detection (MUI select, breadcrumb). */

  // Read the currently selected category from the page DOM at scan time.
  // Checks MUI Select/Autocomplete, data-value attributes, native <select>, labelled inputs.
  export function detectCurrentCategory() {
    const isGeneric = (t) => {
      if (!t) return true;
      const lower = t.toLowerCase().trim();
      return (
        lower.length <= 1 ||
        [
          "select",
          "choose",
          "none",
          "category",
          "sub-category",
          "subcategory",
          "select category",
          "choose category",
          "all categories",
          "-",
          "--",
          "---",
          "n/a",
          "meesho",
        ].includes(lower) ||
        /^(select|choose|enter|please|type|search)\s/i.test(lower)
      );
    };

    // 1. MUI Select: look for a visible [data-value] on a selected/active item
    const categoryLabels = document.querySelectorAll("label");
    const matchingLabels = [...categoryLabels].filter((l) =>
      /categor/i.test(l.textContent),
    );

    for (const lbl of matchingLabels) {
      const ctrl = lbl.closest('[class*="FormControl"]') || lbl.parentElement;
      if (!ctrl) continue;

      const muiSel = ctrl.querySelector('[class*="MuiSelect-select"]');
      if (muiSel) {
        const dv = muiSel.getAttribute("data-value") || "";
        const tv = (muiSel.textContent || "").trim();
        if (!isGeneric(dv)) return dv.trim();
        if (!isGeneric(tv)) return tv;
      }

      const inp = ctrl.querySelector(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])',
      );
      if (inp && !isGeneric(inp.value)) return inp.value.trim();

      const forId = lbl.getAttribute("for");
      if (forId) {
        const el = document.getElementById(forId);
        if (el && !isGeneric(el.value)) return el.value.trim();
      }
    }

    // 2. Input / textarea with aria-label, placeholder, or name containing "category"
    const attrMatches = document.querySelectorAll(
      '[aria-label*="ategory" i], [placeholder*="ategory" i], [name*="ategory" i]',
    );
    for (const el of attrMatches) {
      if (
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
        !isGeneric(el.value)
      ) {
        return el.value.trim();
      }
    }

    // 3. Native <select> where name/id/aria-label contains "category"
    const selects = document.querySelectorAll("select");
    for (const sel of selects) {
      const ctx = (
        (sel.name || "") +
        " " +
        (sel.id || "") +
        " " +
        (sel.getAttribute("aria-label") || "")
      ).toLowerCase();
      if (/categor/.test(ctx)) {
        const val = sel.options[sel.selectedIndex]?.text?.trim() || "";
        if (sel.selectedIndex > 0 && !isGeneric(val)) return val;
      }
    }

    return "";
  }

  // Reads the category breadcrumb from Meesho's form page (step 2).
  // e.g. "Women Fashion / Accessories / Fashion Accessories / Saree Pin"
  // Returns the last segment (leaf category) as that's the most specific.
  export function scrapeBreadcrumbCategory() {
    const guidelinesEl = document.querySelector(
      '[data-testid="imageGuidelines"]',
    );
    if (!guidelinesEl) return null;
    const breadcrumbP = guidelinesEl.querySelector("p");
    if (!breadcrumbP) return null;
    const fullPath = (breadcrumbP.textContent || "").trim();
    if (!fullPath || !fullPath.includes("/")) return null;
    const segments = fullPath
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean);
    const leaf = segments[segments.length - 1];
    // Save full path for bulk fill category search (does not affect any other flow)
    sessionStorage.setItem("listify_tab_category_full", fullPath);
    return leaf || null;
  }
