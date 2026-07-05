/* A+ Studio content-script module — DOM label/selector text extraction helpers. */

  export const clean = (txt) =>
    txt ? txt.replace(/[\u200B-\u200D\uFEFF]/g, "").trim() : "";

  export function isDynamicId(id) {
    if (!id) return false;
    if (/^mui-\d+/.test(id)) return true;
    if (/^ember\d+/.test(id)) return true;
    if (/^\d+$/.test(id)) return true;
    if (id.length > 15 && /\d/.test(id)) return true;
    return false;
  }

  export function getUniqueSelector(el) {
    if (!(el instanceof Element)) return "";
    try {
      if (el.id && !isDynamicId(el.id)) return "#" + CSS.escape(el.id);
    } catch (e) {}
    return "";
  }

  export function isGenericText(txt) {
    const t = txt.toLowerCase().trim();
    return (
      !t ||
      t === "select" ||
      t === "choose" ||
      t === "pick" ||
      t === "none" ||
      t.startsWith("select ") ||
      t.startsWith("choose ") ||
      t.startsWith("enter ") ||
      t.startsWith("please ") ||
      t.startsWith("type ")
    );
  }

  export function getSurroundingText(el) {
    if (el.labels && el.labels.length > 0) {
      const txt = clean(el.labels[0].innerText);
      if (txt && !isGenericText(txt)) return txt;
    }
    const aria = el.getAttribute("aria-label");
    if (aria) {
      const t = clean(aria);
      if (t && !isGenericText(t)) return t;
    }
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const ref = document.getElementById(labelledBy);
      if (ref) {
        const t = clean(ref.innerText);
        if (t && !isGenericText(t)) return t;
      }
    }
    const candidates = [];
    const cell = el.closest("td, th");
    if (cell) {
      const prevCell = cell.previousElementSibling;
      if (prevCell) {
        const t = clean(prevCell.innerText);
        if (t && !isGenericText(t) && t.length < 60) candidates.push(t);
      }
    }
    const fieldset = el.closest("fieldset");
    if (fieldset) {
      const legend = fieldset.querySelector("legend");
      if (legend) {
        const t = clean(legend.innerText);
        if (t) candidates.push(t);
      }
    }
    let node = el.parentElement;
    for (let d = 0; d < 4 && node; d++, node = node.parentElement) {
      const prev = node.previousElementSibling;
      if (prev) {
        if (!prev.querySelector("input, select, textarea")) {
          const t = clean(prev.innerText);
          if (t && !isGenericText(t) && t.length < 60) candidates.push(t);
        }
      }
      const clone = node.cloneNode(true);
      clone
        .querySelectorAll("input, select, textarea, button")
        .forEach((i) => i.remove());
      const t = clean(clone.innerText);
      if (t && !isGenericText(t) && t.length > 1 && t.length < 60)
        candidates.push(t);
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.length - b.length);
      return candidates[0];
    }
    return "";
  }

  // Detects when an input lives in a grid-style row (e.g. Meesho's per-size price/inventory grid).
  // Returns { colHeader, rowKey } so labels can be made unique per row, e.g. "MRP* [L]".
  // Handles both real <table> markup and div-based grids (Meesho uses div.css-* wrappers,
  // not <table>, with <h6> headers as direct children of a header-row div).
  export function getTableRowContext(el) {
    // Path 1 — real HTML tables / role="grid"
    const strictCell = el.closest(
      "td, th, [role='cell'], [role='gridcell']",
    );
    if (strictCell) {
      const strict = _tableCtxStrict(strictCell);
      if (strict) return strict;
    }

    // Path 2 — div-based grid heuristic
    let cur = el.parentElement;
    for (let depth = 0; depth < 12 && cur && cur.parentElement; depth++, cur = cur.parentElement) {
      const parent = cur.parentElement;
      const siblings = Array.from(parent.children);
      if (siblings.length < 2) continue;

      const rowCells = Array.from(cur.children);
      if (rowCells.length < 3) continue;

      const cellIdx = rowCells.findIndex((c) => c === el || c.contains(el));
      if (cellIdx < 0) continue;

      // Find an earlier sibling that looks like a header row:
      // no form controls inside, and ≥2 direct heading-like children.
      let headerSibling = null;
      const curIdx = siblings.indexOf(cur);
      for (let i = 0; i < curIdx; i++) {
        const sib = siblings[i];
        if (sib.querySelector("input, select, textarea")) continue;
        const directHeadings = Array.from(sib.children).filter(
          (c) =>
            /^H[1-6]$|^TH$/.test(c.tagName) ||
            c.getAttribute("role") === "columnheader",
        );
        if (directHeadings.length < 2) continue;
        // Structural similarity: header child count should be within ±2 of row cell count
        if (Math.abs(sib.children.length - rowCells.length) > 2) continue;
        headerSibling = sib;
        break;
      }
      if (!headerSibling) continue;

      const headerCells = Array.from(headerSibling.children);
      if (cellIdx >= headerCells.length) continue;
      const colHeader = clean(
        (headerCells[cellIdx].innerText || "").replace(/\s+/g, " "),
      );
      if (!colHeader || isGenericText(colHeader)) continue;

      let rowKey = "";
      const firstCell = rowCells[0];
      if (firstCell && firstCell !== rowCells[cellIdx]) {
        const clone = firstCell.cloneNode(true);
        clone
          .querySelectorAll("input, select, textarea, button")
          .forEach((i) => i.remove());
        rowKey = clean(clone.innerText);
      }
      if (!rowKey) {
        const dataRows = siblings.filter(
          (s) => s !== headerSibling && s.querySelector("input, select, textarea"),
        );
        const idx = dataRows.indexOf(cur);
        if (idx >= 0) rowKey = `Row ${idx + 1}`;
      }
      if (!rowKey) continue;

      return { colHeader, rowKey };
    }

    return null;
  }

  export function _tableCtxStrict(cell) {
    const row = cell.closest("tr, [role='row']");
    if (!row) return null;
    const table = row.closest("table, [role='table'], [role='grid']");
    if (!table) return null;

    const cellSel =
      "td, th, [role='cell'], [role='gridcell'], [role='columnheader']";
    const rowCells = Array.from(row.children).filter((c) => c.matches(cellSel));
    const cellIndex = rowCells.indexOf(cell);
    if (cellIndex < 0) return null;

    let headerCells = [];
    const thead = table.querySelector("thead");
    if (thead) {
      const headerRow = thead.querySelector("tr, [role='row']");
      if (headerRow) {
        headerCells = Array.from(headerRow.children).filter((c) =>
          c.matches("th, [role='columnheader']"),
        );
      }
    }
    if (headerCells.length === 0) {
      const allRows = Array.from(table.querySelectorAll("tr, [role='row']"));
      const firstRow = allRows[0];
      if (firstRow && firstRow !== row) {
        headerCells = Array.from(firstRow.children).filter((c) =>
          c.matches("th, [role='columnheader']"),
        );
      }
    }
    const colHeader =
      headerCells[cellIndex] && clean(headerCells[cellIndex].innerText);
    if (!colHeader) return null;

    let rowKey = "";
    if (rowCells[0] && rowCells[0] !== cell) {
      const clone = rowCells[0].cloneNode(true);
      clone
        .querySelectorAll("input, select, textarea, button")
        .forEach((i) => i.remove());
      rowKey = clean(clone.innerText);
    }
    if (!rowKey) {
      const parent = row.parentElement;
      if (parent) {
        const siblingRows = Array.from(parent.children).filter((r) =>
          r.matches("tr, [role='row']"),
        );
        const idx = siblingRows.indexOf(row);
        if (idx >= 0) rowKey = `Row ${idx + 1}`;
      }
    }
    if (!rowKey) return null;

    return { colHeader, rowKey };
  }

  // Combines base surrounding text with table-row context.
  // Produces row-unique labels like "MRP [L]" so multi-row tables stay disambiguated
  // through both capture (scanForms) and fill (findElement).
  export function getEnrichedLabel(el) {
    const base = getSurroundingText(el);
    const tbl = getTableRowContext(el);
    if (!tbl) return base;
    const head = tbl.colHeader;
    if (base && base !== head && !base.includes(head)) {
      return `${head} [${tbl.rowKey}]`;
    }
    return `${head} [${tbl.rowKey}]`;
  }

  export function getAllElementsDeep(root = document) {
    const elements = [];
    function traverse(node) {
      if (!node) return;
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip our own extension UI so the fill never touches the FAB modal fields
        if (node.id && node.id.startsWith("__listify")) return;

        const tag = node.tagName;
        if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) {
          if (
            node.type !== "hidden" &&
            node.type !== "submit" &&
            node.type !== "button" &&
            node.type !== "image"
          ) {
            // Skip Flipkart nav menu inputs (Log Out, Switch Account, etc.)
            if (node.id && node.id.startsWith("checkMarkOption_")) return;
            elements.push(node);
          }
        } else if (
          (tag === "DIV" || tag === "SPAN") &&
          (node.getAttribute("role") === "button" ||
            node.getAttribute("role") === "combobox" ||
            node.getAttribute("aria-haspopup") === "listbox")
        ) {
          elements.push(node);
        } else if (tag === "DIV" && node.classList.contains("MuiBox-root")) {
          // SVG-toggle: flex div with a direct SVG child AND a direct p/span text label
          // (e.g. "Same as Manufacturer Details"). Requires BOTH to avoid capturing icon-only containers.
          const firstChild = node.firstElementChild;
          if (
            firstChild &&
            firstChild.tagName.toLowerCase() === "svg" &&
            node.querySelector(":scope > p, :scope > span")
          ) {
            console.log(
              `[DEBUG SVG] getAllElementsDeep: Found SVG-toggle parent div. Node:`,
              node,
              `Label Text:`,
              node.textContent.trim(),
            );
            elements.push(node);
          }
        }
      }
      if (node.shadowRoot) traverse(node.shadowRoot);
      let child = node.firstElementChild;
      while (child) {
        traverse(child);
        child = child.nextElementSibling;
      }
    }
    traverse(root.body || root);
    return elements;
  }
