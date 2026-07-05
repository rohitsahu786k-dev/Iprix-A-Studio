"use strict";
(() => {
  // extension/src/content/toast.js
  function showToast(message, type = "info") {
    const existing = document.getElementById("__listify_toast__");
    if (existing) existing.remove();
    const colors = {
      success: "#1a9e5a",
      error: "#dc2626",
      warning: "#d97706",
      info: "#09090b",
      off: "#6b7280"
    };
    const toast = document.createElement("div");
    toast.id = "__listify_toast__";
    const s = toast.style;
    s.setProperty("position", "fixed", "important");
    s.setProperty("top", "20px", "important");
    s.setProperty("right", "20px", "important");
    s.setProperty("z-index", "2147483647", "important");
    s.setProperty("display", "flex", "important");
    s.setProperty("align-items", "center", "important");
    s.setProperty("gap", "8px", "important");
    s.setProperty("background", colors[type] || colors.info, "important");
    s.setProperty("color", "#fff", "important");
    s.setProperty("padding", "11px 16px", "important");
    s.setProperty("border-radius", "10px", "important");
    s.setProperty(
      "font-family",
      "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "important"
    );
    s.setProperty("font-size", "13px", "important");
    s.setProperty("font-weight", "500", "important");
    s.setProperty("line-height", "1.4", "important");
    s.setProperty("box-shadow", "0 4px 24px rgba(0,0,0,0.22)", "important");
    s.setProperty("max-width", "320px", "important");
    s.setProperty("pointer-events", "none", "important");
    s.setProperty(
      "transition",
      "opacity 0.22s ease, transform 0.22s ease",
      "important"
    );
    s.opacity = "0";
    s.transform = "translateY(-10px)";
    const brand = document.createElement("span");
    brand.setAttribute(
      "style",
      "font-weight:700;font-size:11px;opacity:0.85;white-space:nowrap;letter-spacing:0.03em;"
    );
    brand.textContent = "A+ Studio";
    const dot = document.createElement("span");
    dot.setAttribute("style", "opacity:0.4;margin:0 2px;");
    dot.textContent = "\xB7";
    const text = document.createElement("span");
    text.setAttribute(
      "style",
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
    );
    text.textContent = message;
    toast.appendChild(brand);
    toast.appendChild(dot);
    toast.appendChild(text);
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 280);
    }, 3500);
  }

  // extension/src/content/text-utils.js
  var clean = (txt) => txt ? txt.replace(/[\u200B-\u200D\uFEFF]/g, "").trim() : "";
  function isDynamicId(id) {
    if (!id) return false;
    if (/^mui-\d+/.test(id)) return true;
    if (/^ember\d+/.test(id)) return true;
    if (/^\d+$/.test(id)) return true;
    if (id.length > 15 && /\d/.test(id)) return true;
    return false;
  }
  function getUniqueSelector(el) {
    if (!(el instanceof Element)) return "";
    try {
      if (el.id && !isDynamicId(el.id)) return "#" + CSS.escape(el.id);
    } catch (e) {
    }
    return "";
  }
  function isGenericText(txt) {
    const t = txt.toLowerCase().trim();
    return !t || t === "select" || t === "choose" || t === "pick" || t === "none" || t.startsWith("select ") || t.startsWith("choose ") || t.startsWith("enter ") || t.startsWith("please ") || t.startsWith("type ");
  }
  function getSurroundingText(el) {
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
          const t2 = clean(prev.innerText);
          if (t2 && !isGenericText(t2) && t2.length < 60) candidates.push(t2);
        }
      }
      const clone = node.cloneNode(true);
      clone.querySelectorAll("input, select, textarea, button").forEach((i) => i.remove());
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
  function getTableRowContext(el) {
    const strictCell = el.closest(
      "td, th, [role='cell'], [role='gridcell']"
    );
    if (strictCell) {
      const strict = _tableCtxStrict(strictCell);
      if (strict) return strict;
    }
    let cur = el.parentElement;
    for (let depth = 0; depth < 12 && cur && cur.parentElement; depth++, cur = cur.parentElement) {
      const parent = cur.parentElement;
      const siblings = Array.from(parent.children);
      if (siblings.length < 2) continue;
      const rowCells = Array.from(cur.children);
      if (rowCells.length < 3) continue;
      const cellIdx = rowCells.findIndex((c) => c === el || c.contains(el));
      if (cellIdx < 0) continue;
      let headerSibling = null;
      const curIdx = siblings.indexOf(cur);
      for (let i = 0; i < curIdx; i++) {
        const sib = siblings[i];
        if (sib.querySelector("input, select, textarea")) continue;
        const directHeadings = Array.from(sib.children).filter(
          (c) => /^H[1-6]$|^TH$/.test(c.tagName) || c.getAttribute("role") === "columnheader"
        );
        if (directHeadings.length < 2) continue;
        if (Math.abs(sib.children.length - rowCells.length) > 2) continue;
        headerSibling = sib;
        break;
      }
      if (!headerSibling) continue;
      const headerCells = Array.from(headerSibling.children);
      if (cellIdx >= headerCells.length) continue;
      const colHeader = clean(
        (headerCells[cellIdx].innerText || "").replace(/\s+/g, " ")
      );
      if (!colHeader || isGenericText(colHeader)) continue;
      let rowKey = "";
      const firstCell = rowCells[0];
      if (firstCell && firstCell !== rowCells[cellIdx]) {
        const clone = firstCell.cloneNode(true);
        clone.querySelectorAll("input, select, textarea, button").forEach((i) => i.remove());
        rowKey = clean(clone.innerText);
      }
      if (!rowKey) {
        const dataRows = siblings.filter(
          (s) => s !== headerSibling && s.querySelector("input, select, textarea")
        );
        const idx = dataRows.indexOf(cur);
        if (idx >= 0) rowKey = `Row ${idx + 1}`;
      }
      if (!rowKey) continue;
      return { colHeader, rowKey };
    }
    return null;
  }
  function _tableCtxStrict(cell) {
    const row = cell.closest("tr, [role='row']");
    if (!row) return null;
    const table = row.closest("table, [role='table'], [role='grid']");
    if (!table) return null;
    const cellSel = "td, th, [role='cell'], [role='gridcell'], [role='columnheader']";
    const rowCells = Array.from(row.children).filter((c) => c.matches(cellSel));
    const cellIndex = rowCells.indexOf(cell);
    if (cellIndex < 0) return null;
    let headerCells = [];
    const thead = table.querySelector("thead");
    if (thead) {
      const headerRow = thead.querySelector("tr, [role='row']");
      if (headerRow) {
        headerCells = Array.from(headerRow.children).filter(
          (c) => c.matches("th, [role='columnheader']")
        );
      }
    }
    if (headerCells.length === 0) {
      const allRows = Array.from(table.querySelectorAll("tr, [role='row']"));
      const firstRow = allRows[0];
      if (firstRow && firstRow !== row) {
        headerCells = Array.from(firstRow.children).filter(
          (c) => c.matches("th, [role='columnheader']")
        );
      }
    }
    const colHeader = headerCells[cellIndex] && clean(headerCells[cellIndex].innerText);
    if (!colHeader) return null;
    let rowKey = "";
    if (rowCells[0] && rowCells[0] !== cell) {
      const clone = rowCells[0].cloneNode(true);
      clone.querySelectorAll("input, select, textarea, button").forEach((i) => i.remove());
      rowKey = clean(clone.innerText);
    }
    if (!rowKey) {
      const parent = row.parentElement;
      if (parent) {
        const siblingRows = Array.from(parent.children).filter(
          (r) => r.matches("tr, [role='row']")
        );
        const idx = siblingRows.indexOf(row);
        if (idx >= 0) rowKey = `Row ${idx + 1}`;
      }
    }
    if (!rowKey) return null;
    return { colHeader, rowKey };
  }
  function getEnrichedLabel(el) {
    const base = getSurroundingText(el);
    const tbl = getTableRowContext(el);
    if (!tbl) return base;
    const head = tbl.colHeader;
    if (base && base !== head && !base.includes(head)) {
      return `${head} [${tbl.rowKey}]`;
    }
    return `${head} [${tbl.rowKey}]`;
  }
  function getAllElementsDeep(root = document) {
    const elements = [];
    function traverse(node) {
      if (!node) return;
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.id && node.id.startsWith("__listify")) return;
        const tag = node.tagName;
        if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) {
          if (node.type !== "hidden" && node.type !== "submit" && node.type !== "button" && node.type !== "image") {
            if (node.id && node.id.startsWith("checkMarkOption_")) return;
            elements.push(node);
          }
        } else if ((tag === "DIV" || tag === "SPAN") && (node.getAttribute("role") === "button" || node.getAttribute("role") === "combobox" || node.getAttribute("aria-haspopup") === "listbox")) {
          elements.push(node);
        } else if (tag === "DIV" && node.classList.contains("MuiBox-root")) {
          const firstChild = node.firstElementChild;
          if (firstChild && firstChild.tagName.toLowerCase() === "svg" && node.querySelector(":scope > p, :scope > span")) {
            console.log(
              `[DEBUG SVG] getAllElementsDeep: Found SVG-toggle parent div. Node:`,
              node,
              `Label Text:`,
              node.textContent.trim()
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

  // extension/src/content/category.js
  function detectCurrentCategory() {
    const isGeneric = (t) => {
      if (!t) return true;
      const lower = t.toLowerCase().trim();
      return lower.length <= 1 || [
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
        "meesho"
      ].includes(lower) || /^(select|choose|enter|please|type|search)\s/i.test(lower);
    };
    const categoryLabels = document.querySelectorAll("label");
    const matchingLabels = [...categoryLabels].filter(
      (l) => /categor/i.test(l.textContent)
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
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])'
      );
      if (inp && !isGeneric(inp.value)) return inp.value.trim();
      const forId = lbl.getAttribute("for");
      if (forId) {
        const el = document.getElementById(forId);
        if (el && !isGeneric(el.value)) return el.value.trim();
      }
    }
    const attrMatches = document.querySelectorAll(
      '[aria-label*="ategory" i], [placeholder*="ategory" i], [name*="ategory" i]'
    );
    for (const el of attrMatches) {
      if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && !isGeneric(el.value)) {
        return el.value.trim();
      }
    }
    const selects = document.querySelectorAll("select");
    for (const sel of selects) {
      const ctx = ((sel.name || "") + " " + (sel.id || "") + " " + (sel.getAttribute("aria-label") || "")).toLowerCase();
      if (/categor/.test(ctx)) {
        const val = sel.options[sel.selectedIndex]?.text?.trim() || "";
        if (sel.selectedIndex > 0 && !isGeneric(val)) return val;
      }
    }
    return "";
  }
  function scrapeBreadcrumbCategory() {
    const guidelinesEl = document.querySelector(
      '[data-testid="imageGuidelines"]'
    );
    if (!guidelinesEl) return null;
    const breadcrumbP = guidelinesEl.querySelector("p");
    if (!breadcrumbP) return null;
    const fullPath = (breadcrumbP.textContent || "").trim();
    if (!fullPath || !fullPath.includes("/")) return null;
    const segments = fullPath.split("/").map((s) => s.trim()).filter(Boolean);
    const leaf = segments[segments.length - 1];
    sessionStorage.setItem("listify_tab_category_full", fullPath);
    return leaf || null;
  }

  // extension/src/content/main.js
  (function() {
    let chrome = window.chrome;
    if (!chrome) {
      chrome = window.chrome = {};
    }
    if (!chrome.runtime) {
      chrome.runtime = {
        sendMessage: () => Promise.resolve(null),
        onMessage: {
          addListener: () => {
          },
          removeListener: () => {
          }
        },
        getURL: () => "",
        id: ""
      };
    } else {
      if (chrome.runtime.sendMessage) {
        const origSendMessage = chrome.runtime.sendMessage;
        chrome.runtime.sendMessage = function(...args) {
          try {
            const res = origSendMessage.apply(chrome.runtime, args);
            if (res && typeof res.catch === "function") {
              return res.catch((err) => {
                if (err && err.message && err.message.includes("context invalidated")) {
                  return null;
                }
                throw err;
              });
            }
            return res;
          } catch (err) {
            return Promise.resolve(null);
          }
        };
      }
      if (chrome.runtime.getURL) {
        const origGetURL = chrome.runtime.getURL;
        chrome.runtime.getURL = function(...args) {
          try {
            return origGetURL.apply(chrome.runtime, args);
          } catch (_) {
            return "";
          }
        };
      }
      if (chrome.runtime.onMessage && chrome.runtime.onMessage.addListener) {
        const origAddListener = chrome.runtime.onMessage.addListener;
        chrome.runtime.onMessage.addListener = function(...args) {
          try {
            return origAddListener.apply(chrome.runtime.onMessage, args);
          } catch (_) {
          }
        };
      }
    }
    if (!chrome.storage) {
      chrome.storage = {
        local: {
          get: (keys, cb) => cb ? cb({}) : Promise.resolve({}),
          set: (vals, cb) => cb ? cb() : Promise.resolve(),
          remove: (keys, cb) => cb ? cb() : Promise.resolve()
        }
      };
    } else if (chrome.storage.local) {
      const origGet = chrome.storage.local.get;
      const origSet = chrome.storage.local.set;
      const origRemove = chrome.storage.local.remove;
      chrome.storage.local.get = function(...args) {
        try {
          return origGet.apply(chrome.storage.local, args);
        } catch (_) {
          const cb = args[1];
          if (typeof cb === "function") cb({});
          return Promise.resolve({});
        }
      };
      chrome.storage.local.set = function(...args) {
        try {
          return origSet.apply(chrome.storage.local, args);
        } catch (_) {
          const cb = args[1];
          if (typeof cb === "function") cb();
          return Promise.resolve();
        }
      };
      chrome.storage.local.remove = function(...args) {
        try {
          return origRemove.apply(chrome.storage.local, args);
        } catch (_) {
          const cb = args[1];
          if (typeof cb === "function") cb();
          return Promise.resolve();
        }
      };
    }
    if (window.__listifyCS) {
      let prevAlive = false;
      try {
        window.__listifyPing?.();
        prevAlive = true;
      } catch (_) {
      }
      if (prevAlive) return;
      try {
        document.getElementById("__listify_sidebar__")?.remove();
      } catch (_) {
      }
      try {
        document.getElementById("__listify_backdrop__")?.remove();
      } catch (_) {
      }
    }
    window.__listifyCS = true;
    window.__listifyPing = () => chrome.runtime?.getURL("");
    let _listifyAbortFill = false;
    console.log("Smart Autofill Content Script Loaded (v6.0)");
    (function syncListifyToken() {
      const host = window.location.hostname;
      if (host === "iprixmedia.com" || host.endsWith(".iprixmedia.com") || host === "localhost" || host === "127.0.0.1") {
        const syncNow = () => {
          try {
            const token = localStorage.getItem("listify_token");
            if (token) {
              chrome.storage?.local.set({ listify_token: token });
            } else {
              chrome.storage?.local.remove("listify_token");
            }
          } catch (_) {
          }
        };
        syncNow();
        window.addEventListener("storage", (e) => {
          if (e.key === "listify_token") syncNow();
        });
        setInterval(syncNow, 5e3);
        const syncCosts = () => {
          try {
            chrome.storage?.local.get(["listify_shipping_costs"], (stored) => {
              if (stored.listify_shipping_costs) {
                localStorage.setItem("listify_shipping_costs", JSON.stringify(stored.listify_shipping_costs));
              }
            });
          } catch (_) {
          }
        };
        syncCosts();
        setInterval(syncCosts, 5e3);
      }
    })();
    if (window !== window.top) return;
    function injectSidebar() {
      if (!chrome.runtime?.id) return;
      if (document.getElementById("__listify_sidebar__")) return;
      let popupUrl;
      try {
        popupUrl = chrome.runtime?.getURL("popup/popup.html");
      } catch (_) {
        return;
      }
      const backdrop = document.createElement("div");
      backdrop.id = "__listify_backdrop__";
      Object.assign(backdrop.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        background: "transparent",
        zIndex: "2147483645",
        opacity: "0",
        pointerEvents: "none"
      });
      const sidebar = document.createElement("div");
      sidebar.id = "__listify_sidebar__";
      Object.assign(sidebar.style, {
        position: "fixed",
        top: "0",
        right: "0",
        width: "420px",
        maxWidth: "100vw",
        height: "100%",
        zIndex: "2147483646",
        transform: "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.18)",
        borderRadius: "0",
        overflow: "hidden"
      });
      const iframe = document.createElement("iframe");
      iframe.src = popupUrl;
      Object.assign(iframe.style, {
        width: "100%",
        height: "100%",
        border: "none",
        display: "block"
      });
      sidebar.appendChild(iframe);
      document.documentElement.appendChild(backdrop);
      document.documentElement.appendChild(sidebar);
      backdrop.addEventListener("click", () => toggleSidebar(false));
    }
    function toggleSidebar(forceOpen) {
      let sidebar = document.getElementById("__listify_sidebar__");
      let backdrop = document.getElementById("__listify_backdrop__");
      if (!sidebar) {
        injectSidebar();
        sidebar = document.getElementById("__listify_sidebar__");
        backdrop = document.getElementById("__listify_backdrop__");
      }
      if (!sidebar) return;
      const isOpen = sidebar.dataset.open === "true";
      const open = forceOpen !== void 0 ? forceOpen : !isOpen;
      sidebar.dataset.open = open;
      sidebar.style.transform = open ? "translateX(0%)" : "translateX(100%)";
      if (backdrop) {
        backdrop.style.opacity = open ? "1" : "0";
        backdrop.style.pointerEvents = "none";
      }
    }
    let lastAutoOpenedUrl = "";
    function checkAutoOpenMeeshoSidebar() {
      if (!chrome.runtime?.id) return;
      const href = window.location.href;
      if (href.includes("meesho.com") && href.includes("/catalogs/single/")) {
        if (lastAutoOpenedUrl !== href) {
          lastAutoOpenedUrl = href;
          chrome.storage?.local.get(["listify_token"], (result) => {
            if (result.listify_token) {
              console.log("[LISTIFY] Auto-opening sidebar for Meesho listing page:", href);
              toggleSidebar(true);
            }
          });
        }
      }
    }
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      const d = event.data;
      if (!d || d.source !== "lisstify-dashboard") return;
      if (d.type === "BULK_FILL_SET_QUEUE" || d.type === "BULK_FILL_CLEAR_QUEUE") {
        chrome.runtime?.sendMessage(d).catch(() => {
        });
      }
    });
    chrome.runtime?.onMessage.addListener((msg) => {
      if (msg && msg.source === "lisstify-extension") {
        console.log("[LISTIFY CS] Relaying extension message to page:", msg.type);
        window.postMessage(msg, "*");
      }
    });
    chrome.runtime?.onMessage.addListener((request, _sender, sendResponse) => {
      (async () => {
        try {
          if (request.action === "TOGGLE_SIDEBAR") {
            toggleSidebar(request.forceOpen);
            sendResponse({ success: true });
          } else if (request.action === "scan_form") {
            const data = await scanForms();
            sendResponse({ success: true, data });
          } else if (request.action === "studio_field_audit") {
            const data = await buildStudioFieldAudit();
            sendResponse({ success: true, data });
          } else if (request.action === "studio_save_local_draft") {
            const draft = await scanForms();
            const key = `aplus_local_draft_${Date.now()}`;
            const slimDraft = {
              savedAt: (/* @__PURE__ */ new Date()).toISOString(),
              url: draft.url,
              domain: draft.domain,
              title: draft.title,
              category: draft.category,
              fields: draft.fields
            };
            localStorage.setItem(key, JSON.stringify(slimDraft));
            localStorage.setItem("aplus_last_local_draft_key", key);
            sendResponse({ success: true, key, count: draft.fields?.length || 0 });
          } else if (request.action === "fill_form") {
            if (window.__listify_is_filling) {
              sendResponse({ success: false, error: "Already filling" });
              return;
            }
            if (window.__listify_page_filled) {
              sendResponse({ success: false, error: "Already filled" });
              return;
            }
            window.__listify_is_filling = true;
            try {
              const result = await fillForm(request.data);
              sendResponse({ success: true, ...result });
            } finally {
              window.__listify_is_filling = false;
            }
          } else if (request.action === "abort_fill") {
            _listifyAbortFill = true;
            window.__listify_is_filling = false;
            sendResponse({ ok: true });
          } else if (request.action === "get_tab_category") {
            sendResponse({
              category: sessionStorage.getItem("listify_tab_category") || ""
            });
          } else if (request.action === "get_tab_category_dom") {
            const domCat = typeof detectCurrentCategory === "function" ? detectCurrentCategory() : "";
            const sessionCat = sessionStorage.getItem("listify_tab_category") || "";
            sendResponse({ category: sessionCat || domCat });
          } else if (request.action === "clear_tab_category") {
            sessionStorage.removeItem("listify_tab_category");
            sendResponse({ success: true });
          } else if (request.action === "get_current_url") {
            sendResponse({ url: window.location.href });
          } else if (request.action === "get_category_full") {
            const full = sessionStorage.getItem("listify_tab_category_full") || "";
            sendResponse({ categoryFull: full });
          } else if (request.action === "fk_click_add_single") {
            const btn = [
              ...document.querySelectorAll('button,a,[role="button"]')
            ].find((b) => /add\s+single/i.test(b.textContent));
            if (btn) {
              btn.click();
              sendResponse({ ok: true });
            } else {
              sendResponse({ ok: false, error: "Button not found" });
            }
          } else if (request.action === "meesho_select_category_live_test") {
            (async () => {
              const { categoryFull } = request;
              function normPath(p) {
                return (p || "").split(/\s*[\/\>]\s*/).map((s) => s.trim().toLowerCase()).join(" > ");
              }
              function waitFor(selectorFn, timeout = 1e4) {
                return new Promise((resolve, reject) => {
                  const el = selectorFn();
                  if (el) return resolve(el);
                  const obs = new MutationObserver(() => {
                    const found = selectorFn();
                    if (found) {
                      obs.disconnect();
                      clearTimeout(t);
                      resolve(found);
                    }
                  });
                  obs.observe(document.body, { childList: true, subtree: true });
                  const t = setTimeout(() => {
                    obs.disconnect();
                    reject(new Error("Timeout: element not found"));
                  }, timeout);
                });
              }
              try {
                console.log("[MEESHO LIVE TEST] Starting category auto-selection for:", categoryFull);
                const searchInput = await waitFor(
                  () => document.querySelector(
                    'input.MuiInputBase-input[placeholder*="Sarees" i],input.MuiInputBase-input[placeholder*="Try" i],input[placeholder*="Search" i],input[placeholder*="category" i],input[type="search"]'
                  )
                );
                searchInput.focus();
                searchInput.click();
                await new Promise((r) => setTimeout(r, 300));
                const nativeSetter = Object.getOwnPropertyDescriptor(
                  HTMLInputElement.prototype,
                  "value"
                )?.set;
                if (nativeSetter) nativeSetter.call(searchInput, "");
                searchInput.dispatchEvent(new Event("input", { bubbles: true }));
                await new Promise((r) => setTimeout(r, 100));
                if (nativeSetter) nativeSetter.call(searchInput, categoryFull);
                else searchInput.value = categoryFull;
                searchInput.dispatchEvent(new Event("input", { bubbles: true }));
                searchInput.dispatchEvent(new Event("change", { bubbles: true }));
                searchInput.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
                console.log("[MEESHO LIVE TEST] Typed path:", categoryFull);
                await new Promise((r) => setTimeout(r, 1500));
                const targetPath = normPath(categoryFull);
                const option = await waitFor(() => {
                  const items = [
                    ...document.querySelectorAll(
                      'li[class*="suggestion" i], li[class*="item" i], li[class*="option" i], ul li, [role="listbox"] li, [role="option"]'
                    )
                  ];
                  return items.find((el) => {
                    const t = normPath(el.textContent);
                    return t === targetPath || t.includes(targetPath);
                  });
                });
                option.click();
                console.log("[MEESHO LIVE TEST] Selected category successfully");
                await new Promise((r) => setTimeout(r, 1e3));
                const continueBtn = [...document.querySelectorAll('button,a,[role="button"]')].find(
                  (b) => /continue|add\s+single|next/i.test(b.textContent)
                );
                if (continueBtn) {
                  continueBtn.click();
                  console.log("[MEESHO LIVE TEST] Clicked continue button");
                }
                sendResponse({ ok: true });
              } catch (e) {
                console.error("[MEESHO LIVE TEST] Error selecting category:", e.message);
                sendResponse({ ok: false, error: e.message });
              }
            })();
            return true;
          } else if (request.action === "meesho_setup_catalog") {
            (async () => {
              const { categoryFull, imageUrl } = request;
              function normPath(p) {
                return (p || "").split(/\s*[\/\>]\s*/).map((s) => s.trim().toLowerCase()).join(" > ");
              }
              function waitFor(selectorFn, timeout = 1e4) {
                return new Promise((resolve, reject) => {
                  const el = selectorFn();
                  if (el) return resolve(el);
                  const obs = new MutationObserver(() => {
                    const found = selectorFn();
                    if (found) {
                      obs.disconnect();
                      clearTimeout(t);
                      resolve(found);
                    }
                  });
                  obs.observe(document.body, { childList: true, subtree: true });
                  const t = setTimeout(() => {
                    obs.disconnect();
                    reject(new Error("Timeout: element not found"));
                  }, timeout);
                });
              }
              try {
                const searchInput = await waitFor(
                  () => document.querySelector(
                    'input.MuiInputBase-input[placeholder*="Sarees" i],input.MuiInputBase-input[placeholder*="Try" i],input[placeholder*="Search" i],input[placeholder*="category" i],input[type="search"]'
                  )
                );
                searchInput.focus();
                searchInput.click();
                await new Promise((r) => setTimeout(r, 300));
                const nativeSetter = Object.getOwnPropertyDescriptor(
                  HTMLInputElement.prototype,
                  "value"
                )?.set;
                if (nativeSetter) nativeSetter.call(searchInput, "");
                searchInput.dispatchEvent(new Event("input", { bubbles: true }));
                await new Promise((r) => setTimeout(r, 100));
                if (nativeSetter) nativeSetter.call(searchInput, categoryFull);
                else searchInput.value = categoryFull;
                searchInput.dispatchEvent(new Event("input", { bubbles: true }));
                searchInput.dispatchEvent(new Event("change", { bubbles: true }));
                searchInput.dispatchEvent(
                  new KeyboardEvent("keyup", { bubbles: true })
                );
                console.log("[MEESHO SETUP] Typed full path:", categoryFull);
                await new Promise((r) => setTimeout(r, 1500));
                const targetPath = normPath(categoryFull);
                const option = await waitFor(() => {
                  const items = [
                    ...document.querySelectorAll(
                      'li[class*="suggestion" i], li[class*="item" i], li[class*="option" i], ul li, [role="listbox"] li, [role="option"]'
                    )
                  ];
                  console.log(
                    "[MEESHO SETUP] Dropdown items found:",
                    items.length,
                    items.map((i) => i.textContent.trim().slice(0, 60))
                  );
                  return items.find((el) => {
                    const t = normPath(el.textContent);
                    return t === targetPath || t.includes(targetPath);
                  });
                });
                option.click();
                console.log("[MEESHO SETUP] Selected:", categoryFull);
                const addImgBtn = await waitFor(
                  () => [...document.querySelectorAll('button,a,[role="button"]')].find(
                    (b) => /add\s+product\s+image/i.test(b.textContent)
                  )
                );
                addImgBtn.click();
                console.log('[MEESHO SETUP] Clicked "Add Product Images"');
                if (imageUrl) {
                  const fileInput = await waitFor(
                    () => document.querySelector('input[type="file"]')
                  );
                  const res = await fetch(imageUrl);
                  const blob = await res.blob();
                  const ext = (imageUrl.split(".").pop().split("?")[0] || "jpg").toLowerCase();
                  const file = new File([blob], `product.${ext}`, {
                    type: blob.type || "image/jpeg"
                  });
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  fileInput.files = dt.files;
                  fileInput.dispatchEvent(new Event("change", { bubbles: true }));
                  console.log("[MEESHO SETUP] Image uploaded:", imageUrl);
                }
                const continueBtn = await waitFor(
                  () => [
                    ...document.querySelectorAll(
                      "button.MuiButton-containedPrimary"
                    )
                  ].find((b) => /continue/i.test(b.textContent))
                );
                continueBtn.click();
                console.log("[MEESHO SETUP] Clicked Continue");
                sendResponse({ ok: true });
              } catch (e) {
                console.error("[MEESHO SETUP] Error:", e.message);
                sendResponse({ ok: false, error: e.message });
              }
            })();
            return;
          } else if (request.action === "bulk_fill_row") {
            if (window.__listify_is_filling) {
              sendResponse({ ok: false, error: "Already filling" });
              return;
            }
            window.__listify_is_filling = true;
            try {
              const rowData = request.rowData || {};
              const result = await fillForm(
                {
                  fields: rowData.fields || [],
                  category: rowData.category || ""
                },
                { resolvedCategory: "bulk" }
              );
              showToast(
                `Filled ${result.filledCount} fields \u2014 saving\u2026`,
                result.filledCount > 0 ? "success" : "warning"
              );
              sendResponse({ ok: true, templateId: request.templateId, ...result });
            } catch (e) {
              sendResponse({ ok: false, error: e.message });
            } finally {
              window.__listify_is_filling = false;
            }
          } else if (request.action === "meesho_click_continue") {
            const btn = [
              ...document.querySelectorAll("button.MuiButton-containedPrimary")
            ].find((b) => /continue/i.test(b.textContent));
            if (btn) {
              btn.click();
              console.log("[MEESHO] Clicked Continue");
              sendResponse({ ok: true });
            } else {
              sendResponse({ ok: false, error: "Continue button not found" });
            }
          } else if (request.action === "bulk_fill_next") {
            if (window.__listify_is_filling) {
              sendResponse({ ok: false, error: "Already filling" });
              return;
            }
            window.__listify_is_filling = true;
            try {
              const stored = await new Promise(
                (resolve) => chrome.storage?.local.get(
                  [
                    "listify_bulk_queue",
                    "listify_bulk_index",
                    "listify_bulk_total",
                    "listify_bulk_active",
                    "listify_bulk_template_url"
                  ],
                  resolve
                )
              );
              if (!stored.listify_bulk_active) {
                sendResponse({ ok: false, error: "No active bulk fill queue" });
                return;
              }
              const queue = stored.listify_bulk_queue || [];
              const idx = stored.listify_bulk_index || 0;
              if (idx >= queue.length) {
                chrome.storage?.local.remove([
                  "listify_bulk_active",
                  "listify_bulk_queue",
                  "listify_bulk_index",
                  "listify_bulk_total",
                  "listify_bulk_template_id",
                  "listify_bulk_template_url"
                ]);
                sendResponse({ ok: false, error: "Queue complete" });
                return;
              }
              const rowData = queue[idx];
              const result = await fillForm(
                {
                  fields: rowData.fields || [],
                  category: rowData.category || ""
                },
                { resolvedCategory: "bulk" }
              );
              const isLast = idx + 1 >= queue.length;
              const nextIdx = idx + 1;
              await new Promise(
                (resolve) => chrome.storage?.local.set(
                  { listify_bulk_index: nextIdx },
                  resolve
                )
              );
              showToast(
                `Row ${idx + 1}/${queue.length} filled (${result.filledCount} fields) \u2014 saving\u2026`,
                result.filledCount > 0 ? "success" : "warning"
              );
              sendResponse({ ok: true, rowIndex: idx + 1, isLast, templateId: stored.listify_bulk_template_id, ...result });
            } catch (e) {
              sendResponse({ ok: false, error: e.message });
            } finally {
              window.__listify_is_filling = false;
            }
          } else if (request.action === "bulk_auto_save") {
            const saved = bulkAutoClickSave();
            sendResponse({ ok: true, saved });
          } else if (request.action === "sl_upload_images") {
            sendResponse({ ok: true });
            (async () => {
              const urls = request.imageUrls || [];
              console.log(`%c[SL IMG CS] sl_upload_images received. URLs: ${urls.length}`, "color:#E91E63;font-weight:bold", urls);
              if (!urls.length) {
                console.warn("[SL IMG CS] No URLs in message \u2014 nothing to upload");
                return;
              }
              const byId = document.getElementById("addMoreImagesInput");
              const byTest = document.querySelector('[data-testid="addMoreImagesInput"]');
              const fileInput = byId || byTest;
              console.log(`[SL IMG CS] getElementById: ${byId ? "FOUND" : "null"}, querySelector testid: ${byTest ? "FOUND" : "null"}`);
              if (!fileInput) {
                console.error("[SL IMG CS] \u274C File input NOT FOUND in DOM");
                const allFileInputs = document.querySelectorAll('input[type="file"]');
                console.log(
                  `[SL IMG CS] All file inputs on page (${allFileInputs.length}):`,
                  Array.from(allFileInputs).map((i) => ({ id: i.id, testid: i.dataset.testid, class: i.className, accept: i.accept }))
                );
                showToast("Image upload field not found \u2014 scroll to image section first", "warning");
                return;
              }
              console.log(`[SL IMG CS] \u2713 File input found:`, { id: fileInput.id, testid: fileInput.dataset.testid, accept: fileInput.accept, multiple: fileInput.multiple });
              {
                const IMG_DELETE_SEL = 'button[aria-label="Remove image"], button[aria-label="Delete image"], button[aria-label="remove image"], button[aria-label="delete image"], [data-testid="removeImage"], [data-testid="deleteImage"], [data-testid="remove-image"], [data-testid="delete-image"]';
                let imgContainer = fileInput.parentElement;
                let cleared = 0;
                for (let depth = 0; depth < 3 && imgContainer; depth++, imgContainer = imgContainer.parentElement) {
                  if (imgContainer.querySelector(IMG_DELETE_SEL)) {
                    for (let attempt = 0; attempt < 10; attempt++) {
                      const btn = imgContainer.querySelector(IMG_DELETE_SEL);
                      if (!btn) break;
                      btn.click();
                      cleared++;
                      await new Promise((r) => setTimeout(r, 200));
                    }
                    if (cleared > 0) await new Promise((r) => setTimeout(r, 300));
                    console.log(`[SL IMG CS] Cleared ${cleared} existing image(s)`);
                    break;
                  }
                }
              }
              showToast(`Uploading ${urls.length} image${urls.length > 1 ? "s" : ""}\u2026`, "info");
              const dt = new DataTransfer();
              let uploaded = 0;
              for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                console.log(`[SL IMG CS] Fetching image ${i + 1}/${urls.length}: ${url}`);
                try {
                  const imgRes = await new Promise(
                    (resolve) => chrome.runtime?.sendMessage({ action: "fk_fetch_image", url }, resolve)
                  );
                  console.log(`[SL IMG CS] fk_fetch_image response for img ${i + 1}:`, {
                    ok: imgRes?.ok,
                    type: imgRes?.type,
                    hasDataUrl: !!imgRes?.dataUrl,
                    dataUrlPrefix: imgRes?.dataUrl?.substring(0, 40),
                    lastError: chrome.runtime?.lastError?.message
                  });
                  if (!imgRes?.ok) {
                    console.warn(`[SL IMG CS] \u274C Fetch failed for img ${i + 1} (ok=false)`);
                    continue;
                  }
                  if (!imgRes.dataUrl) {
                    console.warn(`[SL IMG CS] \u274C No dataUrl in response for img ${i + 1}`);
                    continue;
                  }
                  const mimeType = imgRes.type || "image/jpeg";
                  const base64 = imgRes.dataUrl.split(",")[1];
                  if (!base64) {
                    console.warn(`[SL IMG CS] \u274C Could not extract base64 from dataUrl for img ${i + 1}`);
                    continue;
                  }
                  const binary = atob(base64);
                  const bytes = new Uint8Array(binary.length);
                  for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
                  const blob = new Blob([bytes], { type: mimeType });
                  const ext = mimeType.includes("png") ? "png" : "jpg";
                  const rawName = url.split("/").pop().split("?")[0] || `image-${i + 1}.${ext}`;
                  const file = new File([blob], rawName, { type: mimeType });
                  console.log(`[SL IMG CS] \u2713 Built File: name="${file.name}" size=${file.size} type="${file.type}"`);
                  dt.items.add(file);
                  uploaded++;
                } catch (err) {
                  console.error(`[SL IMG CS] \u274C Exception for img ${i + 1}:`, err);
                }
              }
              console.log(`[SL IMG CS] Fetch loop done. uploaded=${uploaded}, dt.files.length=${dt.files.length}`);
              if (uploaded === 0) {
                console.error("[SL IMG CS] \u274C 0 images built \u2014 aborting");
                showToast("Could not fetch images from smart listing", "error");
                return;
              }
              console.log(`[SL IMG CS] Setting fileInput.files with ${dt.files.length} file(s)\u2026`);
              fileInput.files = dt.files;
              console.log(`[SL IMG CS] fileInput.files.length after set: ${fileInput.files.length}`);
              fileInput.dispatchEvent(new Event("change", { bubbles: true }));
              console.log("[SL IMG CS] dispatched 'change'");
              fileInput.dispatchEvent(new Event("input", { bubbles: true }));
              console.log("[SL IMG CS] dispatched 'input'");
              showToast(`${uploaded} image${uploaded > 1 ? "s" : ""} uploaded \u2713`, "success");
              console.log(`%c[SL IMG CS] \u2705 Done \u2014 ${uploaded} image(s) set on #addMoreImagesInput`, "color:#1a9e5a;font-weight:bold");
            })();
          } else if (request.action === "show_toast") {
            showToast(request.message, request.toastType);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: "Unknown action" });
          }
        } catch (error) {
          console.error("Content script error:", error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    });
    function bulkAutoClickSave() {
      const priority = [
        "save & continue",
        "save and continue",
        "save",
        "submit",
        "next",
        "continue"
      ];
      const allBtns = Array.from(
        document.querySelectorAll("button:not([disabled])")
      );
      for (const keyword of priority) {
        const btn = allBtns.find((b) => {
          const t = (b.innerText || b.textContent || "").trim().toLowerCase();
          return t === keyword || t.startsWith(keyword);
        });
        if (btn) {
          const r = btn.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            console.log(
              `[LISTIFY BULK] Auto-clicking: "${btn.innerText.trim()}"`
            );
            btn.click();
            return true;
          }
        }
      }
      console.warn("[LISTIFY BULK] No save button found");
      return false;
    }
    (function watchBreadcrumb() {
      if (window !== window.top) return;
      if (!window.location.hostname.includes("meesho")) return;
      function tryScrapeBreadcrumb() {
        const el = document.querySelector('[data-testid="imageGuidelines"]');
        if (el) scrapeBreadcrumbCategory();
      }
      tryScrapeBreadcrumb();
      const obs = new MutationObserver(tryScrapeBreadcrumb);
      obs.observe(document.body, { childList: true, subtree: true });
    })();
    (function watchMeeshoLibrary() {
      if (!window.location.hostname.includes("supplier.meesho.com")) return;
      const BTN_ID = "__listify_library_btn__";
      const PANEL_ID = "__listify_library_panel__";
      let _interceptorInjected = false;
      function injectFetchInterceptor() {
        if (_interceptorInjected) {
          console.log("[LISTIFY] interceptor already requested");
          return Promise.resolve();
        }
        _interceptorInjected = true;
        return new Promise((resolve) => {
          chrome.runtime?.sendMessage({ action: "inject_transfer_interceptor" }, (res) => {
            if (chrome.runtime?.lastError) {
              console.error("[LISTIFY] inject_transfer_interceptor error:", chrome.runtime?.lastError.message);
            } else {
              console.log("[LISTIFY] inject_transfer_interceptor result:", res);
            }
            resolve(res);
          });
        });
      }
      const _priceListeners = [];
      window.addEventListener("message", (e) => {
        if (!e.data || e.data.__listify !== "transferPrice") return;
        console.log("[LISTIFY] received transferPrice postMessage:", e.data.data);
        const cb = _priceListeners.shift();
        if (cb) cb(e.data.data);
        else console.log("[LISTIFY] no listener waiting for price data");
      });
      function waitForPrice(ms) {
        ms = ms || 7e3;
        console.log("[LISTIFY] waitForPrice started, timeout:", ms, "ms, listeners in queue:", _priceListeners.length);
        return new Promise((resolve) => {
          let wrapped;
          const t = setTimeout(() => {
            const idx = _priceListeners.indexOf(wrapped);
            if (idx >= 0) _priceListeners.splice(idx, 1);
            console.log("[LISTIFY] waitForPrice TIMED OUT after", ms, "ms");
            resolve(null);
          }, ms);
          wrapped = (data) => {
            clearTimeout(t);
            console.log("[LISTIFY] waitForPrice resolved:", data);
            resolve(data);
          };
          _priceListeners.push(wrapped);
        });
      }
      function isOnStep2() {
        return /\/catalogs\/single\/add/.test(window.location.href);
      }
      function injectLibraryButton() {
        if (document.getElementById(BTN_ID)) return;
        if (!isOnStep2()) return;
        if (!document.body) return;
        const btn = document.createElement("button");
        btn.id = BTN_ID;
        btn.type = "button";
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>&nbsp;A+ Studio Library`;
        const s = btn.style;
        s.setProperty("position", "fixed", "important");
        s.setProperty("bottom", "100px", "important");
        s.setProperty("left", "24px", "important");
        s.setProperty("z-index", "2147483640", "important");
        s.setProperty("padding", "11px 20px", "important");
        s.setProperty("background", "#09090b", "important");
        s.setProperty("color", "#fff", "important");
        s.setProperty("border", "none", "important");
        s.setProperty("border-radius", "50px", "important");
        s.setProperty("font-size", "13px", "important");
        s.setProperty("font-weight", "700", "important");
        s.setProperty("cursor", "pointer", "important");
        s.setProperty("display", "flex", "important");
        s.setProperty("align-items", "center", "important");
        s.setProperty("gap", "7px", "important");
        s.setProperty("font-family", "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", "important");
        s.setProperty("box-shadow", "0 4px 20px rgba(0,0,0,0.18)", "important");
        s.setProperty("white-space", "nowrap", "important");
        s.setProperty("transition", "opacity 0.15s, transform 0.15s", "important");
        btn.addEventListener("mouseover", () => {
          s.setProperty("opacity", "0.88", "important");
          s.setProperty("transform", "scale(1.04)", "important");
        });
        btn.addEventListener("mouseout", () => {
          s.setProperty("opacity", "1", "important");
          s.setProperty("transform", "scale(1)", "important");
        });
        btn.addEventListener("click", openLibraryPanel);
        document.body.appendChild(btn);
        console.log("[LISTIFY] Library button injected on Meesho Step 2");
      }
      function openLibraryPanel() {
        document.getElementById(PANEL_ID)?.remove();
        if (!document.getElementById("__listify_lib_spin__")) {
          const st = document.createElement("style");
          st.id = "__listify_lib_spin__";
          st.textContent = "@keyframes __listify_lib_spin__ { to { transform: rotate(360deg); } }";
          document.head.appendChild(st);
        }
        const backdrop = document.createElement("div");
        backdrop.id = PANEL_ID;
        Object.assign(backdrop.style, {
          position: "fixed",
          inset: "0",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
          zIndex: "2147483646",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
        });
        const modal = document.createElement("div");
        Object.assign(modal.style, {
          background: "#fff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "700px",
          maxHeight: "82vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
          overflow: "hidden"
        });
        const hdr = document.createElement("div");
        Object.assign(hdr.style, {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 20px 14px",
          borderBottom: "1px solid #e5e7eb",
          flexShrink: "0"
        });
        const hdrLeft = document.createElement("div");
        hdrLeft.innerHTML = `
        <div style="font-size:16px;font-weight:700;color:#111;margin-bottom:2px">A+ Studio Image Library</div>
        <div style="font-size:12px;color:#6b7280">Select a generated image to use as the product image</div>
      `;
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "\u2715";
        Object.assign(closeBtn.style, {
          background: "none",
          border: "none",
          fontSize: "20px",
          cursor: "pointer",
          color: "#6b7280",
          padding: "4px 8px",
          borderRadius: "6px"
        });
        closeBtn.addEventListener("click", () => backdrop.remove());
        hdr.appendChild(hdrLeft);
        hdr.appendChild(closeBtn);
        const content = document.createElement("div");
        Object.assign(content.style, { flex: "1", overflowY: "auto", padding: "16px" });
        content.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:60px 0;"><div style="width:32px;height:32px;border:3px solid #e5e7eb;border-top-color:#09090b;border-radius:50%;animation:__listify_lib_spin__ 0.8s linear infinite;"></div></div>`;
        modal.appendChild(hdr);
        modal.appendChild(content);
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
        backdrop.addEventListener("click", (e) => {
          if (e.target === backdrop) backdrop.remove();
        });
        chrome.runtime?.sendMessage({ action: "fetch_lisstify_generations" }, (res) => {
          if (chrome.runtime?.lastError || !res?.ok) {
            content.innerHTML = `<div style="text-align:center;padding:40px;color:#6b7280;font-size:14px;line-height:1.6;">
            Could not load images.<br><br>
            <strong style="color:#111;">To fix this:</strong><br>
            1. Open <a href="https://aplusstudio.iprixmedia.com" target="_blank" style="color:#09090b;text-decoration:underline;">aplusstudio.iprixmedia.com</a> in a new tab and sign in<br>
            2. Come back here and click <strong>A+ Studio Library</strong> again
          </div>`;
            return;
          }
          const generations = Array.isArray(res.data) ? res.data : res.data?.generations || [];
          if (!generations.length) {
            content.innerHTML = `<div style="text-align:center;padding:40px;color:#6b7280;font-size:14px;">No generated images found.<br>Create some in the A+ Studio Image Maker dashboard first!</div>`;
            return;
          }
          content.innerHTML = "";
          let shippingCosts = {};
          let selectedUrl = null;
          let lastFolderGen = null;
          let lastFolderName = "";
          let _priceNudgeDir = 1;
          function _fmtGenLabel(gen) {
            const cat = gen.category && gen.category.toLowerCase() !== "other" ? gen.category : "Product";
            if (!gen.createdAt) return cat;
            const d = new Date(gen.createdAt);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const h = d.getHours();
            const m = String(d.getMinutes()).padStart(2, "0");
            const ampm = h >= 12 ? "PM" : "AM";
            const hour = h % 12 || 12;
            return `${cat} \xB7 ${months[d.getMonth()]} ${d.getDate()}, ${hour}:${m} ${ampm}`;
          }
          async function _nudgeMeeshoPrice() {
            for (let attempt = 0; attempt < 15; attempt++) {
              await new Promise((r) => setTimeout(r, 400));
              const input = document.getElementById("meesho_price");
              if (!input) continue;
              const current = parseFloat(input.value);
              if (isNaN(current)) continue;
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
              setter.call(input, String(current + _priceNudgeDir));
              input.dispatchEvent(new Event("input", { bubbles: true }));
              input.dispatchEvent(new Event("change", { bubbles: true }));
              input.dispatchEvent(new Event("blur", { bubbles: true }));
              _priceNudgeDir *= -1;
              return true;
            }
            return false;
          }
          async function runFindBest(gen, folderName) {
            const images = (gen.generatedImages || []).filter(Boolean);
            if (!images.length) {
              showToast("No images in this folder", "error");
              return;
            }
            await injectFetchInterceptor();
            console.log("[LISTIFY] interceptor ready, starting image tests");
            useBtn.style.display = "none";
            const origCancelText = cancelBtn.textContent;
            cancelBtn.textContent = "Stop";
            let stopped = false;
            const stopHandler = () => {
              stopped = true;
              backdrop.remove();
            };
            cancelBtn.removeEventListener("click", cancelBtn._listifyHandler || (() => {
            }));
            cancelBtn._listifyHandler = stopHandler;
            cancelBtn.addEventListener("click", stopHandler);
            content.innerHTML = "";
            const pw = document.createElement("div");
            Object.assign(pw.style, { padding: "16px 0" });
            const folderLbl = document.createElement("div");
            Object.assign(folderLbl.style, { fontSize: "11px", color: "#9ca3af", marginBottom: "10px", textAlign: "center" });
            folderLbl.textContent = folderName;
            const titleEl = document.createElement("div");
            Object.assign(titleEl.style, { fontSize: "15px", fontWeight: "700", color: "#111", marginBottom: "4px", textAlign: "center" });
            titleEl.textContent = "Finding best image\u2026";
            const subEl = document.createElement("div");
            Object.assign(subEl.style, { fontSize: "12px", color: "#6b7280", marginBottom: "14px", textAlign: "center" });
            subEl.textContent = `Testing 1 of ${images.length}`;
            const thumbWrap = document.createElement("div");
            Object.assign(thumbWrap.style, { display: "flex", justifyContent: "center", marginBottom: "14px" });
            const thumbEl = document.createElement("img");
            Object.assign(thumbEl.style, {
              width: "100px",
              height: "100px",
              objectFit: "contain",
              border: "2px solid #e5e7eb",
              borderRadius: "10px",
              background: "#f9fafb"
            });
            thumbWrap.appendChild(thumbEl);
            const barWrap = document.createElement("div");
            Object.assign(barWrap.style, { height: "4px", background: "#f3f4f6", borderRadius: "2px", overflow: "hidden", marginBottom: "14px" });
            const barFill = document.createElement("div");
            Object.assign(barFill.style, { height: "100%", background: "#09090b", borderRadius: "2px", width: "0%", transition: "width 0.4s" });
            barWrap.appendChild(barFill);
            const logList = document.createElement("div");
            Object.assign(logList.style, {
              borderTop: "1px solid #f0f0f0",
              paddingTop: "10px",
              maxHeight: "180px",
              overflowY: "auto"
            });
            pw.appendChild(folderLbl);
            pw.appendChild(titleEl);
            pw.appendChild(subEl);
            pw.appendChild(thumbWrap);
            pw.appendChild(barWrap);
            pw.appendChild(logList);
            content.appendChild(pw);
            const results = [];
            const priceSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            let nudgeDir = 1;
            for (let i = 0; i < images.length; i++) {
              if (stopped) break;
              const url = images[i];
              subEl.textContent = `Testing ${i + 1} of ${images.length}\u2026`;
              thumbEl.src = url;
              barFill.style.width = `${Math.round(i / images.length * 100)}%`;
              const imgRes = await new Promise((r) => chrome.runtime?.sendMessage({ action: "fk_fetch_image", url }, r));
              if (!imgRes?.ok || stopped) {
                _logRow(logList, i + 1, url, null, "fetch failed");
                continue;
              }
              let file;
              try {
                const mt = imgRes.type || "image/jpeg";
                const bin = atob(imgRes.dataUrl.split(",")[1]);
                const bytes = new Uint8Array(bin.length);
                for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
                file = new File([new Blob([bytes], { type: mt })], `lst.${mt.includes("png") ? "png" : "jpg"}`, { type: mt });
              } catch (_) {
                _logRow(logList, i + 1, url, null, "build failed");
                continue;
              }
              const fi = document.querySelector('[data-testid="changeFrontImage"]') || document.getElementById("changeFrontImage") || document.querySelector('input[type="file"]');
              if (!fi) {
                _logRow(logList, i + 1, url, null, "no file input");
                break;
              }
              const dt = new DataTransfer();
              dt.items.add(file);
              fi.files = dt.files;
              fi.dispatchEvent(new Event("change", { bubbles: true }));
              fi.dispatchEvent(new Event("input", { bubbles: true }));
              await new Promise((r) => setTimeout(r, 2e3));
              if (stopped) break;
              const priceInput = document.getElementById("meesho_price");
              if (!priceInput) {
                console.log("[LISTIFY] #meesho_price not found on page");
                _logRow(logList, i + 1, url, null, "no price field");
                break;
              }
              const curVal = parseFloat(priceInput.value);
              console.log("[LISTIFY] nudging #meesho_price:", curVal, "->", curVal + nudgeDir);
              if (!isNaN(curVal)) {
                priceSetter.call(priceInput, String(curVal + nudgeDir));
                priceInput.dispatchEvent(new Event("input", { bubbles: true }));
                priceInput.dispatchEvent(new Event("change", { bubbles: true }));
                priceInput.dispatchEvent(new Event("blur", { bubbles: true }));
                nudgeDir *= -1;
              }
              console.log("[LISTIFY] waiting for getTransferPrice response for image", i + 1);
              const apiData = await waitForPrice(7e3);
              console.log("[LISTIFY] apiData received:", apiData);
              if (stopped) break;
              const shipping = apiData?.shipping_charges;
              _logRow(logList, i + 1, url, shipping, shipping == null ? "timeout" : null);
              if (shipping != null) results.push({ url, shipping, idx: i + 1 });
              barFill.style.width = `${Math.round((i + 1) / images.length * 100)}%`;
            }
            if (stopped) return;
            if (!results.length) {
              titleEl.textContent = "No shipping data received";
              subEl.textContent = "API responses timed out \u2014 try again.";
              useBtn.style.display = "";
              useBtn.textContent = "Back to Folders";
              useBtn.disabled = false;
              useBtn.style.opacity = "1";
              useBtn.style.cursor = "pointer";
              const handler = () => {
                useBtn.style.display = "none";
                renderFolders();
              };
              useBtn.addEventListener("click", handler, { once: true });
              cancelBtn.textContent = origCancelText;
              cancelBtn.removeEventListener("click", stopHandler);
              cancelBtn.addEventListener("click", () => backdrop.remove());
              return;
            }
            const best = results.reduce((a, b) => a.shipping <= b.shipping ? a : b);
            const worst = Math.max(...results.map((r) => r.shipping));
            const savings = worst - best.shipping;
            titleEl.textContent = `Best image found!`;
            subEl.textContent = `Image ${best.idx} \u2014 \u20B9${best.shipping} shipping${savings > 0 ? ` (saves \u20B9${savings})` : ""}`;
            thumbEl.src = best.url;
            thumbEl.style.borderColor = "#09090b";
            barFill.style.width = "90%";
            const winRes = await new Promise((r) => chrome.runtime?.sendMessage({ action: "fk_fetch_image", url: best.url }, r));
            if (winRes?.ok) {
              try {
                const mt = winRes.type || "image/jpeg";
                const bin = atob(winRes.dataUrl.split(",")[1]);
                const bytes = new Uint8Array(bin.length);
                for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
                const wfile = new File([new Blob([bytes], { type: mt })], `lst.${mt.includes("png") ? "png" : "jpg"}`, { type: mt });
                const fi = document.querySelector('[data-testid="changeFrontImage"]') || document.getElementById("changeFrontImage") || document.querySelector('input[type="file"]');
                if (fi) {
                  const dt = new DataTransfer();
                  dt.items.add(wfile);
                  fi.files = dt.files;
                  fi.dispatchEvent(new Event("change", { bubbles: true }));
                  fi.dispatchEvent(new Event("input", { bubbles: true }));
                }
              } catch (_) {
              }
            }
            titleEl.textContent = "Applying best image\u2026";
            subEl.textContent = "Please wait\u2026";
            await new Promise((r) => setTimeout(r, 2e3));
            barFill.style.width = "100%";
            chrome.storage?.local.get(["listify_shipping_costs"], (stored) => {
              const costs = stored.listify_shipping_costs || {};
              const newCosts = {};
              for (const r of results) {
                costs[r.url] = r.shipping;
                newCosts[r.url] = r.shipping;
              }
              chrome.storage?.local.set({ listify_shipping_costs: costs });
              for (const r of results) shippingCosts[r.url] = r.shipping;
              chrome.runtime?.sendMessage({ action: "save_shipping_costs", costs: newCosts });
            });
            backdrop.remove();
            await _nudgeMeeshoPrice();
            showToast(`Best image applied \u2713  Shipping: \u20B9${best.shipping}${savings > 0 ? `  (saves \u20B9${savings} vs worst)` : ""}`, "success");
          }
          function _logRow(list, num, url, shipping, errMsg) {
            const row = document.createElement("div");
            Object.assign(row.style, {
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "5px 0",
              borderBottom: "1px solid #f9f9f9"
            });
            const th = document.createElement("img");
            th.src = url;
            Object.assign(th.style, {
              width: "32px",
              height: "32px",
              objectFit: "contain",
              background: "#f9fafb",
              borderRadius: "4px",
              flexShrink: "0"
            });
            const lbl = document.createElement("div");
            lbl.style.flex = "1";
            lbl.innerHTML = `<span style="font-size:11px;color:#6b7280;">Image ${num}</span>`;
            const val = document.createElement("div");
            Object.assign(val.style, { fontSize: "13px", fontWeight: "700", flexShrink: "0" });
            if (shipping != null) {
              val.style.color = "#111";
              val.textContent = `\u20B9${shipping}`;
            } else {
              val.style.color = "#9ca3af";
              val.textContent = errMsg || "\u2014";
            }
            row.appendChild(th);
            row.appendChild(lbl);
            row.appendChild(val);
            list.appendChild(row);
            list.scrollTop = list.scrollHeight;
          }
          const footer = document.createElement("div");
          Object.assign(footer.style, {
            display: "flex",
            gap: "10px",
            padding: "14px 20px",
            borderTop: "1px solid #e5e7eb",
            flexShrink: "0"
          });
          const cancelBtn = document.createElement("button");
          cancelBtn.textContent = "Cancel";
          Object.assign(cancelBtn.style, {
            flex: "1",
            padding: "9px 16px",
            background: "none",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "500",
            color: "#6b7280",
            cursor: "pointer"
          });
          cancelBtn.addEventListener("click", () => backdrop.remove());
          const useBtn = document.createElement("button");
          useBtn.textContent = "Use This Image";
          useBtn.disabled = true;
          Object.assign(useBtn.style, {
            flex: "2",
            padding: "9px 16px",
            background: "#09090b",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "not-allowed",
            opacity: "0.4",
            transition: "opacity 0.15s"
          });
          function renderFolders() {
            selectedUrl = null;
            useBtn.textContent = "Use This Image";
            useBtn.disabled = true;
            useBtn.style.opacity = "0.4";
            useBtn.style.cursor = "not-allowed";
            content.innerHTML = "";
            const grid = document.createElement("div");
            Object.assign(grid.style, {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
              gap: "12px",
              padding: "4px 0 8px"
            });
            for (const gen of generations) {
              if (!gen.generatedImages?.length) continue;
              const folderName = _fmtGenLabel(gen);
              const count = gen.generatedImages.length;
              const card = document.createElement("div");
              Object.assign(card.style, {
                border: "1.5px solid #e5e7eb",
                borderRadius: "10px",
                overflow: "hidden",
                cursor: "pointer",
                background: "#fff",
                transition: "border-color 0.15s, box-shadow 0.15s, transform 0.1s"
              });
              card.addEventListener("mouseover", () => {
                card.style.borderColor = "#09090b";
                card.style.boxShadow = "0 4px 14px rgba(0,0,0,0.08)";
                card.style.transform = "translateY(-2px)";
              });
              card.addEventListener("mouseout", () => {
                card.style.borderColor = "#e5e7eb";
                card.style.boxShadow = "none";
                card.style.transform = "none";
              });
              const thumbWrap = document.createElement("div");
              Object.assign(thumbWrap.style, { position: "relative" });
              const thumb = document.createElement("img");
              thumb.src = gen.generatedImages[0];
              thumb.loading = "lazy";
              Object.assign(thumb.style, {
                width: "100%",
                aspectRatio: "1",
                objectFit: "contain",
                display: "block",
                background: "#f3f4f6",
                padding: "10px",
                boxSizing: "border-box"
              });
              const info = document.createElement("div");
              Object.assign(info.style, {
                padding: "8px 10px 10px",
                borderTop: "1px solid #f0f0f0"
              });
              const nameEl = document.createElement("div");
              Object.assign(nameEl.style, {
                fontSize: "11px",
                fontWeight: "700",
                color: "#111",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: "3px"
              });
              nameEl.title = folderName;
              nameEl.textContent = folderName;
              const countEl = document.createElement("div");
              Object.assign(countEl.style, { fontSize: "10px", color: "#9ca3af" });
              countEl.textContent = `${count} image${count !== 1 ? "s" : ""}`;
              info.appendChild(nameEl);
              info.appendChild(countEl);
              const testedCosts = (gen.generatedImages || []).map((u) => shippingCosts[u]).filter((v) => typeof v === "number" && isFinite(v));
              if (testedCosts.length > 0) {
                const bestCost = Math.min(...testedCosts);
                const worstCost = Math.max(...testedCosts);
                const testedBadge = document.createElement("div");
                testedBadge.textContent = "Tested";
                Object.assign(testedBadge.style, {
                  position: "absolute",
                  top: "6px",
                  left: "6px",
                  fontSize: "9px",
                  fontWeight: "700",
                  color: "#fff",
                  background: "#09090b",
                  borderRadius: "4px",
                  padding: "2px 7px",
                  letterSpacing: "0.02em",
                  zIndex: "1"
                });
                thumbWrap.appendChild(testedBadge);
                const costEl = document.createElement("div");
                costEl.textContent = testedCosts.length > 1 ? `\u2605 \u20B9${bestCost} best \xB7 \u20B9${worstCost} worst` : `\u2605 \u20B9${bestCost}`;
                Object.assign(costEl.style, {
                  fontSize: "10px",
                  fontWeight: "600",
                  color: "#f59e0b",
                  marginTop: "4px"
                });
                info.appendChild(costEl);
                card.style.borderColor = "#bbf7d0";
              }
              thumbWrap.appendChild(thumb);
              card.appendChild(thumbWrap);
              card.appendChild(info);
              card.addEventListener("click", () => runFindBest(gen, folderName));
              grid.appendChild(card);
            }
            content.appendChild(grid);
          }
          function renderImages(gen, folderName) {
            selectedUrl = null;
            lastFolderGen = gen;
            lastFolderName = folderName;
            useBtn.textContent = "Use This Image";
            useBtn.disabled = true;
            useBtn.style.opacity = "0.4";
            useBtn.style.cursor = "not-allowed";
            content.innerHTML = "";
            const navRow = document.createElement("div");
            Object.assign(navRow.style, {
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
              paddingBottom: "10px",
              borderBottom: "1px solid #f0f0f0"
            });
            const backBtn = document.createElement("button");
            backBtn.innerHTML = `&#8592; All Folders`;
            Object.assign(backBtn.style, {
              background: "none",
              border: "none",
              fontSize: "12px",
              color: "#09090b",
              cursor: "pointer",
              fontWeight: "600",
              padding: "0",
              flexShrink: "0",
              whiteSpace: "nowrap"
            });
            backBtn.addEventListener("click", renderFolders);
            const titleEl = document.createElement("div");
            Object.assign(titleEl.style, {
              fontSize: "13px",
              fontWeight: "700",
              color: "#111",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            });
            titleEl.title = folderName;
            titleEl.textContent = folderName;
            navRow.appendChild(backBtn);
            navRow.appendChild(titleEl);
            content.appendChild(navRow);
            const grid = document.createElement("div");
            Object.assign(grid.style, {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "10px"
            });
            for (const url of gen.generatedImages) {
              const card = document.createElement("div");
              Object.assign(card.style, {
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color 0.15s, box-shadow 0.15s"
              });
              card.dataset.url = url;
              const imgEl = document.createElement("img");
              imgEl.src = url;
              imgEl.loading = "lazy";
              Object.assign(imgEl.style, {
                width: "100%",
                aspectRatio: "1",
                objectFit: "contain",
                display: "block",
                background: "#f9fafb",
                padding: "4px",
                boxSizing: "border-box"
              });
              card.appendChild(imgEl);
              const imgCost = shippingCosts[url];
              if (typeof imgCost === "number" && isFinite(imgCost)) {
                const allTestedCosts = (gen.generatedImages || []).map((u) => shippingCosts[u]).filter((v) => typeof v === "number" && isFinite(v));
                const isBest = allTestedCosts.length > 0 && imgCost === Math.min(...allTestedCosts);
                const costBadge = document.createElement("div");
                costBadge.textContent = `${isBest ? "\u2605 " : ""}\u20B9${imgCost}`;
                Object.assign(costBadge.style, {
                  fontSize: "11px",
                  fontWeight: "700",
                  color: isBest ? "#fff" : "#374151",
                  background: isBest ? "#16a34a" : "#f3f4f6",
                  padding: "3px 8px",
                  textAlign: "center",
                  borderTop: "1px solid #e5e7eb"
                });
                card.appendChild(costBadge);
              }
              card.addEventListener("click", () => {
                content.querySelectorAll("[data-url]").forEach((c) => {
                  c.style.borderColor = "#e5e7eb";
                  c.style.boxShadow = "none";
                });
                card.style.borderColor = "#09090b";
                card.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.12)";
                selectedUrl = url;
                useBtn.disabled = false;
                useBtn.style.opacity = "1";
                useBtn.style.cursor = "pointer";
              });
              grid.appendChild(card);
            }
            content.appendChild(grid);
          }
          useBtn.addEventListener("click", () => {
            if (!selectedUrl || useBtn.disabled) return;
            useBtn.textContent = "Applying\u2026";
            useBtn.disabled = true;
            useBtn.style.opacity = "0.6";
            chrome.runtime?.sendMessage({ action: "fk_fetch_image", url: selectedUrl }, (imgRes) => {
              if (chrome.runtime?.lastError || !imgRes?.ok) {
                showToast("Could not fetch image \u2014 try again", "error");
                useBtn.textContent = "Use This Image";
                useBtn.disabled = false;
                useBtn.style.opacity = "1";
                useBtn.style.cursor = "pointer";
                return;
              }
              try {
                const mimeType = imgRes.type || "image/jpeg";
                const base64 = imgRes.dataUrl.split(",")[1];
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                const blob = new Blob([bytes], { type: mimeType });
                const ext = mimeType.includes("png") ? "png" : "jpg";
                const file = new File([blob], `lisstify-image.${ext}`, { type: mimeType });
                const fileInput = document.querySelector('[data-testid="changeFrontImage"]') || document.getElementById("changeFrontImage") || document.querySelector('input[type="file"]');
                if (!fileInput) {
                  showToast("Image upload field not found on page", "error");
                  backdrop.remove();
                  return;
                }
                const dt = new DataTransfer();
                dt.items.add(file);
                fileInput.files = dt.files;
                fileInput.dispatchEvent(new Event("change", { bubbles: true }));
                fileInput.dispatchEvent(new Event("input", { bubbles: true }));
                backdrop.remove();
                showToast("Image applied \u2713 Refreshing shipping charges\u2026", "success");
                _nudgeMeeshoPrice().then((ok) => {
                  if (ok) showToast("Shipping charges refreshed \u2713", "success");
                });
              } catch (e) {
                showToast("Error applying image: " + e.message, "error");
                useBtn.textContent = "Use This Image";
                useBtn.disabled = false;
                useBtn.style.opacity = "1";
                useBtn.style.cursor = "pointer";
              }
            });
          });
          footer.appendChild(cancelBtn);
          footer.appendChild(useBtn);
          modal.appendChild(footer);
          chrome.runtime?.sendMessage({ action: "sync_website_shipping_costs" }, () => {
            chrome.runtime?.sendMessage({ action: "fetch_shipping_costs" }, () => {
              chrome.storage?.local.get(["listify_shipping_costs"], (stored) => {
                shippingCosts = stored.listify_shipping_costs || {};
                renderFolders();
              });
            });
          });
        });
      }
      function tryInject() {
        if (!isOnStep2()) {
          document.getElementById(BTN_ID)?.remove();
          return;
        }
        injectLibraryButton();
      }
      let _lastUrl = location.href;
      setInterval(() => {
        const cur = location.href;
        if (cur !== _lastUrl) {
          _lastUrl = cur;
          document.getElementById(BTN_ID)?.remove();
          setTimeout(tryInject, 800);
        } else {
          tryInject();
        }
      }, 500);
      tryInject();
      setTimeout(tryInject, 1e3);
      setTimeout(tryInject, 2500);
    })();
    async function scanForms() {
      const allElements = getAllElementsDeep();
      const formData = [];
      let skippedCount = 0;
      for (const input of allElements) {
        let valueToSend = "";
        if (input.tagName === "DIV" || input.tagName === "SPAN") {
          if (input.firstElementChild && input.firstElementChild.tagName.toLowerCase() === "svg") {
            valueToSend = true;
            console.log(
              `[DEBUG SVG] scanForms: Extracted valueToSend=true for SVG-toggle container:`,
              input,
              `Text:`,
              input.innerText
            );
          } else {
            valueToSend = input.innerText && input.innerText !== "Select" ? input.innerText : "";
          }
        } else if (input.type === "checkbox" || input.type === "radio") {
          valueToSend = input.checked;
        } else if (input.type === "file") {
          if (input.files && input.files.length > 0) {
            try {
              valueToSend = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsDataURL(input.files[0]);
              });
            } catch (e) {
              console.warn("Failed to read file:", e);
            }
          }
        } else {
          valueToSend = input.value;
        }
        if (input.tagName === "TEXTAREA" && !input.id && !input.name) {
          const v = String(valueToSend).trim();
          if (v.length <= 2 && !input.placeholder) {
            skippedCount++;
            continue;
          }
        }
        const labelText = getEnrichedLabel(input);
        if (labelText && /^\d+\/\d+$/.test(labelText) && !input.id && !input.name) {
          skippedCount++;
          continue;
        }
        if (!labelText && !valueToSend && !input.id && !input.name && !input.placeholder) {
          skippedCount++;
          continue;
        }
        const isSvgToggle = (input.tagName === "DIV" || input.tagName === "SPAN") && input.firstElementChild && input.firstElementChild.tagName.toLowerCase() === "svg";
        if (isSvgToggle) {
          console.log(
            `[DEBUG SVG] scanForms: Classifying element as SVG-toggle checkbox (type will be set to 'checkbox'):`,
            input
          );
        }
        formData.push({
          selector: getUniqueSelector(input),
          id: input.id,
          name: input.name,
          label: labelText,
          value: valueToSend,
          type: isSvgToggle ? "checkbox" : input.type || input.tagName.toLowerCase(),
          placeholder: input.placeholder || ""
        });
      }
      console.log(
        `%c[LISTIFY SCAN] ${formData.length} fields captured, ${skippedCount} skipped`,
        "color: #ff4f1f; font-weight: bold"
      );
      let detectedCategory = detectCurrentCategory();
      if (!detectedCategory) {
        const catField = formData.find((f) => /categor/i.test(f.label || ""));
        if (catField && typeof catField.value === "string" && catField.value.trim()) {
          const v = catField.value.trim();
          if (v.toLowerCase() !== "meesho") detectedCategory = v;
        }
      }
      if (detectedCategory)
        console.log(
          `%c[LISTIFY SCAN] Category detected: "${detectedCategory}"`,
          "color: #ff4f1f"
        );
      return {
        url: window.location.href,
        domain: window.location.hostname,
        title: document.title,
        fields: formData,
        category: detectedCategory
      };
    }
    function inferStudioPlatform() {
      const host = window.location.hostname.toLowerCase();
      if (host.includes("seller.flipkart.com")) return "Flipkart";
      if (host.includes("meesho.com")) return "Meesho";
      if (host.includes("sellercentral.amazon.in")) return "Amazon";
      return host || "Unknown";
    }
    function normalizeStudioText(value) {
      return String(value || "").trim().replace(/\s+/g, " ");
    }
    function studioFieldConfidence(field) {
      let score = 20;
      if (field.label) score += 28;
      if (field.placeholder) score += 12;
      if (field.name) score += 12;
      if (field.id && !isDynamicId(field.id)) score += 12;
      if (field.selector) score += 8;
      if (field.value !== "" && field.value !== null && field.value !== void 0) score += 8;
      return Math.min(100, score);
    }
    function findStudioValue(fields, keywords) {
      const kws = keywords.map((k) => k.toLowerCase());
      const matched = fields.find((field) => {
        const haystack = [
          field.label,
          field.placeholder,
          field.name,
          field.id,
          field.selector
        ].map((v) => String(v || "").toLowerCase()).join(" ");
        return kws.some((kw) => haystack.includes(kw));
      });
      return normalizeStudioText(matched?.value);
    }
    function makeStudioChecks(fields) {
      const title = findStudioValue(fields, ["title", "product name", "catalog name"]);
      const description = findStudioValue(fields, ["description", "desc", "details", "about"]);
      const price = findStudioValue(fields, ["selling price", "price", "mrp"]);
      const sku = findStudioValue(fields, ["sku", "seller sku", "sku id"]);
      const keywords = fields.filter((field) => /keyword|tag|search/i.test(`${field.label || ""} ${field.placeholder || ""} ${field.name || ""}`)).map((field) => normalizeStudioText(field.value)).filter(Boolean);
      const hasImage = fields.some((field) => field.type === "file" || /image|photo|upload/i.test(`${field.label || ""} ${field.placeholder || ""}`));
      const checks = [
        {
          key: "title",
          label: "Title has marketplace-ready length",
          ok: title.length >= 35 && title.length <= 120
        },
        {
          key: "description",
          label: "Description has enough detail",
          ok: description.length >= 80
        },
        {
          key: "keywords",
          label: "Keywords or tags are present",
          ok: keywords.length > 0 || /keyword|tag|search/i.test(document.body.innerText || "")
        },
        {
          key: "price",
          label: "Price/MRP field has a value",
          ok: Boolean(price)
        },
        {
          key: "image",
          label: "Image upload/preview detected",
          ok: hasImage
        },
        {
          key: "sku",
          label: "SKU field is available",
          ok: Boolean(sku) || fields.some((field) => /sku/i.test(`${field.label || ""} ${field.placeholder || ""} ${field.name || ""}`))
        }
      ];
      const inferred = {
        brand: findStudioValue(fields, ["brand"]),
        category: detectCurrentCategory() || findStudioValue(fields, ["category", "vertical"]),
        color: findStudioValue(fields, ["color", "colour"]),
        size: findStudioValue(fields, ["size"])
      };
      return { checks, inferred };
    }
    async function buildStudioFieldAudit() {
      const scanned = await scanForms();
      const fields = (scanned.fields || []).map((field) => ({
        label: normalizeStudioText(field.label),
        placeholder: normalizeStudioText(field.placeholder),
        name: normalizeStudioText(field.name),
        id: normalizeStudioText(field.id),
        selector: field.selector,
        type: field.type,
        required: Boolean(field.required),
        hasValue: field.value !== "" && field.value !== null && field.value !== void 0,
        confidence: studioFieldConfidence(field)
      }));
      const { checks, inferred } = makeStudioChecks(scanned.fields || []);
      const score = Math.round(checks.filter((check) => check.ok).length / checks.length * 100);
      return {
        url: scanned.url,
        domain: scanned.domain,
        title: scanned.title,
        audit: {
          platform: inferStudioPlatform(),
          category: scanned.category,
          score,
          checks,
          inferred,
          fields
        }
      };
    }
    function findElement(field, allInputs) {
      let bestMatch = null, maxScore = 0;
      allInputs.forEach((el) => {
        let score = 0;
        if (field.id && el.id === field.id)
          score += isDynamicId(field.id) ? 5 : 20;
        if (field.name && el.name === field.name) score += 15;
        if (field.placeholder && el.placeholder === field.placeholder)
          score += 10;
        const context = getEnrichedLabel(el);
        if (field.label && context) {
          if (context === field.label) score += 15;
          else if (context.includes(field.label)) score += 8;
        }
        if (field.type && el.type && field.type === el.type) score += 25;
        if (score > maxScore) {
          maxScore = score;
          bestMatch = el;
        }
      });
      if (maxScore >= 5) return bestMatch;
      if (field.selector) {
        try {
          const s = document.querySelector(field.selector);
          if (s) return s;
        } catch (e) {
        }
      }
      if (field.label && field.label.length > 3) {
        const d = allInputs.find((el) => {
          const t = getEnrichedLabel(el);
          return t && t.includes(field.label);
        });
        if (d) return d;
        const dm = allInputs.find(
          (el) => el.innerText && el.innerText.includes(field.label)
        );
        if (dm) return dm;
      }
      return null;
    }
    function waitForPopup(targetValue, timeoutMs = 5e3) {
      return new Promise((resolve) => {
        const val = targetValue.trim();
        let resolved = false;
        function searchPopups() {
          const popups = document.querySelectorAll(
            '[role="presentation"] .MuiPaper-root, .MuiPopover-paper, .MuiMenu-paper'
          );
          for (const popup of popups) {
            const rect = popup.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            const priorityOrder = ["p", "span", "li", "h6", "div"];
            for (const tag of priorityOrder) {
              const els = Array.from(popup.querySelectorAll(tag));
              for (const el of els) {
                const t = (el.textContent || "").trim();
                if (t === val || t.toLowerCase() === val.toLowerCase()) {
                  return { textEl: el, popup };
                }
              }
            }
            for (const tag of priorityOrder) {
              const els = Array.from(popup.querySelectorAll(tag));
              for (const el of els) {
                const t = (el.textContent || "").trim();
                if (t.length > 0 && t.length < 80 && (t.includes(val) || val.includes(t)) && t.length >= val.length * 0.5) {
                  return { textEl: el, popup };
                }
              }
            }
          }
          return null;
        }
        const existing = searchPopups();
        if (existing) {
          resolve(existing);
          return;
        }
        const observer = new MutationObserver(() => {
          if (resolved) return;
          setTimeout(() => {
            if (resolved) return;
            const result = searchPopups();
            if (result) {
              resolved = true;
              observer.disconnect();
              resolve(result);
            }
          }, 300);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            observer.disconnect();
            resolve(searchPopups());
          }
        }, timeoutMs);
      });
    }
    async function closeAllPopups() {
      const hasOpen = Array.from(
        document.querySelectorAll(
          ".MuiPopover-root, .MuiMenu-root, .MuiAutocomplete-popper, [data-popper-placement]"
        )
      ).some((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (hasOpen) {
        const active = document.activeElement;
        if (active && active !== document.body) {
          active.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "Escape",
              bubbles: true,
              cancelable: true
            })
          );
        }
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true
          })
        );
        await new Promise((r) => setTimeout(r, 150));
        document.body.click();
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    function findOptionInPopup(popup, val) {
      const v = val.trim().toLowerCase();
      const tags = ["span", "p", "li", "label", "button", "h6", "div"];
      for (const tag of tags) {
        for (const el of popup.querySelectorAll(tag)) {
          if ((el.textContent || "").trim().toLowerCase() === v) return el;
        }
      }
      if (v.length > 1) {
        for (const tag of tags) {
          for (const el of popup.querySelectorAll(tag)) {
            const t = (el.textContent || "").trim();
            if (t.length > 0 && t.length < 80 && t.toLowerCase().includes(v))
              return el;
          }
        }
      }
      return null;
    }
    function waitForAnyPopup(timeoutMs = 5e3) {
      return new Promise((resolve) => {
        function findAny() {
          const selectors = [
            '[role="presentation"] .MuiPaper-root',
            ".MuiPopover-paper",
            ".MuiMenu-paper",
            ".MuiPopover-root .MuiPaper-root",
            "[data-popper-placement] .MuiPaper-root",
            '[role="listbox"]'
          ];
          for (const sel of selectors) {
            for (const el of document.querySelectorAll(sel)) {
              const r = el.getBoundingClientRect();
              if (r.width > 0 && r.height > 0) return el;
            }
          }
          return null;
        }
        const existing = findAny();
        if (existing) {
          resolve(existing);
          return;
        }
        let resolved = false;
        const observer = new MutationObserver(() => {
          if (resolved) return;
          const result = findAny();
          if (result) {
            resolved = true;
            observer.disconnect();
            resolve(result);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            observer.disconnect();
            resolve(findAny());
          }
        }, timeoutMs);
      });
    }
    function fireMouseEvents(el) {
      const opts = { bubbles: true, cancelable: true };
      el.dispatchEvent(new MouseEvent("mouseover", opts));
      el.dispatchEvent(new MouseEvent("mouseenter", opts));
      el.dispatchEvent(new MouseEvent("mousemove", opts));
      el.dispatchEvent(new MouseEvent("mousedown", opts));
      el.dispatchEvent(new MouseEvent("mouseup", opts));
      el.dispatchEvent(new MouseEvent("click", opts));
    }
    function isCheckboxChecked(element) {
      if ((element.tagName === "DIV" || element.tagName === "SPAN") && element.querySelector("svg")) {
        console.log(
          `[DEBUG SVG] isCheckboxChecked: Forcing return false for SVG-toggle element to ensure autofill clicks it:`,
          element
        );
        return false;
      }
      const muiWrapper = element.closest(
        ".MuiCheckbox-root, .PrivateSwitchBase-root"
      );
      return muiWrapper ? muiWrapper.classList.contains("Mui-checked") : element.checked;
    }
    function clickCheckboxElement(element) {
      if (element.tagName === "DIV" || element.tagName === "SPAN") {
        const svg = element.querySelector("svg");
        console.log(
          `[DEBUG SVG] clickCheckboxElement: Attempting to click SVG inside div. SVG found:`,
          !!svg,
          `Element:`,
          element
        );
        if (svg) {
          console.log(
            `%c[CLICK_CB] SVG-toggle: clicking svg inside div`,
            "color:#E91E63; font-weight:bold"
          );
          svg.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true })
          );
          setTimeout(() => {
            const path = element.querySelector("svg path");
            const fill = path ? path.getAttribute("fill") : null;
            console.log(
              `[DEBUG SVG] Post-click verification. SVG path fill attribute = "${fill}"`
            );
            console.log(
              `%c[CLICK_CB] after click \u2014 fill="${fill}" isChecked=${!!(fill && fill !== "none" && fill !== "currentColor")}`,
              "color:#E91E63"
            );
          }, 100);
        } else {
          console.warn(
            `%c[CLICK_CB] SVG-toggle: no svg found inside div`,
            "color:#dc2626"
          );
        }
        return;
      }
      const muiWrapper = element.closest(
        ".PrivateSwitchBase-root, .MuiButtonBase-root, label"
      );
      if (muiWrapper) {
        const svg = muiWrapper.querySelector("svg");
        console.log(
          `%c[CLICK_CB] MUI input: wrapper found, svg=${!!svg}`,
          "color:#E91E63; font-weight:bold"
        );
        if (svg)
          svg.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true })
          );
        else muiWrapper.click();
        return;
      }
      console.log(`%c[CLICK_CB] fallback: element.click()`, "color:#E91E63");
      element.click();
    }
    function clickPopupOption(textEl) {
      const textParent = textEl.parentElement;
      const liAncestor = textEl.closest('li, [role="option"]');
      if (liAncestor) {
        console.log(
          `%c[SIZE CLICK] LI option row click: <${liAncestor.tagName} class="${liAncestor.className.slice(0, 60)}">`,
          "color:#9C27B0"
        );
        liAncestor.click();
        return true;
      }
      const svg = textParent ? textParent.querySelector("svg") : null;
      if (svg) {
        console.log(
          `%c[SIZE CLICK] SVG checkbox click (no LI ancestor \u2014 size popup)`,
          "color:#9C27B0"
        );
        svg.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true })
        );
        return true;
      }
      const fallback = textParent ? textParent.parentElement || textParent : textEl;
      console.log(
        `%c[SIZE CLICK] fallback click: <${fallback.tagName} class="${fallback.className.slice(0, 60)}">`,
        "color:#9C27B0"
      );
      fallback.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      return true;
    }
    function findPopupSearchInput() {
      const popupSelectors = [
        ".MuiPopover-root",
        ".MuiMenu-root",
        ".MuiAutocomplete-popper",
        "[data-popper-placement]",
        '[role="presentation"]'
      ];
      for (const sel of popupSelectors) {
        for (const popup of document.querySelectorAll(sel)) {
          const r = popup.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const input = popup.querySelector(
            'input:not([type="hidden"]):not([readonly])'
          );
          if (input) return input;
        }
      }
      return null;
    }
    function typeIntoInput(input, val) {
      try {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        ).set;
        if (setter) setter.call(input, val);
        else input.value = val;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      } catch (_) {
      }
    }
    function findApplyInPopup(popup) {
      const root = popup.closest('[role="presentation"]') || popup;
      const buttons = Array.from(root.querySelectorAll("button"));
      for (const btn of buttons) {
        const txt = (btn.innerText || btn.textContent || "").trim().toLowerCase();
        if (["apply", "done", "confirm", "ok"].includes(txt)) return btn;
      }
      const allBtns = Array.from(
        document.querySelectorAll('button, [role="button"]')
      );
      for (const btn of allBtns) {
        const txt = (btn.innerText || "").trim().toLowerCase();
        if (["apply", "done", "confirm", "ok"].includes(txt)) {
          const r = btn.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) return btn;
        }
      }
      return null;
    }
    function setElementValue(element, val) {
      let ancestor = element.closest('[aria-hidden="true"]');
      const restored = [];
      while (ancestor) {
        ancestor.removeAttribute("aria-hidden");
        restored.push(ancestor);
        ancestor = element.closest('[aria-hidden="true"]');
      }
      let proto = window.HTMLInputElement.prototype;
      if (element.tagName === "TEXTAREA")
        proto = window.HTMLTextAreaElement.prototype;
      if (element.tagName === "SELECT")
        proto = window.HTMLSelectElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
      if (setter) setter.call(element, val);
      else element.value = val;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      restored.forEach((el) => el.setAttribute("aria-hidden", "true"));
    }
    function isCustomDropdown(element) {
      if ((element.tagName === "DIV" || element.tagName === "SPAN") && element.firstElementChild && element.firstElementChild.tagName.toLowerCase() === "svg") {
        return false;
      }
      return element.tagName === "DIV" || element.tagName === "SPAN" || element.tagName === "INPUT" && (element.hasAttribute("readonly") || element.getAttribute("aria-haspopup") === "listbox" || element.getAttribute("role") === "combobox");
    }
    async function fillForm(templateData, { resolvedCategory } = {}) {
      _listifyAbortFill = false;
      if (!templateData || !templateData.fields)
        return { filledCount: 0, notFoundCount: 0, optionNotFoundCount: 0 };
      if (!resolvedCategory) {
        const templateCategory = (templateData.category || "").trim().toLowerCase();
        if (templateCategory) {
          const detected = (detectCurrentCategory() || scrapeBreadcrumbCategory() || sessionStorage.getItem("listify_tab_category") || sessionStorage.getItem("listify_tab_category_full") || "").trim().toLowerCase();
          if (detected) {
            const matches = detected === templateCategory || detected.includes(templateCategory) || templateCategory.includes(detected);
            if (!matches) {
              showToast(
                `This looks like "${detected}" \u2014 your template is for "${templateCategory}". Filling anyway; check the fields.`,
                "warning"
              );
              console.warn(
                `[LISTIFY] Category guard soft-mismatch: template="${templateCategory}" vs page="${detected}" \u2014 proceeding`
              );
            }
          } else {
            console.warn(
              "[LISTIFY] Category guard: page category not detected \u2014 proceeding with fill (no hard block)"
            );
          }
        }
      }
      let allInputs = getAllElementsDeep();
      let filledCount = 0, notFoundCount = 0, optionNotFoundCount = 0;
      const notFoundLabels = [], optionNotFoundLabels = [];
      const filledElements = /* @__PURE__ */ new Set();
      const simpleFields = [];
      const dropdownFields = [];
      const deferredFields = [];
      console.log(
        `%c[LISTIFY FILL] \u2550\u2550\u2550 Filling ${templateData.fields.length} fields (\u26A1 parallel mode) \u2550\u2550\u2550`,
        "color: #2196F3; font-weight: bold; font-size: 13px"
      );
      for (let i = 0; i < templateData.fields.length; i++) {
        const field = templateData.fields[i];
        const fieldLabel = field.label || field.name || field.placeholder || field.id || "(unknown)";
        const _fieldTokens = [
          field.label,
          field.name,
          field.placeholder,
          field.id
        ].filter(Boolean).join(" ").toLowerCase();
        if (/\bform\b/.test(_fieldTokens)) {
          console.log(
            `%c[LISTIFY FILL]   \u23ED Skipping "form" dropdown (category-sensitive field, label="${fieldLabel}")`,
            "color:#888"
          );
          continue;
        }
        if (field.type === "file" || field.type === "image") {
          console.log(`%c[LISTIFY FILL]   \u23ED Skipping file/image field "${fieldLabel}"`, "color:#888");
          continue;
        }
        const element = findElement(field, allInputs);
        if (!element) {
          deferredFields.push({ field, fieldLabel, fieldNum: i + 1 });
          continue;
        }
        if (element.type === "file") {
          console.log(`%c[LISTIFY FILL]   \u23ED Skipping file input (DOM) "${fieldLabel}"`, "color:#888");
          continue;
        }
        if (element.id && element.id.startsWith("checkMarkOption_")) {
          console.log(`%c[LISTIFY FILL]   \u23ED Skipping nav menu input "${fieldLabel}"`, "color:#888");
          continue;
        }
        if (filledElements.has(element)) continue;
        filledElements.add(element);
        if (isCustomDropdown(element)) {
          dropdownFields.push({ field, fieldLabel, element });
        } else {
          simpleFields.push({ field, fieldLabel, element });
        }
      }
      if (simpleFields.length > 0) {
        console.log(
          `%c[LISTIFY FILL] \u26A1 Phase 1: Filling ${simpleFields.length} simple fields in parallel`,
          "color: #9C27B0; font-weight: bold"
        );
        const t0 = performance.now();
        for (const { field, fieldLabel, element } of simpleFields) {
          if (_listifyAbortFill) break;
          try {
            if (element.type === "checkbox" || element.type === "radio" || element.tagName === "DIV" && element.querySelector("svg")) {
              const valStr = String(field.value).toLowerCase();
              const shouldCheck = valStr === "true" || valStr === "on" || field.value === true;
              if (isCheckboxChecked(element) !== shouldCheck) {
                console.log(
                  `[DEBUG SVG] fillForm (Phase 1): element needs to be checked (${shouldCheck}). Proceeding to clickCheckboxElement...`
                );
                clickCheckboxElement(element);
              } else {
                console.log(
                  `[DEBUG SVG] fillForm (Phase 1): element check state matches shouldCheck (${shouldCheck}). Skipping click.`
                );
              }
              filledCount++;
              console.log(
                `%c[LISTIFY FILL]   \u2713 "${fieldLabel}" \u2192 ${shouldCheck ? "CHECKED" : "UNCHECKED"}`,
                "color: #1a9e5a"
              );
            } else if (element.type === "file") {
              console.log(`%c[LISTIFY FILL]   \u23ED Phase 1 skip file input "${fieldLabel}"`, "color:#888");
            } else {
              const val = String(field.value);
              setElementValue(element, val);
              filledCount++;
              console.log(
                `%c[LISTIFY FILL]   \u2713 "${fieldLabel}" \u2192 "${val.slice(0, 40)}"`,
                "color: #1a9e5a"
              );
            }
          } catch (e) {
            console.warn(
              `%c[LISTIFY FILL]   \u2717 "${fieldLabel}" ERROR: ${e.message}`,
              "color: #dc2626"
            );
          }
        }
        const t1 = performance.now();
        console.log(
          `%c[LISTIFY FILL] \u26A1 Phase 1 done in ${Math.round(t1 - t0)}ms`,
          "color: #9C27B0; font-weight: bold"
        );
        await new Promise((r) => setTimeout(r, 100));
        allInputs = getAllElementsDeep();
      }
      dropdownFields.sort((a, b) => {
        const aIsSize = /\bsize\b/i.test(a.fieldLabel);
        const bIsSize = /\bsize\b/i.test(b.fieldLabel);
        if (aIsSize && !bIsSize) return 1;
        if (!aIsSize && bIsSize) return -1;
        return 0;
      });
      if (dropdownFields.length > 0) {
        console.log(
          `%c[LISTIFY FILL] \u23F3 Phase 2: Filling ${dropdownFields.length} dropdowns sequentially (size fields last)`,
          "color: #FF9800; font-weight: bold"
        );
        const t0 = performance.now();
        const prevCount = allInputs.length;
        for (const { field, fieldLabel, element } of dropdownFields) {
          if (_listifyAbortFill) break;
          try {
            const val = String(field.value).trim();
            if (!val) {
              filledCount++;
              continue;
            }
            element.focus();
            await closeAllPopups();
            const isSize = /\bsize\b/i.test(fieldLabel) && !/\[.+\]$/.test(fieldLabel);
            const multiVals = isSize && (val.includes(",") || val.includes("\n")) ? val.split(/[\n,]+/).map((v) => v.trim()).filter((v) => v.length > 0 && /[a-zA-Z0-9]/.test(v)) : null;
            if (isSize) {
              const sizeVals = multiVals || [val];
              console.log(
                `%c[SIZE] \u2500\u2500 "${fieldLabel}" \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
                "color:#9C27B0; font-weight:bold"
              );
              console.log(
                `%c[SIZE]   target value(s): ${JSON.stringify(sizeVals)}`,
                "color:#9C27B0"
              );
              console.log(
                `%c[SIZE]   element tag="${element.tagName}" type="${element.type}" readonly=${element.readOnly} value="${element.value}"`,
                "color:#9C27B0"
              );
              console.log(
                `%c[SIZE]   element visible: offsetParent=${!!element.offsetParent} rect=${JSON.stringify(element.getBoundingClientRect())}`,
                "color:#9C27B0"
              );
              element.click();
              console.log(
                `%c[SIZE]   element.click() fired \u2014 waiting 300ms for popup...`,
                "color:#9C27B0"
              );
              await new Promise((r) => setTimeout(r, 300));
              const popup = await waitForAnyPopup(4e3);
              if (popup) {
                console.log(
                  `%c[SIZE]   popup found: <${popup.tagName} class="${popup.className}"> children=${popup.children.length}`,
                  "color:#9C27B0"
                );
                const allTexts = Array.from(
                  popup.querySelectorAll("span,li,label,button,p,h6")
                ).map((e) => (e.textContent || "").trim()).filter((t) => t.length > 0 && t.length < 80);
                console.log(
                  `%c[SIZE]   popup visible text options (first 20): ${JSON.stringify(allTexts.slice(0, 20))}`,
                  "color:#9C27B0"
                );
                let anyFound = false;
                for (const singleVal of sizeVals) {
                  await new Promise((r) => setTimeout(r, 100));
                  const optEl = findOptionInPopup(popup, singleVal);
                  if (optEl) {
                    console.log(
                      `%c[SIZE]   option found for "${singleVal}": <${optEl.tagName} class="${optEl.className}"> text="${(optEl.textContent || "").trim()}"`,
                      "color:#9C27B0"
                    );
                    clickPopupOption(optEl);
                    await new Promise((r) => setTimeout(r, 300));
                    anyFound = true;
                    console.log(
                      `%c[SIZE]   \u2713 selected "${singleVal}" \u2014 element.value now="${element.value}"`,
                      "color:#1a9e5a; font-weight:bold"
                    );
                  } else {
                    console.warn(
                      `%c[SIZE]   \u2717 "${singleVal}" NOT FOUND in popup \u2014 check the text list above`,
                      "color:#dc2626"
                    );
                  }
                }
                await new Promise((r) => setTimeout(r, 200));
                const applyBtn = findApplyInPopup(popup);
                console.log(
                  `%c[SIZE]   applyBtn found: ${!!applyBtn}${applyBtn ? ` text="${(applyBtn.textContent || "").trim()}"` : ""}`,
                  "color:#9C27B0"
                );
                if (applyBtn) {
                  applyBtn.click();
                  const expectedVal = sizeVals[0];
                  await new Promise((resolve) => {
                    if (element.value === expectedVal) {
                      resolve();
                      return;
                    }
                    const start = Date.now();
                    const iv = setInterval(() => {
                      if (element.value === expectedVal || Date.now() - start > 3e3) {
                        clearInterval(iv);
                        resolve();
                      }
                    }, 50);
                  });
                  console.log(
                    `%c[SIZE]   after applyBtn.click() \u2014 element.value="${element.value}"`,
                    "color:#9C27B0"
                  );
                } else {
                  console.warn(
                    `%c[SIZE]   \u2717 no Apply/Done button found in popup \u2014 popup will stay open or selection lost`,
                    "color:#dc2626"
                  );
                }
                if (anyFound) {
                  filledCount++;
                  console.log(
                    `%c[SIZE]   \u2713 DONE "${fieldLabel}" \u2192 final element.value="${element.value}"`,
                    "color:#1a9e5a; font-weight:bold"
                  );
                  element.scrollIntoView({ behavior: "smooth", block: "center" });
                  const prevOutline = element.style.outline;
                  element.style.outline = "3px solid #4CAF50";
                  setTimeout(() => {
                    element.style.outline = prevOutline;
                  }, 3e3);
                } else {
                  optionNotFoundCount++;
                  optionNotFoundLabels.push(fieldLabel);
                  console.warn(
                    `%c[SIZE]   \u2717 no options matched \u2014 field will remain empty`,
                    "color:#dc2626"
                  );
                }
              } else {
                optionNotFoundCount++;
                optionNotFoundLabels.push(fieldLabel);
                console.warn(
                  `%c[SIZE]   \u2717 popup did NOT open after 4s \u2014 element.value="${element.value}"`,
                  "color:#dc2626"
                );
                console.warn(
                  `%c[SIZE]   Possible causes: element not clickable, wrong element found, popup uses different selector`,
                  "color:#dc2626"
                );
                console.warn(
                  `%c[SIZE]   All popups in DOM right now:`,
                  "color:#dc2626"
                );
                [
                  '[role="presentation"]',
                  ".MuiPaper-root",
                  ".MuiPopover-root",
                  '[role="listbox"]'
                ].forEach((sel) => {
                  const els = document.querySelectorAll(sel);
                  if (els.length)
                    console.warn(
                      `%c[SIZE]     ${sel}: ${els.length} element(s)`,
                      "color:#dc2626"
                    );
                });
              }
            } else {
              const singleVals = val.includes(",") ? val.split(",").map((v) => v.trim()).filter(Boolean) : [val];
              fireMouseEvents(element);
              await new Promise((r) => setTimeout(r, 200));
              let anyFound = false;
              let lastPopup = null;
              for (let vi = 0; vi < singleVals.length; vi++) {
                const singleVal = singleVals[vi];
                const searchInput = findPopupSearchInput();
                if (searchInput) {
                  typeIntoInput(searchInput, singleVal);
                  await new Promise((r) => setTimeout(r, 100));
                }
                const popupResult = await waitForPopup(singleVal, 3e3);
                if (popupResult) {
                  const { textEl, popup } = popupResult;
                  lastPopup = popup;
                  clickPopupOption(textEl);
                  await new Promise((r) => setTimeout(r, 200));
                  anyFound = true;
                  console.log(
                    `%c[LISTIFY FILL]   \u2713 "${fieldLabel}" \u2192 "${singleVal}"${singleVals.length > 1 ? ` (${vi + 1}/${singleVals.length})` : ""} (dropdown)`,
                    "color: #1a9e5a"
                  );
                  if (vi < singleVals.length - 1) {
                    const si = findPopupSearchInput();
                    if (si) {
                      typeIntoInput(si, "");
                      await new Promise((r) => setTimeout(r, 100));
                    }
                  }
                } else {
                  const candidates = Array.from(
                    document.querySelectorAll(
                      'li, div[role="option"], span[role="option"], .MuiMenuItem-root, [role="listbox"] > *'
                    )
                  );
                  let option = candidates.find((o) => (o.innerText || "").trim() === singleVal);
                  if (!option) option = candidates.find((o) => (o.innerText || "").includes(singleVal));
                  if (option) {
                    fireMouseEvents(option);
                    await new Promise((r) => setTimeout(r, 150));
                    lastPopup = option.closest('[role="presentation"]') || null;
                    anyFound = true;
                    console.log(
                      `%c[LISTIFY FILL]   \u2713 "${fieldLabel}" \u2192 "${singleVal}" (fallback dropdown)`,
                      "color: #1a9e5a"
                    );
                  } else {
                    optionNotFoundCount++;
                    optionNotFoundLabels.push(singleVals.length > 1 ? `${fieldLabel}:${singleVal}` : fieldLabel);
                    console.warn(
                      `%c[LISTIFY FILL]   \u2717 "${fieldLabel}" \u2192 option "${singleVal}" NOT FOUND`,
                      "color: #dc2626"
                    );
                  }
                }
              }
              if (lastPopup) {
                const applyBtn = findApplyInPopup(lastPopup);
                if (applyBtn) applyBtn.click();
              }
              if (anyFound) {
                filledCount++;
              }
            }
            await closeAllPopups();
            await new Promise((r) => setTimeout(r, 300));
            const newInputs = getAllElementsDeep();
            if (newInputs.length !== prevCount) {
              await new Promise((r) => setTimeout(r, 500));
              allInputs = getAllElementsDeep();
            } else {
              allInputs = newInputs;
            }
          } catch (e) {
            console.warn(
              `%c[LISTIFY FILL]   \u2717 "${fieldLabel}" ERROR: ${e.message}`,
              "color: #dc2626"
            );
          }
        }
        const t1 = performance.now();
        console.log(
          `%c[LISTIFY FILL] \u23F3 Phase 2 done in ${Math.round(t1 - t0)}ms`,
          "color: #FF9800; font-weight: bold"
        );
      }
      if (deferredFields.length > 0) {
        await new Promise((r) => setTimeout(r, 1e3));
        allInputs = getAllElementsDeep();
        console.log(
          `%c[LISTIFY FILL] \u2500\u2500 Retrying ${deferredFields.length} deferred fields (${allInputs.length} elements now) \u2500\u2500`,
          "color: #FF9800; font-weight: bold"
        );
        for (const { field, fieldLabel } of deferredFields) {
          if (_listifyAbortFill) break;
          const element = findElement(field, allInputs);
          if (!element) {
            notFoundCount++;
            notFoundLabels.push(fieldLabel);
            console.warn(
              `%c[LISTIFY FILL]   \u2717 "${fieldLabel}" still NOT FOUND`,
              "color: #dc2626"
            );
            continue;
          }
          if (element.type === "file") {
            console.log(`%c[LISTIFY FILL]   \u23ED Phase 3 skip file input "${fieldLabel}"`, "color:#888");
            continue;
          }
          if (element.id && element.id.startsWith("checkMarkOption_")) {
            console.log(`%c[LISTIFY FILL]   \u23ED Skipping nav menu input "${fieldLabel}"`, "color:#888");
            continue;
          }
          try {
            if (isCustomDropdown(element)) {
              const val = String(field.value).trim();
              if (!val) {
                filledCount++;
                continue;
              }
              element.focus();
              await closeAllPopups();
              const isSize = /\bsize\b/i.test(fieldLabel) && !/\[.+\]$/.test(fieldLabel);
              const multiVals = isSize && (val.includes(",") || val.includes("\n")) ? val.split(/[\n,]+/).map((v) => v.trim()).filter((v) => v.length > 0 && /[a-zA-Z0-9]/.test(v)) : null;
              if (isSize) {
                const sizeVals = multiVals || [val];
                console.log(
                  `%c[SIZE RETRY] \u2500\u2500 "${fieldLabel}" \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
                  "color:#FF9800; font-weight:bold"
                );
                console.log(
                  `%c[SIZE RETRY]   target value(s): ${JSON.stringify(sizeVals)}`,
                  "color:#FF9800"
                );
                console.log(
                  `%c[SIZE RETRY]   element tag="${element.tagName}" type="${element.type}" readonly=${element.readOnly} value="${element.value}"`,
                  "color:#FF9800"
                );
                element.click();
                console.log(
                  `%c[SIZE RETRY]   element.click() fired \u2014 waiting 300ms for popup...`,
                  "color:#FF9800"
                );
                await new Promise((r) => setTimeout(r, 300));
                const popup = await waitForAnyPopup(4e3);
                if (popup) {
                  console.log(
                    `%c[SIZE RETRY]   popup found: <${popup.tagName} class="${popup.className}"> children=${popup.children.length}`,
                    "color:#FF9800"
                  );
                  const allTexts = Array.from(
                    popup.querySelectorAll("span,li,label,button,p,h6")
                  ).map((e) => (e.textContent || "").trim()).filter((t) => t.length > 0 && t.length < 80);
                  console.log(
                    `%c[SIZE RETRY]   popup options (first 20): ${JSON.stringify(allTexts.slice(0, 20))}`,
                    "color:#FF9800"
                  );
                  let anyFound = false;
                  for (const singleVal of sizeVals) {
                    await new Promise((r) => setTimeout(r, 100));
                    const optEl = findOptionInPopup(popup, singleVal);
                    if (optEl) {
                      console.log(
                        `%c[SIZE RETRY]   option found for "${singleVal}": <${optEl.tagName}> text="${(optEl.textContent || "").trim()}"`,
                        "color:#FF9800"
                      );
                      clickPopupOption(optEl);
                      anyFound = true;
                      console.log(
                        `%c[SIZE RETRY]   \u2713 selected "${singleVal}" \u2014 element.value now="${element.value}"`,
                        "color:#1a9e5a; font-weight:bold"
                      );
                    } else {
                      console.warn(
                        `%c[SIZE RETRY]   \u2717 "${singleVal}" NOT FOUND \u2014 check options list above`,
                        "color:#dc2626"
                      );
                    }
                  }
                  await new Promise((r) => setTimeout(r, 200));
                  const applyBtn = findApplyInPopup(popup);
                  console.log(
                    `%c[SIZE RETRY]   applyBtn found: ${!!applyBtn}${applyBtn ? ` text="${(applyBtn.textContent || "").trim()}"` : ""}`,
                    "color:#FF9800"
                  );
                  if (applyBtn) {
                    applyBtn.click();
                    const expectedVal = sizeVals[0];
                    await new Promise((resolve) => {
                      if (element.value === expectedVal) {
                        resolve();
                        return;
                      }
                      const start = Date.now();
                      const iv = setInterval(() => {
                        if (element.value === expectedVal || Date.now() - start > 3e3) {
                          clearInterval(iv);
                          resolve();
                        }
                      }, 50);
                    });
                    console.log(
                      `%c[SIZE RETRY]   after applyBtn.click() \u2014 element.value="${element.value}"`,
                      "color:#FF9800"
                    );
                  } else {
                    console.warn(
                      `%c[SIZE RETRY]   \u2717 no Apply/Done button found`,
                      "color:#dc2626"
                    );
                  }
                  if (anyFound) {
                    filledCount++;
                    console.log(
                      `%c[SIZE RETRY]   \u2713 DONE "${fieldLabel}" \u2192 final element.value="${element.value}"`,
                      "color:#1a9e5a; font-weight:bold"
                    );
                  } else {
                    optionNotFoundCount++;
                    optionNotFoundLabels.push(fieldLabel);
                    console.warn(
                      `%c[SIZE RETRY]   \u2717 no options matched \u2014 field will remain empty`,
                      "color:#dc2626"
                    );
                  }
                } else {
                  optionNotFoundCount++;
                  optionNotFoundLabels.push(fieldLabel);
                  console.warn(
                    `%c[SIZE RETRY]   \u2717 popup did NOT open after 4s \u2014 element.value="${element.value}"`,
                    "color:#dc2626"
                  );
                  console.warn(
                    `%c[SIZE RETRY]   All popups in DOM:`,
                    "color:#dc2626"
                  );
                  [
                    '[role="presentation"]',
                    ".MuiPaper-root",
                    ".MuiPopover-root",
                    '[role="listbox"]'
                  ].forEach((sel) => {
                    const els = document.querySelectorAll(sel);
                    if (els.length)
                      console.warn(
                        `%c[SIZE RETRY]     ${sel}: ${els.length} element(s)`,
                        "color:#dc2626"
                      );
                  });
                }
              } else {
                const popupPromise = waitForPopup(val, 5e3);
                fireMouseEvents(element);
                await new Promise((r) => setTimeout(r, 200));
                const searchInput = findPopupSearchInput();
                if (searchInput) typeIntoInput(searchInput, val);
                const popupResult = await popupPromise;
                if (popupResult) {
                  clickPopupOption(popupResult.textEl);
                  await new Promise((r) => setTimeout(r, 200));
                  const applyBtn = findApplyInPopup(popupResult.popup);
                  if (applyBtn) applyBtn.click();
                  filledCount++;
                  console.log(
                    `%c[LISTIFY FILL]   \u2713 "${fieldLabel}" \u2192 "${val}" (retry dropdown)`,
                    "color: #1a9e5a"
                  );
                } else {
                  optionNotFoundCount++;
                  optionNotFoundLabels.push(fieldLabel);
                  console.warn(
                    `%c[LISTIFY FILL]   \u2717 "${fieldLabel}" \u2192 option "${val}" NOT FOUND (retry)`,
                    "color: #dc2626"
                  );
                }
              }
              await closeAllPopups();
              await new Promise((r) => setTimeout(r, 300));
            } else {
              element.focus();
              if (element.type === "checkbox" || element.type === "radio" || element.tagName === "DIV" && element.querySelector("svg")) {
                const valStr = String(field.value).toLowerCase();
                const shouldCheck = valStr === "true" || valStr === "on" || field.value === true;
                if (isCheckboxChecked(element) !== shouldCheck) {
                  clickCheckboxElement(element);
                }
              } else {
                const val = String(field.value);
                setElementValue(element, val);
              }
              filledCount++;
              console.log(
                `%c[LISTIFY FILL]   \u2713 "${fieldLabel}" \u2192 "${String(field.value).slice(0, 40)}" (retry)`,
                "color: #1a9e5a"
              );
            }
          } catch (e) {
            notFoundCount++;
            notFoundLabels.push(fieldLabel);
            console.warn(
              `%c[LISTIFY FILL]   \u2717 "${fieldLabel}" retry ERROR: ${e.message}`,
              "color: #dc2626"
            );
          }
        }
      }
      if (simpleFields.length > 0) {
        await new Promise((r) => setTimeout(r, 300));
        allInputs = getAllElementsDeep();
        console.log(
          `%c[LISTIFY FILL] \u267B Phase 4: Re-filling ${simpleFields.length} simple fields after dropdowns`,
          "color: #9C27B0; font-weight: bold"
        );
        for (const { field, fieldLabel } of simpleFields) {
          try {
            if (field.type === "checkbox" || field.type === "radio") continue;
            const val = String(field.value);
            if (!val) continue;
            const el = findElement(field, allInputs);
            if (!el || isCustomDropdown(el)) continue;
            if (el.type === "file") continue;
            setElementValue(el, val);
            console.log(
              `%c[LISTIFY FILL]   \u267B "${fieldLabel}" \u2192 "${val.slice(0, 40)}"`,
              "color: #9C27B0"
            );
          } catch (e) {
          }
        }
      }
      const sizeFields = dropdownFields.filter(
        ({ fieldLabel }) => /\bsize\b/i.test(fieldLabel)
      );
      if (sizeFields.length > 0) {
        await new Promise((r) => setTimeout(r, 400));
        allInputs = getAllElementsDeep();
        for (const { field, fieldLabel } of sizeFields) {
          try {
            const val = String(field.value).trim();
            if (!val) continue;
            const element = findElement(field, allInputs);
            if (!element) continue;
            if (element.value === val) {
              console.log(
                `%c[SIZE FINAL]   \u2713 "${fieldLabel}" already "${val}" \u2014 skipping`,
                "color:#1a9e5a"
              );
              continue;
            }
            console.log(
              `%c[SIZE FINAL]   "${fieldLabel}" wiped (current="${element.value}") \u2014 re-filling "${val}"`,
              "color:#FF9800; font-weight:bold"
            );
            const sizeVals = val.includes(",") || val.includes("\n") ? val.split(/[\n,]+/).map((v) => v.trim()).filter((v) => v.length > 0 && /[a-zA-Z0-9]/.test(v)) : [val];
            element.click();
            await new Promise((r) => setTimeout(r, 300));
            const popup = await waitForAnyPopup(4e3);
            if (popup) {
              for (const singleVal of sizeVals) {
                await new Promise((r) => setTimeout(r, 100));
                const optEl = findOptionInPopup(popup, singleVal);
                if (optEl) {
                  clickPopupOption(optEl);
                  await new Promise((r) => setTimeout(r, 300));
                  console.log(
                    `%c[SIZE FINAL]   \u2713 selected "${singleVal}"`,
                    "color:#1a9e5a"
                  );
                } else {
                  console.warn(
                    `%c[SIZE FINAL]   \u2717 "${singleVal}" not found in popup`,
                    "color:#dc2626"
                  );
                }
              }
              await new Promise((r) => setTimeout(r, 200));
              const applyBtn = findApplyInPopup(popup);
              if (applyBtn) {
                applyBtn.click();
                await new Promise((resolve) => {
                  if (element.value === sizeVals[0]) {
                    resolve();
                    return;
                  }
                  const start = Date.now();
                  const iv = setInterval(() => {
                    if (element.value === sizeVals[0] || Date.now() - start > 3e3) {
                      clearInterval(iv);
                      resolve();
                    }
                  }, 50);
                });
                console.log(
                  `%c[SIZE FINAL]   \u2713 DONE "${fieldLabel}" \u2192 "${element.value}"`,
                  "color:#1a9e5a; font-weight:bold"
                );
              }
            } else {
              console.warn(
                `%c[SIZE FINAL]   \u2717 popup did not open for "${fieldLabel}"`,
                "color:#dc2626"
              );
            }
          } catch (e) {
          }
        }
      }
      {
        await new Promise((r) => setTimeout(r, 400));
        const liveInputs = getAllElementsDeep();
        let phase5Count = 0;
        for (let i = 0; i < templateData.fields.length; i++) {
          const field = templateData.fields[i];
          if (field.type === "checkbox" || field.type === "radio") continue;
          if (field.type === "image" || field.type === "file") continue;
          const val = String(field.value);
          if (!val) continue;
          const el = findElement(field, liveInputs);
          if (!el || isCustomDropdown(el)) continue;
          if (el.type === "file") continue;
          if (el.value === val) continue;
          const fieldLabel = field.label || field.name || field.placeholder || field.id || "(unknown)";
          try {
            setElementValue(el, val);
            phase5Count++;
            console.log(
              `%c[PHASE 5]   \u2713 "${fieldLabel}" \u2192 "${val.slice(0, 40)}"`,
              "color: #00BCD4"
            );
          } catch (e) {
            console.warn(
              `%c[PHASE 5]   \u2717 "${fieldLabel}" ERROR: ${e.message}`,
              "color: #dc2626"
            );
          }
        }
        if (phase5Count > 0)
          console.log(
            `%c[PHASE 5] Filled ${phase5Count} newly revealed fields`,
            "color: #00BCD4; font-weight:bold"
          );
      }
      {
        const rowDropdowns = templateData.fields.filter((f) => {
          const lbl = f.label || "";
          return /\[.+\]$/.test(lbl) && String(f.value).trim();
        });
        if (rowDropdowns.length > 0) {
          await new Promise((r) => setTimeout(r, 400));
          const liveInputs = getAllElementsDeep();
          console.log(
            `%c[PHASE 6] Filling ${rowDropdowns.length} per-row dropdown fields`,
            "color: #E91E63; font-weight:bold"
          );
          for (const field of rowDropdowns) {
            const val = String(field.value).trim();
            const fieldLabel = field.label || field.id || "(unknown)";
            const el = findElement(field, liveInputs);
            if (!el || !isCustomDropdown(el)) continue;
            if (el.value === val) {
              console.log(
                `%c[PHASE 6]   \u2713 "${fieldLabel}" already "${val}" \u2014 skipping`,
                "color:#1a9e5a"
              );
              continue;
            }
            try {
              await closeAllPopups();
              await new Promise((r) => setTimeout(r, 200));
              const clickTarget = el.closest(".MuiInputBase-root") || el.closest(".MuiFormControl-root") || el;
              fireMouseEvents(clickTarget);
              await new Promise((r) => setTimeout(r, 500));
              const popup = await waitForAnyPopup(4e3);
              if (!popup) {
                console.warn(
                  `%c[PHASE 6]   \u2717 "${fieldLabel}" \u2014 popup did not open`,
                  "color:#dc2626"
                );
                continue;
              }
              const searchInput = findPopupSearchInput();
              if (searchInput) {
                typeIntoInput(searchInput, val);
                await new Promise((r) => setTimeout(r, 500));
              }
              const optEl = findOptionInPopup(popup, val);
              if (optEl) {
                clickPopupOption(optEl);
                await new Promise((r) => setTimeout(r, 300));
                filledCount++;
                console.log(
                  `%c[PHASE 6]   \u2713 "${fieldLabel}" \u2192 "${val}"`,
                  "color:#1a9e5a; font-weight:bold"
                );
              } else {
                const menuItems = document.querySelectorAll(
                  '[role="menuitem"] p, [role="option"] p, .MuiMenuItem-root p'
                );
                let found = false;
                for (const mi of menuItems) {
                  if ((mi.textContent || "").trim() === val) {
                    clickPopupOption(mi);
                    await new Promise((r) => setTimeout(r, 300));
                    filledCount++;
                    found = true;
                    console.log(
                      `%c[PHASE 6]   \u2713 "${fieldLabel}" \u2192 "${val}" (menuitem fallback)`,
                      "color:#1a9e5a; font-weight:bold"
                    );
                    break;
                  }
                }
                if (!found) {
                  console.warn(
                    `%c[PHASE 6]   \u2717 "${fieldLabel}" \u2014 option "${val}" not found`,
                    "color:#dc2626"
                  );
                }
              }
              await closeAllPopups();
              await new Promise((r) => setTimeout(r, 200));
            } catch (e) {
              console.warn(
                `%c[PHASE 6]   \u2717 "${fieldLabel}" ERROR: ${e.message}`,
                "color:#dc2626"
              );
            }
          }
        }
      }
      {
        await new Promise((r) => setTimeout(r, 200));
        const liveInputs = getAllElementsDeep();
        const checkboxFields = templateData.fields.filter(
          (f) => f.type === "checkbox" || f.type === "radio"
        );
        console.log(
          `%c[CHECKBOX FINAL] Scanning ${checkboxFields.length} checkbox/radio fields`,
          "color:#FF9800; font-weight:bold"
        );
        for (const field of checkboxFields) {
          const fieldLabel = field.label || field.name || field.placeholder || field.id || "(unknown)";
          const valStr = String(field.value).toLowerCase();
          const shouldCheck = valStr === "true" || valStr === "on" || field.value === true;
          const el = findElement(field, liveInputs);
          if (!el) {
            console.warn(
              `%c[CHECKBOX FINAL] "${fieldLabel}" \u2014 element not found`,
              "color:#dc2626"
            );
            continue;
          }
          if (el.id && el.id.startsWith("checkMarkOption_")) continue;
          if (isCheckboxChecked(el) === shouldCheck) continue;
          console.log(
            `%c[CHECKBOX FINAL] "${fieldLabel}" \u2014 re-clicking`,
            "color:#FF9800; font-weight:bold"
          );
          clickCheckboxElement(el);
        }
        if (checkboxFields.length > 0) {
          [500, 1e3].forEach((delay) => {
            setTimeout(() => {
              const watchInputs = getAllElementsDeep();
              checkboxFields.forEach((field) => {
                const fieldLabel = field.label || field.name || field.placeholder || field.id || "(unknown)";
                const valStr = String(field.value).toLowerCase();
                const shouldCheck = valStr === "true" || valStr === "on" || field.value === true;
                const liveEl = findElement(field, watchInputs);
                if (!liveEl) {
                  console.warn(
                    `%c[CB WATCH +${delay}ms] "${fieldLabel}" \u2014 NOT FOUND`,
                    "color:#dc2626"
                  );
                } else if (liveEl.id && liveEl.id.startsWith("checkMarkOption_")) {
                } else if (liveEl.checked === shouldCheck) {
                  console.log(
                    `%c[CB WATCH +${delay}ms] "${fieldLabel}" checked=${liveEl.checked} \u2713 PERSISTED`,
                    "color:#1a9e5a"
                  );
                } else {
                  console.warn(
                    `%c[CB WATCH +${delay}ms] "${fieldLabel}" checked=${liveEl.checked} expected=${shouldCheck} \u2717 WIPED`,
                    "color:#dc2626; font-weight:bold"
                  );
                }
              });
            }, delay);
          });
        }
      }
      console.log(
        `%c[LISTIFY FILL] \u2550\u2550\u2550 Done: ${filledCount} filled, ${notFoundCount} not found, ${optionNotFoundCount} options missed \u2550\u2550\u2550`,
        "color: #2196F3; font-weight: bold; font-size: 13px"
      );
      if (notFoundLabels.length)
        console.log(
          `%c[LISTIFY FILL]   Missing: ${notFoundLabels.join(", ")}`,
          "color: #dc2626"
        );
      if (optionNotFoundLabels.length)
        console.log(
          `%c[LISTIFY FILL]   Options missed: ${optionNotFoundLabels.join(", ")}`,
          "color: #dc2626"
        );
      if (sizeFields.length > 0) {
        [500, 1e3, 2e3].forEach((delay) => {
          setTimeout(() => {
            const liveInputs = getAllElementsDeep();
            sizeFields.forEach(({ field, fieldLabel }) => {
              const expectedVal = String(field.value).trim();
              const liveEl = findElement(field, liveInputs);
              const liveVal = liveEl ? liveEl.value : "NOT FOUND";
              const connected = liveEl ? liveEl.isConnected : false;
              if (liveVal === expectedVal) {
                console.log(
                  `%c[SIZE WATCH +${delay}ms]   "${fieldLabel}" live="${liveVal}" connected=${connected} \u2713`,
                  "color:#1a9e5a"
                );
              } else {
                console.warn(
                  `%c[SIZE WATCH +${delay}ms]   "${fieldLabel}" WIPED live="${liveVal}" expected="${expectedVal}" connected=${connected} \u2717`,
                  "color:#dc2626; font-weight:bold"
                );
              }
            });
          }, delay);
        });
      }
      return {
        filledCount,
        notFoundCount,
        optionNotFoundCount,
        notFoundLabels,
        optionNotFoundLabels
      };
    }
    (function initCategoryDetector() {
      if (window !== window.top) return;
      if (!window.location.hostname.includes("meesho")) return;
      function directText(el) {
        let t = "";
        el.childNodes.forEach((n) => {
          if (n.nodeType === Node.TEXT_NODE) t += n.textContent;
        });
        return t.replace(/\s+/g, " ").trim();
      }
      function isValidCategoryText(text) {
        if (!text) return false;
        const t = text.trim();
        if (t.length < 3 || t.length > 60) return false;
        if (!/[a-zA-Z\u0900-\u097F]/.test(t)) return false;
        if (/[₹$€£%]/.test(t)) return false;
        if (t.split(/\s+/).length > 5) return false;
        const lower = t.toLowerCase();
        const words = lower.split(/\s+/);
        const excludedPhrases = /* @__PURE__ */ new Set([
          // UI states / confirmations
          "ok",
          "done",
          "yes",
          "no",
          "more",
          "less",
          // Meesho status labels
          "published",
          "unpublished",
          "draft",
          "live",
          "active",
          "inactive",
          "pending",
          "approved",
          "rejected",
          "blocked",
          "paused",
          // Seller-portal navigation (single words)
          "dashboard",
          "products",
          "orders",
          "reports",
          "settings",
          "profile",
          "logout",
          "login",
          "home",
          "help",
          "support",
          "notifications",
          "catalogue",
          "catalog",
          "listing",
          "inventory",
          "payments",
          "returns",
          "complaints",
          "coupons",
          // Form field names that can look like categories
          "price",
          "quantity",
          "stock",
          "mrp",
          "gst",
          "hsn",
          "sku",
          "color",
          "colour",
          "size",
          "weight",
          "material",
          "brand",
          "description",
          "image",
          "images",
          "photo",
          "photos",
          // Known multi-word UI labels
          "view all",
          "see all",
          "load more",
          "show more",
          "sort by",
          "filter",
          "all categories",
          "select category",
          "choose category",
          "your categories",
          "search category",
          "product name",
          "brand name",
          "selling price",
          "product image",
          "main image",
          "add image",
          "single catalogue",
          "form field"
        ]);
        if (excludedPhrases.has(lower)) return false;
        const actionVerbs = /* @__PURE__ */ new Set([
          "add",
          "upload",
          "create",
          "save",
          "cancel",
          "delete",
          "edit",
          "update",
          "remove",
          "select",
          "choose",
          "search",
          "clear",
          "reset",
          "submit",
          "back",
          "next",
          "previous",
          "prev",
          "confirm",
          "skip",
          "in",
          "continue",
          "proceed",
          "apply",
          "close",
          "view",
          "show",
          "load",
          "see",
          "go",
          "move",
          "publish",
          "unpublish",
          "activate",
          "deactivate",
          "enable",
          "disable",
          "download",
          "export",
          "import",
          "preview",
          "review",
          "check",
          "change",
          "modify",
          "manage",
          "open",
          "expand",
          "collapse",
          "enter",
          "type",
          "write",
          "click",
          "tap",
          "copy",
          "paste",
          "share",
          "send",
          "verify",
          "refresh",
          "reload",
          "increase",
          "decrease",
          "scroll"
        ]);
        if (words.length > 0 && actionVerbs.has(words[0])) return false;
        return true;
      }
      let _lastSaveTs = 0;
      const isPageReload = performance.getEntriesByType("navigation").some((nav) => nav.type === "reload");
      if (isPageReload) {
        sessionStorage.removeItem("listify_cat_locked");
        sessionStorage.setItem("listify_cat_armed", "1");
      }
      let _catArmed = sessionStorage.getItem("listify_cat_armed") === "1";
      let _catLocked = sessionStorage.getItem("listify_cat_locked") === "1";
      function isInCategoryList(target) {
        return !!target.closest('[data-testid="categoryTree"]');
      }
      function detectCategory(target) {
        const onCategoryPage = window.location.pathname.includes("select-category");
        if (!onCategoryPage && !isInCategoryList(target)) return null;
        if (onCategoryPage && !_catArmed) return null;
        let el = target;
        for (let depth = 0; depth < 6 && el && el.tagName !== "BODY"; depth++, el = el.parentElement) {
          const dv = (el.getAttribute("data-value") || "").trim();
          if (dv && isValidCategoryText(dv)) return dv;
          const dt = directText(el);
          if (dt && isValidCategoryText(dt)) return dt;
          const it = (el.innerText || "").replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
          if (it && isValidCategoryText(it) && it.length < 50) return it;
        }
        return null;
      }
      function saveStep(category) {
        if (!chrome.runtime?.id) return;
        const now = Date.now();
        if (now - _lastSaveTs < 300) return;
        _lastSaveTs = now;
        if (!_catArmed) {
          console.log(
            `%c[LISTIFY] Skipped (not armed): "${category}"`,
            "color:#aaa"
          );
          return;
        }
        if (_catLocked) {
          console.log(
            `%c[LISTIFY] Skipped (locked \u2014 category finalized on image upload): "${category}"`,
            "color:#aaa"
          );
          return;
        }
        sessionStorage.setItem("listify_tab_category", category);
        try {
          chrome.runtime?.sendMessage(
            { action: "save_tab_category", category },
            () => {
              if (chrome.runtime?.lastError) return;
              console.log(
                `%c[LISTIFY] Category updated (unlocked): "${category}"`,
                "color:#4caf50;font-weight:bold"
              );
            }
          );
        } catch (_) {
        }
      }
      document.addEventListener(
        "click",
        (e) => {
          if (!chrome.runtime?.id) return;
          if (window.__listify_is_filling) return;
          if (e.target.closest('[id^="__listify"]')) return;
          const txt = (e.target.innerText || e.target.textContent || "").trim().toLowerCase();
          const aria = (e.target.getAttribute("aria-label") || "").toLowerCase();
          if (txt.includes("add single") || txt.includes("single catalog") || txt.includes("single catalogue")) {
            if (!sessionStorage.getItem("listify_tab_category")) {
              const activeEls = document.querySelectorAll(
                '[class*="css-17tijmj"] > div, [class*="css-2kcxef"] > div, div:has(> svg[color="#3C29B7"])'
              );
              if (activeEls.length > 0) {
                const deepestCat = (activeEls[activeEls.length - 1].innerText || "").trim();
                if (deepestCat && !isGenericText(deepestCat)) {
                  console.log(
                    `[LISTIFY] Scraped auto-selected default category: "${deepestCat}"`
                  );
                  sessionStorage.setItem("listify_tab_category", deepestCat);
                  try {
                    chrome.runtime?.sendMessage({
                      action: "save_tab_category",
                      category: deepestCat
                    });
                  } catch (_) {
                  }
                }
              }
            }
            _catArmed = true;
            _catLocked = false;
            _lastSaveTs = 0;
            sessionStorage.setItem("listify_cat_armed", "1");
            sessionStorage.removeItem("listify_cat_locked");
            console.log(
              "%c[LISTIFY] Add Single Catalog detected \u2014 heading to form.",
              "color:#ff4f1f"
            );
            return;
          }
          const isResetClick = txt === "change category" || txt === "change" || aria === "back" || e.target.closest('[aria-label="back"]');
          if (isResetClick && !isInCategoryList(e.target)) {
            _lastSaveTs = 0;
            _catArmed = true;
            _catLocked = false;
            sessionStorage.setItem("listify_cat_armed", "1");
            sessionStorage.removeItem("listify_cat_locked");
            sessionStorage.removeItem("listify_tab_category");
            try {
              chrome.runtime?.sendMessage({ action: "clear_tab_category" });
            } catch (_) {
            }
          }
          const cat = detectCategory(e.target);
          if (cat) {
            saveStep(cat);
            setTimeout(() => {
              const leaf = scrapeLastColumnCategory();
              if (leaf && leaf !== cat) {
                saveStep(leaf);
              }
            }, 400);
          }
        },
        true
      );
      document.addEventListener(
        "click",
        (e) => {
          if (!chrome.runtime?.id) return;
          const btn = e.target.closest("button");
          if (!btn) return;
          const btnText = (btn.textContent || "").trim().toLowerCase();
          if (!btnText.includes("add product image")) return;
          const leaf = scrapeBreadcrumbCategory();
          if (leaf) {
            console.log(
              `%c[LISTIFY] "Add Product Images" clicked \u2014 breadcrumb category: "${leaf}"`,
              "color:#ff4f1f;font-weight:bold"
            );
            sessionStorage.setItem("listify_tab_category", leaf);
            try {
              chrome.runtime?.sendMessage({
                action: "save_tab_category",
                category: leaf
              });
            } catch (_) {
            }
            _catLocked = true;
            _catArmed = false;
            sessionStorage.setItem("listify_cat_locked", "1");
            sessionStorage.removeItem("listify_cat_armed");
          }
        },
        true
      );
      document.addEventListener(
        "change",
        (e) => {
          if (!chrome.runtime?.id) return;
          if (e.target && e.target.type === "file" && e.target.files && e.target.files.length > 0) {
            if (_catArmed && !_catLocked) {
              _catLocked = true;
              _catArmed = false;
              sessionStorage.setItem("listify_cat_locked", "1");
              sessionStorage.removeItem("listify_cat_armed");
              console.log(
                `%c[LISTIFY] Image uploaded! Category is now LOCKED.`,
                "color:#ff4f1f;font-weight:bold;font-size:14px;"
              );
            }
          }
        },
        true
      );
      let _lastUrl = window.location.href;
      function scrapeLastColumnCategory() {
        const tree = document.querySelector('[data-testid="categoryTree"]');
        if (!tree) return null;
        const columns = tree.querySelectorAll(".css-jex737");
        if (columns.length === 0) return null;
        const lastCol = columns[columns.length - 1];
        const active = lastCol.querySelector('[class*="css-17tijmj"] > div');
        if (active) {
          const txt = (active.innerText || "").trim();
          if (txt && isValidCategoryText(txt)) return txt;
        }
        const items = lastCol.querySelectorAll(".css-yeouz0 > p");
        if (items.length === 1) {
          const txt = (items[0].innerText || "").trim();
          if (txt && isValidCategoryText(txt)) return txt;
        }
        return null;
      }
      function scrapeDefaultCategory() {
        const lastColCat = scrapeLastColumnCategory();
        if (lastColCat) return lastColCat;
        const tree = document.querySelector('[data-testid="categoryTree"]') || document.body;
        const bysvg = tree.querySelectorAll('div:has(> svg[color="#3C29B7"])');
        if (bysvg.length > 0) {
          const deepest = bysvg[bysvg.length - 1];
          const txt = (deepest.innerText || "").trim();
          if (txt && isValidCategoryText(txt)) return txt;
        }
        const byCss = tree.querySelectorAll(
          '[class*="css-17tijmj"] > div, [class*="css-2kcxef"] > div'
        );
        if (byCss.length > 0) {
          const txt = (byCss[byCss.length - 1].innerText || "").trim();
          if (txt && isValidCategoryText(txt)) return txt;
        }
        return null;
      }
      let _defaultCatObserver = null;
      function watchDefaultCategory() {
        if (_defaultCatObserver) {
          _defaultCatObserver.disconnect();
          _defaultCatObserver = null;
        }
        const existing = sessionStorage.getItem("listify_tab_category") || "";
        if (existing && !/^in\s/i.test(existing)) {
          return;
        }
        const immediate = scrapeDefaultCategory();
        if (immediate) {
          sessionStorage.setItem("listify_tab_category", immediate);
          try {
            chrome.runtime?.sendMessage({
              action: "save_tab_category",
              category: immediate
            });
          } catch (_) {
          }
          return;
        }
        const giveUpAt = Date.now() + 8e3;
        _defaultCatObserver = new MutationObserver(() => {
          if (sessionStorage.getItem("listify_tab_category")) {
            _defaultCatObserver.disconnect();
            _defaultCatObserver = null;
            return;
          }
          const cat = scrapeDefaultCategory();
          if (cat) {
            sessionStorage.setItem("listify_tab_category", cat);
            try {
              chrome.runtime?.sendMessage({
                action: "save_tab_category",
                category: cat
              });
            } catch (_) {
            }
            _defaultCatObserver.disconnect();
            _defaultCatObserver = null;
          } else if (Date.now() > giveUpAt) {
            _defaultCatObserver.disconnect();
            _defaultCatObserver = null;
          }
        });
        _defaultCatObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
      const _isCategoryPage = () => window.location.pathname.includes("select-category") || window.location.pathname.includes("category") || !!document.querySelector('[data-testid="categoryTree"]');
      if (_isCategoryPage()) {
        if (isPageReload) {
          sessionStorage.removeItem("listify_tab_category");
          try {
            chrome.runtime?.sendMessage({ action: "clear_tab_category" });
          } catch (_) {
          }
        }
        watchDefaultCategory();
      }
      function _onSpaNav() {
        const newUrl = window.location.href;
        if (newUrl === _lastUrl) return;
        const wasOnForm = _lastUrl.includes("/add");
        const isOnForm = newUrl.includes("/add");
        _lastUrl = newUrl;
        checkAutoOpenMeeshoSidebar();
        if (wasOnForm && !isOnForm) {
          _catArmed = false;
          _catLocked = false;
          _lastSaveTs = 0;
          sessionStorage.removeItem("listify_cat_armed");
          sessionStorage.removeItem("listify_cat_locked");
          sessionStorage.removeItem("listify_tab_category");
          try {
            chrome.runtime?.sendMessage({ action: "clear_tab_category" });
          } catch (_) {
          }
        }
        if (newUrl.includes("select-category") || newUrl.includes("category")) {
          sessionStorage.removeItem("listify_tab_category");
          try {
            chrome.runtime?.sendMessage({ action: "clear_tab_category" });
          } catch (_) {
          }
          _catArmed = true;
          _catLocked = false;
          sessionStorage.setItem("listify_cat_armed", "1");
          sessionStorage.removeItem("listify_cat_locked");
          watchDefaultCategory();
        }
      }
      const _origPush = history.pushState.bind(history);
      const _origReplace = history.replaceState.bind(history);
      history.pushState = function(...args) {
        _origPush(...args);
        _onSpaNav();
      };
      history.replaceState = function(...args) {
        _origReplace(...args);
        _onSpaNav();
      };
      window.addEventListener("popstate", _onSpaNav);
      console.log("[LISTIFY] Category tracking Active.");
    })();
    (function initFloatingSaveButton() {
      if (window !== window.top) return;
      if (!window.location.hostname.includes("meesho")) return;
      if (document.getElementById("__listify_toolbar__")) return;
      const FONT = "'Inter',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI Variable','Segoe UI',Roboto,sans-serif";
      (function injectInterFont() {
        try {
          if (document.getElementById("__listify_inter_font__")) return;
          const fontUrl = chrome.runtime?.getURL("fonts/inter-latin.woff2");
          const style = document.createElement("style");
          style.id = "__listify_inter_font__";
          style.textContent = "@font-face{font-family:'Inter';font-style:normal;font-weight:400 700;font-display:swap;src:url('" + fontUrl + "') format('woff2');}";
          (document.head || document.documentElement).appendChild(style);
        } catch (e) {
        }
      })();
      function sp(el, prop, val) {
        el.style.setProperty(prop, val, "important");
      }
      function applyStyles(el, styles) {
        Object.entries(styles).forEach(([k, v]) => sp(el, k, v));
      }
      const autofillBtn = document.createElement("button");
      autofillBtn.id = "__listify_autofill_btn__";
      autofillBtn.title = "Fill form using saved A+ Studio template";
      autofillBtn.innerHTML = `Fill`;
      applyStyles(autofillBtn, {
        padding: "7px 14px",
        "border-radius": "8px",
        background: "#1a9e5a",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        outline: "none",
        "box-shadow": "0 2px 8px rgba(26,158,90,0.3)",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        "font-size": "12px",
        "font-weight": "600",
        "font-family": FONT,
        "letter-spacing": "0.01em",
        "white-space": "nowrap",
        transition: "opacity 0.15s, box-shadow 0.15s",
        "line-height": "1"
      });
      autofillBtn.addEventListener(
        "mouseenter",
        () => sp(autofillBtn, "box-shadow", "0 6px 22px rgba(26,158,90,0.55)")
      );
      autofillBtn.addEventListener(
        "mouseleave",
        () => sp(autofillBtn, "box-shadow", "0 4px 18px rgba(26,158,90,0.4)")
      );
      autofillBtn.addEventListener(
        "mousedown",
        () => sp(autofillBtn, "opacity", "0.85")
      );
      autofillBtn.addEventListener(
        "mouseup",
        () => sp(autofillBtn, "opacity", "1")
      );
      let _autofillOrigHTML = autofillBtn.innerHTML;
      autofillBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (window.__listify_is_filling) {
          window.__listify_abort_fill = true;
          window.__listify_is_filling = false;
          autofillBtn.innerHTML = _autofillOrigHTML;
          autofillBtn.disabled = false;
          showToast("Fill stopped", "off");
          return;
        }
        window.__listify_is_filling = true;
        window.__listify_abort_fill = false;
        _autofillOrigHTML = autofillBtn.innerHTML;
        autofillBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right:6px;vertical-align:middle;flex-shrink:0"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>Stop`;
        try {
          const domCategory = detectCurrentCategory();
          const sessionCategory = sessionStorage.getItem("listify_tab_category") || "";
          let storedCategory = "";
          try {
            const bgCat = await chrome.runtime?.sendMessage({
              action: "get_my_tab_category"
            });
            storedCategory = (bgCat?.category || "").trim();
          } catch (_) {
          }
          const domCategory_resolved = sessionCategory || storedCategory || domCategory;
          const result = await chrome.runtime?.sendMessage({
            action: "trigger_autofill",
            domCategory: domCategory_resolved
          });
          if (result && result.ok && result.template) {
            if (window.__listify_abort_fill) return;
            showToast(`Filling from ${result.category} template`, "success");
            autofillBtn.innerHTML = `Filling\u2026`;
            await fillForm(result.template, {
              resolvedCategory: result.category
            });
            if (window.__listify_abort_fill) return;
            window.__listify_page_filled = true;
            chrome.runtime?.sendMessage({
              action: "record_template_usage",
              templateId: result.template._id
            });
            autofillBtn.innerHTML = `Done!`;
            setTimeout(() => {
              autofillBtn.innerHTML = _autofillOrigHTML;
              autofillBtn.disabled = false;
            }, 2e3);
          } else if (result && result.error === "fill_limit_exceeded") {
            showToast(
              `You've used all ${result.fillLimit} free form fills this month. Upgrade to continue \u2014 aplusstudio.iprixmedia.com/dashboard/subscription`,
              "warning"
            );
            autofillBtn.innerHTML = _autofillOrigHTML;
            autofillBtn.disabled = false;
          } else if (result && result.error === "no_category_match") {
            showToast(`No template saved for "${result.category}"`, "warning");
            autofillBtn.innerHTML = _autofillOrigHTML;
            autofillBtn.disabled = false;
          } else {
            showToast(result && result.error || "Fill failed.", "error");
            autofillBtn.innerHTML = _autofillOrigHTML;
            autofillBtn.disabled = false;
          }
        } catch (err) {
          if (!window.__listify_abort_fill)
            showToast(err.message || "Fill error.", "error");
          autofillBtn.innerHTML = _autofillOrigHTML;
          autofillBtn.disabled = false;
        } finally {
          window.__listify_is_filling = false;
          window.__listify_abort_fill = false;
        }
      });
      const fab = document.createElement("button");
      fab.id = "__listify_save_btn__";
      fab.title = "Save current form as an A+ Studio template";
      fab.innerHTML = `Save Template`;
      applyStyles(fab, {
        padding: "7px 14px",
        "border-radius": "8px",
        background: "#4f46e5",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        outline: "none",
        "box-shadow": "0 2px 8px rgba(79,70,229,0.28)",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        "font-size": "12px",
        "font-weight": "600",
        "font-family": FONT,
        "letter-spacing": "0.01em",
        "white-space": "nowrap",
        transition: "opacity 0.15s, box-shadow 0.15s",
        "line-height": "1"
      });
      fab.addEventListener(
        "mouseenter",
        () => sp(fab, "box-shadow", "0 6px 22px rgba(79,70,229,0.42)")
      );
      fab.addEventListener(
        "mouseleave",
        () => sp(fab, "box-shadow", "0 4px 18px rgba(79,70,229,0.3)")
      );
      fab.addEventListener("mousedown", () => sp(fab, "opacity", "0.85"));
      fab.addEventListener("mouseup", () => sp(fab, "opacity", "1"));
      window.__listify_page_filled = false;
      let _lastPageUrl = window.location.href;
      setInterval(() => {
        if (window.location.href !== _lastPageUrl) {
          _lastPageUrl = window.location.href;
          window.__listify_page_filled = false;
        }
        const toolbar = document.getElementById("__listify_toolbar__");
        if (toolbar) {
          if (/\/catalogs\/single\/add/.test(window.location.href)) {
            toolbar.style.setProperty("display", "flex", "important");
          } else {
            toolbar.style.setProperty("display", "none", "important");
          }
        }
      }, 1e3);
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "local") return;
        const catKey = Object.keys(changes).find(
          (k) => k.startsWith("listify_cat_")
        );
        if (!catKey) return;
        const newCat = changes[catKey].newValue;
        if (newCat) {
          setTimeout(async () => {
            if (document.visibilityState !== "visible") return;
            if (window.__listify_is_filling) return;
            if (window.__listify_page_filled) return;
            window.__listify_is_filling = true;
            try {
              const stored = await chrome.storage?.local.get([
                "listify_autofill_enabled"
              ]);
              if (stored.listify_autofill_enabled === false) {
                window.__listify_is_filling = false;
                return;
              }
              const domCategory = newCat || detectCurrentCategory();
              const result = await chrome.runtime?.sendMessage({
                action: "trigger_autofill",
                domCategory,
                autoTriggered: true
              });
              if (result && result.ok && result.template) {
                window.__listify_page_filled = true;
                const origHTML = autofillBtn.innerHTML;
                autofillBtn.innerHTML = `Filling\u2026`;
                autofillBtn.disabled = true;
                showToast(`Auto-filling ${result.category}\u2026`, "info");
                const fillRes = await fillForm(result.template, {
                  resolvedCategory: result.category
                });
                chrome.runtime?.sendMessage({
                  action: "record_template_usage",
                  templateId: result.template._id
                });
                autofillBtn.innerHTML = `Done!`;
                setTimeout(() => {
                  autofillBtn.innerHTML = origHTML;
                  autofillBtn.disabled = false;
                }, 2e3);
                const missed = (fillRes.optionNotFoundCount || 0) + (fillRes.notFoundCount || 0);
                const fillMsg = missed > 0 ? `Auto-filled ${fillRes.filledCount} field(s) \xB7 ${missed} missed` : `Auto-filled ${fillRes.filledCount} field(s) \u2713`;
                showToast(fillMsg, missed > 0 ? "warning" : "success");
              } else if (result && result.error === "fill_limit_exceeded") {
                showToast(
                  `You've used all ${result.fillLimit} free form fills this month. Upgrade at aplusstudio.iprixmedia.com/dashboard/subscription`,
                  "warning"
                );
              } else if (result && result.error === "no_category_match") {
                showToast(
                  `No template saved for "${result.category}"`,
                  "warning"
                );
              }
            } catch (e) {
            } finally {
              window.__listify_is_filling = false;
            }
          }, 2500);
        }
      });
      const backdrop = document.createElement("div");
      backdrop.id = "__listify_save_modal__";
      applyStyles(backdrop, {
        display: "none",
        position: "fixed",
        inset: "0",
        "z-index": "2147483646",
        background: "rgba(0,0,0,0.38)",
        "align-items": "center",
        "justify-content": "center"
      });
      document.body.appendChild(backdrop);
      const modal = document.createElement("div");
      applyStyles(modal, {
        background: "#fff",
        "border-radius": "14px",
        padding: "22px",
        width: "300px",
        "box-shadow": "0 10px 40px rgba(0,0,0,0.22)",
        "font-family": FONT
      });
      backdrop.appendChild(modal);
      function makeEl(tag, styles, text) {
        const el = document.createElement(tag);
        if (styles) applyStyles(el, styles);
        if (text !== void 0) el.textContent = text;
        return el;
      }
      const head = makeEl("div", {
        display: "flex",
        "align-items": "center",
        "justify-content": "space-between",
        "margin-bottom": "16px"
      });
      head.appendChild(
        makeEl(
          "span",
          { "font-size": "15px", "font-weight": "700", color: "#111" },
          "Save Template"
        )
      );
      head.appendChild(
        makeEl(
          "span",
          { "font-size": "12px", "font-weight": "700", color: "#4f46e5" },
          "A+ Studio"
        )
      );
      modal.appendChild(head);
      function makeField(labelText, inputId, placeholder) {
        const lbl = makeEl(
          "label",
          {
            display: "block",
            "font-size": "11px",
            "font-weight": "600",
            color: "#888",
            "text-transform": "uppercase",
            "letter-spacing": "0.06em",
            "margin-bottom": "5px",
            "margin-top": "12px"
          },
          labelText
        );
        modal.appendChild(lbl);
        const inp = makeEl("input", {
          width: "100%",
          padding: "9px 12px",
          border: "1.5px solid #e5e7eb",
          "border-radius": "8px",
          "font-size": "13px",
          color: "#111",
          outline: "none",
          "box-sizing": "border-box",
          "font-family": FONT,
          background: "#fff"
        });
        inp.id = inputId;
        inp.type = "text";
        inp.placeholder = placeholder;
        inp.addEventListener(
          "focus",
          () => sp(inp, "border", "1.5px solid #4f46e5")
        );
        inp.addEventListener(
          "blur",
          () => sp(inp, "border", "1.5px solid #e5e7eb")
        );
        modal.appendChild(inp);
        return inp;
      }
      const nameInput = makeField(
        "Template name",
        "__lfy_name__",
        "e.g. Saree Listing"
      );
      nameInput.style.marginTop = "0";
      const catInput = makeField("Category", "__lfy_cat__", "e.g. Women Ethnic");
      catInput.readOnly = true;
      sp(catInput, "background", "#f9fafb");
      sp(catInput, "color", "#6b7280");
      sp(catInput, "cursor", "not-allowed");
      const actions = makeEl("div", {
        display: "flex",
        gap: "8px",
        "margin-top": "16px"
      });
      modal.appendChild(actions);
      const saveBtn = makeEl(
        "button",
        {
          flex: "1",
          padding: "11px",
          background: "#4f46e5",
          color: "#fff",
          border: "none",
          "border-radius": "10px",
          "font-size": "13px",
          "font-weight": "700",
          cursor: "pointer",
          "font-family": FONT,
          "box-shadow": "0 2px 10px rgba(79,70,229,0.3)"
        },
        "Save"
      );
      const cancelBtn = makeEl(
        "button",
        {
          padding: "10px 14px",
          background: "#f3f4f6",
          color: "#555",
          border: "none",
          "border-radius": "8px",
          "font-size": "13px",
          cursor: "pointer",
          "font-family": FONT
        },
        "Cancel"
      );
      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);
      const statusMsg = makeEl("div", {
        "font-size": "12px",
        "margin-top": "10px",
        "min-height": "16px",
        color: "#888"
      });
      modal.appendChild(statusMsg);
      function setStatus(msg, type) {
        statusMsg.textContent = msg;
        sp(
          statusMsg,
          "color",
          type === "ok" ? "#1a9e5a" : type === "err" ? "#dc2626" : "#888"
        );
      }
      function openModal() {
        sp(backdrop, "display", "flex");
        nameInput.focus();
        nameInput.select();
      }
      function closeModal() {
        sp(backdrop, "display", "none");
      }
      fab.addEventListener("click", async (e) => {
        e.stopPropagation();
        const breadcrumbCat = scrapeBreadcrumbCategory();
        console.log(
          "[LISTIFY SAVE] Breadcrumb category:",
          breadcrumbCat || "(none)"
        );
        const domCat = detectCurrentCategory();
        console.log("[LISTIFY SAVE] DOM detected category:", domCat || "(none)");
        const sessionCat = sessionStorage.getItem("listify_tab_category") || "";
        console.log("[LISTIFY SAVE] Session category:", sessionCat || "(none)");
        const quickCat = breadcrumbCat || sessionCat || domCat;
        catInput.value = quickCat;
        nameInput.value = document.title.replace(/[-|–|:].*$/, "").trim() || "My Template";
        saveBtn.textContent = "Save";
        saveBtn.disabled = false;
        setStatus("");
        openModal();
        if (!quickCat) {
          try {
            const bgRes = await chrome.runtime?.sendMessage({
              action: "get_my_tab_category"
            });
            const storedCat = (bgRes?.category || "").trim();
            console.log(
              "[LISTIFY SAVE] Per-tab storage category:",
              storedCat || "(none)"
            );
            if (storedCat && !catInput.value) {
              catInput.value = storedCat;
              console.log("[LISTIFY SAVE] Using category:", storedCat);
            }
          } catch (_) {
          }
        }
      });
      cancelBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeModal();
      });
      backdrop.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.target === backdrop) closeModal();
      });
      saveBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const name = nameInput.value.trim();
        if (!name) {
          setStatus("Please enter a template name.", "err");
          return;
        }
        saveBtn.disabled = true;
        saveBtn.textContent = "Scanning\u2026";
        setStatus("");
        try {
          const formData = await scanForms();
          if (!formData.fields || formData.fields.length === 0) {
            setStatus("No form fields found on this page.", "err");
            saveBtn.disabled = false;
            saveBtn.textContent = "Save";
            return;
          }
          const imgEl = findProductImageEl();
          let imageUrl = null;
          if (imgEl) {
            const src = imgEl.src || "";
            if (src.startsWith("http") && !src.startsWith("data:")) {
              imageUrl = src;
            }
            console.log(
              "[LISTIFY SAVE] Image URL captured:",
              imageUrl || "(none \u2014 blob or not found)"
            );
          }
          const fields = [...formData.fields];
          if (imageUrl) {
            fields.push({
              label: "image_url",
              value: imageUrl,
              type: "image",
              id: "",
              name: "image_url",
              placeholder: "",
              selector: 'input[type="file"]'
            });
          }
          saveBtn.textContent = "Saving\u2026";
          const category = catInput.value.trim() || formData.category || "";
          console.log(
            "[LISTIFY SAVE] scanForms category:",
            formData.category || "(none)"
          );
          console.log(
            "[LISTIFY SAVE] catInput value:",
            catInput.value || "(none)"
          );
          console.log(
            "[LISTIFY SAVE] Final category sent to server:",
            category || "(none)"
          );
          console.log(
            "[LISTIFY SAVE] Total fields:",
            fields.length,
            imageUrl ? "(includes image_url)" : "(no image)"
          );
          const result = await chrome.runtime?.sendMessage({
            action: "save_template",
            payload: { name, url: formData.domain, fields, category }
          });
          if (result && result.ok) {
            setStatus(`Saved! ${formData.fields.length} fields captured.`, "ok");
            saveBtn.textContent = "Saved \u2713";
            setTimeout(closeModal, 1800);
          } else {
            setStatus(result && result.error || "Save failed.", "err");
            saveBtn.disabled = false;
            saveBtn.textContent = "Save";
          }
        } catch (e2) {
          setStatus(e2.message || "Unexpected error.", "err");
          saveBtn.disabled = false;
          saveBtn.textContent = "Save";
        }
      });
      const aiFab = document.createElement("button");
      aiFab.id = "__listify_ai_fab__";
      aiFab.title = "AI Fill title & description";
      aiFab.innerHTML = `AI Fill`;
      applyStyles(aiFab, {
        padding: "7px 14px",
        "border-radius": "8px",
        background: "#7c3aed",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        outline: "none",
        "box-shadow": "0 2px 8px rgba(124,58,237,0.3)",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        "font-size": "12px",
        "font-weight": "600",
        "font-family": FONT,
        "letter-spacing": "0.01em",
        "white-space": "nowrap",
        transition: "opacity 0.15s, box-shadow 0.15s",
        "line-height": "1"
      });
      aiFab.addEventListener(
        "mouseenter",
        () => sp(aiFab, "box-shadow", "0 6px 22px rgba(124,58,237,0.55)")
      );
      aiFab.addEventListener(
        "mouseleave",
        () => sp(aiFab, "box-shadow", "0 4px 18px rgba(124,58,237,0.4)")
      );
      aiFab.addEventListener("mousedown", () => sp(aiFab, "opacity", "0.85"));
      aiFab.addEventListener("mouseup", () => sp(aiFab, "opacity", "1"));
      function findProductImageEl() {
        function isValidSrc(src) {
          return src && !src.startsWith("chrome-extension://") && !src.startsWith("data:image/svg");
        }
        function visibleEnough(img, minSize) {
          const r = img.getBoundingClientRect();
          return r.width >= minSize && r.height >= minSize;
        }
        for (const fi of document.querySelectorAll('input[type="file"]')) {
          let container = fi.parentElement;
          for (let d = 0; d < 6 && container; d++, container = container.parentElement) {
            for (const img of container.querySelectorAll("img")) {
              const src = img.src || "";
              if (isValidSrc(src) && visibleEnough(img, 40)) return img;
            }
          }
        }
        const uploadSelectors = [
          '[class*="upload"] img',
          '[class*="Upload"] img',
          '[class*="preview"] img',
          '[class*="Preview"] img',
          '[class*="product-image"] img',
          '[class*="ProductImage"] img',
          '[class*="image-card"] img',
          '[class*="ImageCard"] img',
          '[class*="thumbnail"] img',
          '[class*="Thumbnail"] img'
        ];
        for (const sel of uploadSelectors) {
          for (const img of document.querySelectorAll(sel)) {
            const src = img.src || "";
            if (isValidSrc(src) && visibleEnough(img, 50)) return img;
          }
        }
        for (const img of document.querySelectorAll("img")) {
          const src = img.src || "";
          if (!src || src.startsWith("chrome-extension://") || img.closest('[id^="__listify"]'))
            continue;
          if (visibleEnough(img, 80)) return img;
        }
        return null;
      }
      function imgToBase64(imgEl) {
        return new Promise((resolve) => {
          try {
            const canvas = document.createElement("canvas");
            const maxSize = 800;
            const w = imgEl.naturalWidth || imgEl.width || 400;
            const h = imgEl.naturalHeight || imgEl.height || 400;
            const scale = Math.min(1, maxSize / Math.max(w, h));
            canvas.width = Math.round(w * scale);
            canvas.height = Math.round(h * scale);
            canvas.getContext("2d").drawImage(imgEl, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          } catch (_) {
            resolve(null);
          }
        });
      }
      async function runAiFill() {
        const origHTML = aiFab.innerHTML;
        aiFab.innerHTML = `Scanning\u2026`;
        aiFab.disabled = true;
        try {
          const category = detectCurrentCategory();
          const formData = await scanForms();
          const fields = formData.fields.filter(
            (f) => f.label && f.value && typeof f.value === "string" && f.value.trim()
          ).map((f) => ({ label: f.label, value: String(f.value).trim() }));
          const imgEl = findProductImageEl();
          let imageUrl = null;
          if (imgEl) {
            const src = imgEl.src || "";
            if (src.startsWith("blob:") || src.startsWith("data:")) {
              imageUrl = await imgToBase64(imgEl);
            } else {
              imageUrl = src;
            }
          }
          aiFab.innerHTML = `Generating\u2026`;
          const result = await chrome.runtime?.sendMessage({
            action: "ai_fill",
            category,
            fields,
            imageUrl
          });
          if (!result || !result.success) {
            showToast(result?.error || "AI fill failed.", "error");
            aiFab.innerHTML = origHTML;
            aiFab.disabled = false;
            return;
          }
          const { title, description } = result.data;
          const allInputs = getAllElementsDeep();
          let filled = 0;
          const matchesKw = (el, kws) => {
            const label = getSurroundingText(el).toLowerCase();
            const ph = (el.placeholder || "").toLowerCase();
            const nm = (el.name || "").toLowerCase();
            const id = (el.id || "").toLowerCase();
            return kws.some(
              (k) => label.includes(k) || ph.includes(k) || nm.includes(k) || id.includes(k)
            );
          };
          if (title) {
            const el = allInputs.find(
              (el2) => (el2.tagName === "INPUT" || el2.tagName === "TEXTAREA") && matchesKw(el2, ["title", "product name"])
            );
            if (el) {
              setElementValue(el, title);
              filled++;
            }
          }
          if (description) {
            const el = allInputs.find(
              (el2) => (el2.tagName === "INPUT" || el2.tagName === "TEXTAREA") && matchesKw(el2, ["description", "desc", "about", "detail"])
            );
            if (el) {
              setElementValue(el, description);
              filled++;
            }
          }
          if (filled > 0) {
            aiFab.innerHTML = `Done!`;
            showToast(`AI filled ${filled} field(s)`, "success");
            setTimeout(() => {
              aiFab.innerHTML = origHTML;
              aiFab.disabled = false;
            }, 2e3);
          } else {
            showToast(
              "Title/description fields not found on this page.",
              "warning"
            );
            aiFab.innerHTML = origHTML;
            aiFab.disabled = false;
          }
        } catch (err) {
          showToast(err.message || "AI fill error.", "error");
          aiFab.innerHTML = origHTML;
          aiFab.disabled = false;
        }
      }
      aiFab.addEventListener("click", async (e) => {
        e.stopPropagation();
        await runAiFill();
      });
      const _AI_ICON_SPARKLE = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M9.5 3 8 6.5 4.5 8 8 9.5 9.5 13 11 9.5 14.5 8 11 6.5z"/><path d="M17.5 12l-1 2.5-2.5 1 2.5 1 1 2.5 1-2.5 2.5-1-2.5-1z" opacity=".8"/><path d="M5.5 16l-.75 1.75L3 18.5l1.75.75.75 1.75.75-1.75L8 18.5l-1.75-.75z" opacity=".6"/></svg>`;
      const _AI_ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
      const _AI_ICON_SPIN = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="5" r="2.5"/><circle cx="19" cy="12" r="2" opacity=".7"/><circle cx="12" cy="19" r="1.5" opacity=".4"/><circle cx="5" cy="12" r="1.5" opacity=".5"/></svg>`;
      function _makeAiIconBtn(id, tooltip, posOverrides = {}) {
        const btn = document.createElement("button");
        btn.id = id;
        btn.type = "button";
        btn.title = tooltip;
        btn.innerHTML = _AI_ICON_SPARKLE;
        applyStyles(
          btn,
          Object.assign(
            {
              position: "absolute",
              right: "8px",
              width: "22px",
              height: "22px",
              background: "#7c3aed",
              border: "none",
              "border-radius": "4px",
              cursor: "pointer",
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              padding: "4px",
              "z-index": "10",
              "box-shadow": "0 1px 4px rgba(124,58,237,0.4)",
              transition: "opacity 0.15s"
            },
            posOverrides
          )
        );
        btn.addEventListener("mouseenter", () => sp(btn, "opacity", "0.8"));
        btn.addEventListener("mouseleave", () => sp(btn, "opacity", "1"));
        return btn;
      }
      async function _runAiIconFill(btn, { fillTitle, fillDesc }) {
        const origHTML = btn.innerHTML;
        btn.innerHTML = _AI_ICON_SPIN;
        btn.disabled = true;
        try {
          const category = detectCurrentCategory() || sessionStorage.getItem("listify_tab_category") || "";
          const formData = await scanForms();
          const fields = formData.fields.filter(
            (f) => f.label && f.value && typeof f.value === "string" && f.value.trim()
          ).map((f) => ({ label: f.label, value: String(f.value).trim() }));
          const imgEl = findProductImageEl();
          let imageUrl = null;
          if (imgEl) {
            const src = imgEl.src || "";
            imageUrl = src.startsWith("blob:") || src.startsWith("data:") ? await imgToBase64(imgEl) : src;
          }
          const result = await chrome.runtime?.sendMessage({
            action: "ai_fill",
            category,
            fields,
            imageUrl
          });
          if (!result || !result.success) {
            showToast(result?.error || "AI fill failed.", "error");
            btn.innerHTML = origHTML;
            btn.disabled = false;
            return;
          }
          const { title, description } = result.data;
          const allLive = getAllElementsDeep();
          const _kw = (el, kws) => {
            const t = (getSurroundingText(el) + " " + (el.placeholder || "") + " " + (el.name || "") + " " + (el.id || "")).toLowerCase();
            return kws.some((k) => t.includes(k));
          };
          let filled = 0;
          if (fillTitle && title) {
            const el = allLive.find(
              (e) => (e.tagName === "INPUT" || e.tagName === "TEXTAREA") && _kw(e, ["title", "product name"])
            );
            if (el) {
              setElementValue(el, title);
              filled++;
            }
          }
          if (fillDesc && description) {
            const el = document.querySelector('textarea[name="comment"]') || allLive.find(
              (e) => e.tagName === "TEXTAREA" && _kw(e, ["description", "desc", "about", "detail"])
            );
            if (el) {
              setElementValue(el, description);
              filled++;
            }
          }
          if (filled > 0) {
            btn.innerHTML = _AI_ICON_CHECK;
            showToast(`AI filled ${filled} field(s)`, "success");
            setTimeout(() => {
              btn.innerHTML = origHTML;
              btn.disabled = false;
            }, 2e3);
          } else {
            showToast("Field not found on this page.", "warning");
            btn.innerHTML = origHTML;
            btn.disabled = false;
          }
        } catch (err) {
          showToast(err.message || "AI error.", "error");
          btn.innerHTML = origHTML;
          btn.disabled = false;
        }
      }
      function injectAiDescButton() {
        if (document.getElementById("__listify_ai_desc_btn__")) return;
        const descTextarea = document.querySelector('textarea[name="comment"]');
        if (!descTextarea) return;
        const inputRoot = descTextarea.closest(".MuiOutlinedInput-root") || descTextarea.parentElement;
        if (!inputRoot) return;
        sp(inputRoot, "position", "relative");
        const btn = _makeAiIconBtn(
          "__listify_ai_desc_btn__",
          "AI Fill Description",
          { bottom: "8px", top: "auto" }
        );
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          e.preventDefault();
          await _runAiIconFill(btn, { fillDesc: true, fillTitle: false });
        });
        inputRoot.appendChild(btn);
      }
      function injectAiTitleButton() {
        if (document.getElementById("__listify_ai_title_btn__")) return;
        const allInputs = getAllElementsDeep();
        const titleEl = allInputs.find((el) => {
          if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") return false;
          const t = (getSurroundingText(el) + " " + (el.placeholder || "") + " " + (el.name || "") + " " + (el.id || "")).toLowerCase();
          return ["title", "product name"].some((k) => t.includes(k));
        });
        if (!titleEl) return;
        const inputRoot = titleEl.closest(".MuiOutlinedInput-root") || titleEl.parentElement;
        if (!inputRoot) return;
        sp(inputRoot, "position", "relative");
        const btn = _makeAiIconBtn("__listify_ai_title_btn__", "AI Fill Title", {
          top: "50%",
          transform: "translateY(-50%)"
        });
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          e.preventDefault();
          await _runAiIconFill(btn, { fillTitle: true, fillDesc: false });
        });
        inputRoot.appendChild(btn);
      }
      function makeDragHandle(side) {
        const h = document.createElement("div");
        h.className = "__listify_drag_handle__";
        h.title = "Drag to move";
        h.innerHTML = `
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true">
          <circle cx="3" cy="3" r="1.3"/><circle cx="9" cy="3" r="1.3"/>
          <circle cx="3" cy="8" r="1.3"/><circle cx="9" cy="8" r="1.3"/>
          <circle cx="3" cy="13" r="1.3"/><circle cx="9" cy="13" r="1.3"/>
        </svg>`;
        applyStyles(h, {
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          padding: "6px 4px",
          [side === "right" ? "margin-left" : "margin-right"]: "2px",
          cursor: "grab",
          color: "#9ca3af",
          "border-radius": "6px",
          transition: "background 0.15s, color 0.15s",
          "user-select": "none",
          "-webkit-user-select": "none",
          "touch-action": "none"
        });
        h.addEventListener("mouseenter", () => {
          sp(h, "background", "#f3f4f6");
          sp(h, "color", "#000");
        });
        h.addEventListener("mouseleave", () => {
          sp(h, "background", "transparent");
          sp(h, "color", "#9ca3af");
        });
        return h;
      }
      function makeDraggable(toolbar, handles, storageKey) {
        const handleList = Array.isArray(handles) ? handles : [handles];
        let dragging = false;
        let activeHandle = null;
        let startX = 0, startY = 0, initLeft = 0, initTop = 0;
        function applyPos(left, top) {
          sp(toolbar, "left", left + "px");
          sp(toolbar, "top", top + "px");
          sp(toolbar, "right", "auto");
          sp(toolbar, "bottom", "auto");
          sp(toolbar, "transform", "none");
        }
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
          if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
            const maxX = Math.max(0, window.innerWidth - 80);
            const maxY = Math.max(0, window.innerHeight - 40);
            applyPos(
              Math.min(Math.max(0, saved.left), maxX),
              Math.min(Math.max(0, saved.top), maxY)
            );
          }
        } catch (_) {
        }
        handleList.forEach((handle) => {
          handle.addEventListener("pointerdown", (e) => {
            dragging = true;
            activeHandle = handle;
            try {
              handle.setPointerCapture(e.pointerId);
            } catch (_) {
            }
            const rect = toolbar.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            initLeft = rect.left;
            initTop = rect.top;
            sp(handle, "cursor", "grabbing");
            sp(toolbar, "transition", "none");
            e.preventDefault();
          });
          handle.addEventListener("pointermove", (e) => {
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
            try {
              handle.releasePointerCapture(e.pointerId);
            } catch (_) {
            }
            sp(handle, "cursor", "grab");
            sp(toolbar, "transition", "");
            const rect = toolbar.getBoundingClientRect();
            try {
              localStorage.setItem(storageKey, JSON.stringify({ left: rect.left, top: rect.top }));
            } catch (_) {
            }
          }
          handle.addEventListener("pointerup", endDrag);
          handle.addEventListener("pointercancel", endDrag);
        });
      }
      function injectToolbar() {
        if (document.getElementById("__listify_toolbar__")) return;
        const toolbar = document.createElement("div");
        toolbar.id = "__listify_toolbar__";
        const onAdd = /\/catalogs\/single\/add/.test(window.location.href);
        console.log(
          `[LISTIFY TOOLBAR] Injecting toolbar. URL: "${window.location.href}" onAdd=${onAdd}`
        );
        applyStyles(toolbar, {
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          "z-index": "2147483647",
          display: onAdd ? "flex" : "none",
          gap: "6px",
          "align-items": "center",
          padding: "6px 4px",
          background: "#fff",
          "border-radius": "14px",
          border: "1px solid #e5e7eb",
          "box-shadow": "0 10px 30px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
          "backdrop-filter": "saturate(180%) blur(8px)"
        });
        const leftHandle = makeDragHandle("left");
        const rightHandle = makeDragHandle("right");
        toolbar.appendChild(leftHandle);
        toolbar.appendChild(autofillBtn);
        toolbar.appendChild(fab);
        toolbar.appendChild(rightHandle);
        document.body.appendChild(toolbar);
        makeDraggable(toolbar, [leftHandle, rightHandle], "__listify_toolbar_pos__");
        console.log(
          `[LISTIFY TOOLBAR] Injected. display=${toolbar.style.display}`
        );
      }
      injectToolbar();
      injectAiDescButton();
      injectAiTitleButton();
      checkAutoOpenMeeshoSidebar();
      const _toolbarObserver = new MutationObserver(() => {
        checkAutoOpenMeeshoSidebar();
        if (!document.getElementById("__listify_toolbar__")) injectToolbar();
        if (!document.getElementById("__listify_ai_desc_btn__"))
          injectAiDescButton();
        if (!document.getElementById("__listify_ai_title_btn__"))
          injectAiTitleButton();
      });
      _toolbarObserver.observe(document.body, { childList: true, subtree: true });
    })();
  })();
})();
