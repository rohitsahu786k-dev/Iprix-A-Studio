// config.js is loaded via <script> tag in popup.html before this file

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // ── Tab switcher ──
  const tabTemplatesBtn = document.getElementById("tabTemplates");
  const tabStudioToolsBtn = document.getElementById("tabStudioTools");
  const tabBulkBtn = document.getElementById("tabBulk");
  const tabSmartListingBtn = document.getElementById("tabSmartListing");
  const tabTemplatesContent = document.getElementById("tabTemplatesContent");
  const tabStudioToolsContent = document.getElementById("tabStudioToolsContent");
  const tabBulkContent = document.getElementById("tabBulkContent");
  const tabFlipkartContent = document.getElementById("tabFlipkartContent");
  const tabSmartListingContent = document.getElementById("tabSmartListingContent");
  const tabImageMakerBtn = document.getElementById("tabImageMaker");
  const tabImageMakerContent = document.getElementById("tabImageMakerContent");

  // ── Platform state ──
  const platformSelect = document.getElementById("platformSelect");
  const platformMismatch = document.getElementById("platformMismatch");
  const platformMismatchText = document.getElementById("platformMismatchText");

  // Detected platform from the active tab's hostname. "" if neither.
  let _detectedPlatform = "";
  // User's currently selected platform in the dropdown.
  let _selectedPlatform = "meesho";

  function detectPlatformFromUrl(url) {
    if (!url) return "";
    if (url.includes("seller.flipkart.com")) return "flipkart";
    if (url.includes("meesho.com") || url.includes("supplier.meesho.com")) return "meesho";
    return "";
  }

  function updateMismatchWarning() {
    if (!_detectedPlatform || _detectedPlatform === _selectedPlatform) {
      platformMismatch.style.display = "none";
      return;
    }
    const detectedLabel = _detectedPlatform.charAt(0).toUpperCase() + _detectedPlatform.slice(1);
    const selectedLabel = _selectedPlatform.charAt(0).toUpperCase() + _selectedPlatform.slice(1);
    platformMismatchText.textContent = `You're on ${detectedLabel} but viewing ${selectedLabel} templates. Switch the dropdown to ${detectedLabel} to use this tab.`;
    platformMismatch.style.display = "block";
  }

  function applyPlatformView() {
    // Only affects the Templates tab — show the right platform's content.
    const onTemplates = tabTemplatesBtn.classList.contains("tab-active");
    if (!onTemplates) return;
    if (_selectedPlatform === "flipkart") {
      tabTemplatesContent.style.display = "none";
      tabFlipkartContent.style.display = "block";
      if (typeof window.fkInit === "function") window.fkInit();
    } else {
      tabTemplatesContent.style.display = "block";
      tabFlipkartContent.style.display = "none";
    }
  }

  function hideAllTabs() {
    tabTemplatesBtn.classList.remove("tab-active");
    tabStudioToolsBtn.classList.remove("tab-active");
    tabBulkBtn.classList.remove("tab-active");
    tabSmartListingBtn.classList.remove("tab-active");
    tabImageMakerBtn.classList.remove("tab-active");
    tabTemplatesContent.style.display = "none";
    tabStudioToolsContent.style.display = "none";
    tabBulkContent.style.display = "none";
    tabFlipkartContent.style.display = "none";
    tabSmartListingContent.style.display = "none";
    tabImageMakerContent.style.display = "none";
  }

  tabTemplatesBtn.addEventListener("click", () => {
    hideAllTabs();
    tabTemplatesBtn.classList.add("tab-active");
    applyPlatformView();
  });

  tabStudioToolsBtn.addEventListener("click", () => {
    hideAllTabs();
    tabStudioToolsBtn.classList.add("tab-active");
    tabStudioToolsContent.style.display = "block";
  });

  tabBulkBtn.addEventListener("click", () => {
    hideAllTabs();
    tabBulkBtn.classList.add("tab-active");
    tabBulkContent.style.display = "block";
    bfRefreshActivePanel();
    bfLoadTemplates();
  });

  tabSmartListingBtn.addEventListener("click", () => {
    hideAllTabs();
    tabSmartListingBtn.classList.add("tab-active");
    tabSmartListingContent.style.display = "block";
    loadSmartListings();
  });

  // Platform dropdown change
  platformSelect.addEventListener("change", () => {
    _selectedPlatform = platformSelect.value;
    updateMismatchWarning();
    applyPlatformView();
  });

  // Auto-detect platform from active tab
  (async () => {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      _detectedPlatform = detectPlatformFromUrl(activeTab?.url || "");
      if (_detectedPlatform) {
        _selectedPlatform = _detectedPlatform;
        platformSelect.value = _detectedPlatform;
        platformSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
      updateMismatchWarning();
      applyPlatformView();
    } catch (_) {
      applyPlatformView();
    }
  })();

  // ── Bulk Fill Tab Logic ──
  // Studio Tools tab
  const studioAuditBtn = document.getElementById("studioAuditBtn");
  const studioDraftBtn = document.getElementById("studioDraftBtn");
  const studioScoreCard = document.getElementById("studioScoreCard");
  const studioScoreLabel = document.getElementById("studioScoreLabel");
  const studioPlatformPill = document.getElementById("studioPlatformPill");
  const studioScoreSummary = document.getElementById("studioScoreSummary");
  const studioFieldCount = document.getElementById("studioFieldCount");
  const studioFieldList = document.getElementById("studioFieldList");
  const studioStatusEl = document.getElementById("studioStatus");
  const studioSkuBtn = document.getElementById("studioSkuBtn");
  const studioSkuOutput = document.getElementById("studioSkuOutput");
  const studioSkuBrand = document.getElementById("studioSkuBrand");
  const studioSkuCategory = document.getElementById("studioSkuCategory");
  const studioSkuColor = document.getElementById("studioSkuColor");
  const studioSkuSize = document.getElementById("studioSkuSize");

  function studioStatus(msg, color) {
    studioStatusEl.textContent = msg || "";
    studioStatusEl.style.color = color || "var(--muted)";
  }

  function localSkuPart(value, fallback) {
    const cleaned = String(value || fallback)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 18);
    return cleaned || fallback;
  }

  function localGenerateSku(parts) {
    return [
      localSkuPart(parts.brand, "IPRIX"),
      localSkuPart(parts.category, "ITEM"),
      localSkuPart(parts.color, "STD"),
      localSkuPart(parts.size, "OS"),
      String(Date.now()).slice(-4),
    ].join("-");
  }

  async function getActiveMarketplaceTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("edge://")) {
      throw new Error("Open a marketplace listing page first.");
    }
    return tab;
  }

  function renderStudioAudit(data) {
    const audit = data?.audit || {};
    const fields = Array.isArray(audit.fields) ? audit.fields : [];
    const checks = Array.isArray(audit.checks) ? audit.checks : [];
    studioScoreCard.style.display = "block";
    studioScoreLabel.textContent = `${audit.score ?? 0}/100`;
    studioPlatformPill.textContent = audit.platform || "Unknown";
    studioScoreSummary.textContent =
      checks.length > 0
        ? checks.map((c) => `${c.ok ? "OK" : "Fix"}: ${c.label}`).join(" | ")
        : "Scan completed. Fill more fields to improve the score.";
    studioFieldCount.textContent = `${fields.length} field${fields.length === 1 ? "" : "s"}`;
    studioFieldList.innerHTML = "";
    fields.slice(0, 60).forEach((field) => {
      const row = document.createElement("div");
      row.style.cssText =
        "display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:7px 8px;border:1px solid var(--border);border-radius:7px;background:var(--surface2);";
      const label = document.createElement("div");
      label.style.cssText = "min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);font-weight:600;";
      label.textContent = field.label || field.placeholder || field.name || field.selector || "Unlabelled field";
      const meta = document.createElement("div");
      meta.style.cssText = "font-size:10px;color:var(--muted);font-weight:700;";
      meta.textContent = `${field.type || "field"} | ${field.confidence || 0}%`;
      row.appendChild(label);
      row.appendChild(meta);
      studioFieldList.appendChild(row);
    });
  }

  async function runStudioAudit() {
    studioStatus("Scanning active page...");
    studioAuditBtn.disabled = true;
    try {
      const tab = await getActiveMarketplaceTab();
      const res = await chrome.tabs.sendMessage(tab.id, { action: "studio_field_audit" });
      if (!res?.success) throw new Error(res?.error || "Scan failed.");
      renderStudioAudit(res.data);
      const inferred = res.data?.audit?.inferred || {};
      if (inferred.brand && !studioSkuBrand.value) studioSkuBrand.value = inferred.brand;
      if (inferred.category && !studioSkuCategory.value) studioSkuCategory.value = inferred.category;
      if (inferred.color && !studioSkuColor.value) studioSkuColor.value = inferred.color;
      if (inferred.size && !studioSkuSize.value) studioSkuSize.value = inferred.size;
      studioStatus("Audit ready.", "var(--green)");
    } catch (err) {
      studioStatus(err.message || "Unable to scan page.", "var(--red)");
    } finally {
      studioAuditBtn.disabled = false;
    }
  }

  studioAuditBtn.addEventListener("click", runStudioAudit);

  studioDraftBtn.addEventListener("click", async () => {
    studioStatus("Saving local draft...");
    studioDraftBtn.disabled = true;
    try {
      const tab = await getActiveMarketplaceTab();
      const res = await chrome.tabs.sendMessage(tab.id, { action: "studio_save_local_draft" });
      if (!res?.success) throw new Error(res?.error || "Draft save failed.");
      studioStatus(`Draft saved with ${res.count || 0} field(s).`, "var(--green)");
    } catch (err) {
      studioStatus(err.message || "Unable to save draft.", "var(--red)");
    } finally {
      studioDraftBtn.disabled = false;
    }
  });

  studioSkuBtn.addEventListener("click", async () => {
    const payload = {
      brand: studioSkuBrand.value,
      category: studioSkuCategory.value,
      color: studioSkuColor.value,
      size: studioSkuSize.value,
    };
    let sku = localGenerateSku(payload);
    try {
      const response = await fetch(`${BASE_URL}/api/ai/sku`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.sku) sku = data.sku;
      }
    } catch (_) {}
    studioSkuOutput.textContent = sku;
    studioSkuOutput.style.display = "block";
    try {
      await navigator.clipboard.writeText(sku);
      studioStatus("SKU generated and copied.", "var(--green)");
    } catch (_) {
      studioStatus("SKU generated.", "var(--green)");
    }
  });

  const bfActivePanel = document.getElementById("bfActivePanel");
  const bfSetupPanel = document.getElementById("bfSetupPanel");
  const bfCurRow = document.getElementById("bfCurRow");
  const bfTotRows = document.getElementById("bfTotRows");
  const bfProgressBar = document.getElementById("bfProgressBar");
  const bfActiveStatus = document.getElementById("bfActiveStatus");
  const bfFillNextBtn = document.getElementById("bfFillNextBtn");
  const bfStopBtn = document.getElementById("bfStopBtn");
  const bfTemplateSelect = document.getElementById("bfTemplateSelect");
  const bfFormCountRow = document.getElementById("bfFormCountRow");
  const bfFormCountInput = document.getElementById("bfFormCountInput");
  const bfDownloadRow = document.getElementById("bfDownloadRow");
  const bfDownloadBtn = document.getElementById("bfDownloadBtn");
  const bfUploadRow = document.getElementById("bfUploadRow");
  const bfUploadBtn = document.getElementById("bfUploadBtn");
  const bfFileInput = document.getElementById("bfFileInput");
  const bfRowsInfo = document.getElementById("bfRowsInfo");
  const bfStartRow = document.getElementById("bfStartRow");
  const bfSummary = document.getElementById("bfSummary");
  const bfStartBtn = document.getElementById("bfStartBtn");
  const bfStatusEl = document.getElementById("bfStatus");

  let bfAllTemplates = [];
  let bfExcelRows = [];
  let bfSelectedTemplate = null;

  function bfStatus(msg, color) {
    bfStatusEl.textContent = msg;
    bfStatusEl.style.color = color || "var(--muted)";
  }

  // Check if a queue is already active and show/hide panels accordingly
  function bfRefreshActivePanel() {
    chrome.storage.local.get(
      ["listify_bulk_active", "listify_bulk_index", "listify_bulk_total"],
      (r) => {
        if (!r.listify_bulk_active) {
          bfActivePanel.style.display = "none";
          bfSetupPanel.style.display = "block";
          return;
        }
        bfActivePanel.style.display = "block";
        bfSetupPanel.style.display = "none";
        const idx = r.listify_bulk_index || 0;
        const total = r.listify_bulk_total || "?";
        bfCurRow.textContent = idx;
        bfTotRows.textContent = total;
        const pct = total !== "?" ? Math.round((idx / total) * 100) : 0;
        bfProgressBar.style.width = pct + "%";
        if (bfActiveStatus) {
           bfActiveStatus.textContent = idx >= total ? "All done!" : `Ready for row ${idx + 1}`;
        }
      },
    );
  }

  // Auto-refresh when storage changes (so progress updates live during parallel fill)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local") {
      if (changes.listify_bulk_index || changes.listify_bulk_active || changes.listify_bulk_total) {
        bfRefreshActivePanel();
      }
      if (changes.listify_bulk_active && !changes.listify_bulk_active.newValue) {
        // Bulk queue finished or was stopped, fetch fresh usage stats
        loadTemplates();
      }
    }
  });

  // Load templates into the Bulk Fill dropdown
  async function bfLoadTemplates() {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}?limit=50`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      bfAllTemplates = Array.isArray(data) ? data : data.templates || [];
      bfTemplateSelect.innerHTML =
        '<option value="">— Choose a template —</option>';
      bfAllTemplates.forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t._id;
        opt.textContent =
          t.name +
          (t.category ? ` — ${t.category}` : "") +
          ` (${Array.isArray(t.fields) ? t.fields.length : 0} fields)`;
        bfTemplateSelect.appendChild(opt);
      });
    } catch (_) {
      bfStatus("Failed to load templates", "red");
    }
  }

  // When template selected — show form count input + download step
  bfTemplateSelect.addEventListener("change", () => {
    const id = bfTemplateSelect.value;
    bfSelectedTemplate = bfAllTemplates.find((t) => t._id === id) || null;
    bfFormCountRow.style.display = bfSelectedTemplate ? "block" : "none";
    bfDownloadRow.style.display = bfSelectedTemplate ? "block" : "none";
    bfUploadRow.style.display = bfSelectedTemplate ? "block" : "none";
    bfStartRow.style.display = "none";
    bfRowsInfo.style.display = "none";
    bfExcelRows = [];
    bfFormCountInput.value = "";
  });

  // Download Excel — N rows pre-filled with template data, one column per field
  bfDownloadBtn.addEventListener("click", () => {
    if (!bfSelectedTemplate || !window.XLSX) return;
    const n = parseInt(bfFormCountInput.value);
    if (!n || n < 1) {
      bfStatus("Enter number of forms first.", "var(--red)");
      return;
    }
    const allFields = bfSelectedTemplate.fields || [];
    // Build a row pre-filled with template values for every text-like field
    const makeRow = () => {
      const row = {};
      allFields.forEach((f, i) => {
        if (
          ["checkbox", "radio", "file", "submit", "button", "hidden"].includes(
            f.type || "",
          )
        )
          return;
        const lbl = f.label || f.placeholder || f.name || `Field ${i + 1}`;
        row[lbl] =
          typeof f.value === "boolean" ? String(f.value) : (f.value ?? "");
      });
      return row;
    };
    const rows = Array.from({ length: n }, makeRow);
    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Listings");
    XLSX.writeFile(
      wb,
      `lisstify_bulk_${bfSelectedTemplate.name.replace(/\s+/g, "_")}.xlsx`,
    );
    bfStatus(
      `Downloaded ${n} pre-filled rows — edit & upload to start.`,
      "var(--green)",
    );
  });

  // Upload Excel
  bfUploadBtn.addEventListener("click", () => bfFileInput.click());

  bfFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !bfSelectedTemplate) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        if (rows.length === 0) {
          bfStatus("Excel file is empty", "red");
          return;
        }
        bfExcelRows = rows;
        bfRowsInfo.textContent = `✓ ${rows.length} row${rows.length > 1 ? "s" : ""} found`;
        bfRowsInfo.style.display = "block";
        bfStartRow.style.display = "block";
        bfUpdateSummary();
        bfStatus("");
      } catch (_) {
        bfStatus("Failed to read Excel file", "red");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  });

  // Update summary card
  function bfUpdateSummary() {
    const n = bfExcelRows.length;
    bfSummary.innerHTML = `Will fill <strong style="color:var(--accent);">${n}</strong> form${n !== 1 ? "s" : ""} automatically`;
    bfStartBtn.textContent = `⚡ Start Bulk Fill — ${n} forms`;
  }

  // Merge Excel row with template fields — preserves full field metadata, overrides values from Excel
  function bfMergeRow(excelRow, tmpl) {
    return (tmpl.fields || []).map((f, i) => {
      const copy = Object.assign({}, f);
      const lbl = (f.label || f.placeholder || f.name || `Field ${i + 1}`)
        .toLowerCase()
        .replace(/\s+/g, "_");
      for (const key in excelRow) {
        const nk = key.toLowerCase().replace(/\s+/g, "_");
        if (nk === lbl || lbl.includes(nk) || nk.includes(lbl)) {
          const val = excelRow[key];
          if (val !== undefined && val !== null && val !== "") {
            copy.value = String(val);
          }
          break;
        }
      }
      return copy;
    });
  }

  // Start Bulk Fill — save queue to chrome.storage
  bfStartBtn.addEventListener("click", async () => {
    if (!bfSelectedTemplate || bfExcelRows.length === 0) return;

    // Get current tab first — needed for both URL and category reads
    const tabs = await new Promise((resolve) =>
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, resolve),
    );
    const currentTab = tabs[0] || null;
    const tabId = currentTab?.id;

    // Read full category breadcrumb saved on the current tab
    let categoryFull = "";
    if (tabId) {
      const catRes = await chrome.tabs
        .sendMessage(tabId, { action: "get_category_full" })
        .catch(() => null);
      categoryFull = catRes?.categoryFull || "";
    }

    const rowsToFill = bfExcelRows.map((r, i) => ({
      _rowIndex: i + 1,
      fields: bfMergeRow(r, bfSelectedTemplate),
      category: bfSelectedTemplate.category || "",
      categoryFull: categoryFull,
      imageUrl: r["image_url"] || r["imageUrl"] || r["Image URL"] || "",
    }));

    // Ask the content script for the exact URL — avoids chrome.tabs.query
    // returning the popup window's own URL when focus is on the popup.

    let templateFullUrl = "";
    if (tabId) {
      const urlRes = await chrome.tabs
        .sendMessage(tabId, { action: "get_current_url" })
        .catch(() => null);
      templateFullUrl = urlRes?.url || currentTab?.url || "";
    }

    // Normalize Flipkart URL: /single?requestId=... → /add
    // so each new bulk tab opens a fresh listing form
    if (templateFullUrl.includes("seller.flipkart.com")) {
      const hashIdx = templateFullUrl.indexOf("#");
      if (hashIdx !== -1) {
        const base = templateFullUrl.substring(0, hashIdx);
        const hash = templateFullUrl.substring(hashIdx + 1);
        templateFullUrl =
          base +
          "#" +
          hash.replace(/addListings\/single.*$/, "addListings/add");
      }
    }

    await new Promise((resolve) =>
      chrome.storage.local.set(
        {
          listify_bulk_active: true,
          listify_bulk_queue: rowsToFill,
          listify_bulk_index: 0,
          listify_bulk_total: rowsToFill.length,
          listify_bulk_template_id: bfSelectedTemplate._id,
          listify_bulk_template_url: templateFullUrl,
        },
        resolve,
      ),
    );

    bfStatus("");
    bfExcelRows = [];
    bfTemplateSelect.value = "";
    bfSelectedTemplate = null;
    bfFormCountInput.value = "";
    bfFormCountRow.style.display = "none";
    bfDownloadRow.style.display = "none";
    bfUploadRow.style.display = "none";
    bfStartRow.style.display = "none";
    bfRowsInfo.style.display = "none";
    bfRefreshActivePanel();

    // Tell background.js to start: fill current tab first, then open new tabs for remaining rows
    chrome.runtime.sendMessage(
      { action: "bulk_start_new_tab", firstTabId: currentTab?.id || null },
      (res) => {
        if (chrome.runtime.lastError || res?.ok === false) {
          bfStatus(
            "Failed to start: " +
              (res?.error || chrome.runtime.lastError?.message || "unknown"),
            "var(--red)",
          );
          return;
        }
        if (bfActiveStatus)
          bfActiveStatus.textContent = "Opening form in new tab for row 1…";
      },
    );
  });

  // Fill next row button (in active panel)
  bfFillNextBtn.addEventListener("click", async () => {
    bfFillNextBtn.disabled = true;
    bfActiveStatus.textContent = "Filling…";
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab || !tab.id) {
      bfFillNextBtn.disabled = false;
      return;
    }
    chrome.tabs.sendMessage(tab.id, { action: "bulk_fill_next" }, (res) => {
      if (res?.ok) {
        bfActiveStatus.textContent = "Filled! Save the form, then click again.";
        // Record usage dynamically
        _fillsUsed++;
        const templateId = bfSelectedTemplate?._id || null;
        if (templateId) {
          fetch(`${API_URL}/${templateId}/use`, {
            method: "POST",
            headers: authHeaders(),
          }).catch(() => {});
        } else {
          chrome.storage.local.get(["listify_bulk_template_id"], (r) => {
            if (r.listify_bulk_template_id) {
              fetch(`${API_URL}/${r.listify_bulk_template_id}/use`, {
                method: "POST",
                headers: authHeaders(),
              }).catch(() => {});
            }
          });
        }
        chrome.runtime.sendMessage({ action: "refresh_dashboard_stats" });
      } else {
        if (res?.error === "Queue complete") {
          bfActiveStatus.textContent = "All listings done!";
          chrome.runtime.sendMessage({ action: "refresh_dashboard_stats" });
        } else {
          bfActiveStatus.textContent = "Error: " + (res?.error || "unknown");
        }
      }
      bfFillNextBtn.disabled = false;
      setTimeout(bfRefreshActivePanel, 600);
    });
  });

  // Stop bulk fill — signal background to abort, close duplicate tabs, and clear queue
  bfStopBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "bulk_fill_stop" }, () => {
      bfRefreshActivePanel();
    });
  });

  // ── Smart Listing tab (incremental per-product flow) ──
  const slSelect        = document.getElementById("slSelect");
  const slTitleRow      = document.getElementById("slTitleRow");
  const slTitleSelect   = document.getElementById("slTitleSelect");
  const slFillBtn       = document.getElementById("slFillBtn");
  const slStatusEl      = document.getElementById("slStatus");
  const slProgressWrap  = document.getElementById("slProgressWrap");
  const slProgressLabel = document.getElementById("slProgressLabel");
  const slProgressCount = document.getElementById("slProgressCount");
  const slProgressBar   = document.getElementById("slProgressBar");
  const slResetRow      = document.getElementById("slResetRow");
  const slResetBtn      = document.getElementById("slResetBtn");
  const slEmptyState    = document.getElementById("slEmptyState");

  let _smartListings = [];
  let _slLoaded = false;
  let _slIndices = {};            // { [slId]: nextIndex } — in-memory only, resets on popup close
  let _slManualIndex = null;      // user picked a specific product from optional dropdown
  let _slFilling = false;         // true while fill_form is in flight
  let _slFillGen = 0;             // incremented on stop/new fill to invalidate stale callbacks

  function slMsg(msg, color) {
    if (!slStatusEl) return;
    slStatusEl.textContent = msg || "";
    slStatusEl.style.color = color || "var(--muted)";
  }

  function getNextIndex(slId) {
    return _slIndices[slId] || 0;
  }
  function setNextIndex(slId, n) {
    _slIndices[slId] = n;
  }

  // Total products for a smart listing
  function getProductCount(sl) {
    // listingCount is the authoritative "how many products to fill" — always prefer it.
    // titles.length is only a fallback for older listings that predate listingCount.
    const lc = Number(sl.listingCount) || 0;
    if (lc > 0) return lc;
    const titles = Array.isArray(sl.titles) ? sl.titles.filter(Boolean) : [];
    if (titles.length > 0) return titles.length;
    return 1;
  }

  // The index that will be filled when the user clicks the button.
  // Manual pick (from optional dropdown) wins; otherwise the persisted "next" pointer.
  function getActiveIndex(sl) {
    if (_slManualIndex != null) return _slManualIndex;
    return getNextIndex(sl._id);
  }

  // Re-render the button + progress + reset link based on state
  function renderSlState() {
    const id = slSelect.value;
    const sl = _smartListings.find((s) => s._id === id);

    if (!sl) {
      slFillBtn.disabled = true;
      slFillBtn.style.opacity = "0.5";
      slFillBtn.textContent = "Fill Product 1";
      slProgressWrap.style.display = "none";
      slResetRow.style.display = "none";
      return;
    }

    const total = getProductCount(sl);
    const next  = getNextIndex(sl._id);
    const active = getActiveIndex(sl);
    const allDone = next >= total;

    // Progress bar
    slProgressWrap.style.display = "block";
    slProgressLabel.textContent = allDone && _slManualIndex == null
      ? `All ${total} products filled`
      : `Product ${Math.min(active + 1, total)} of ${total}`;
    slProgressCount.textContent = `${Math.min(next, total)} / ${total} filled`;
    slProgressBar.style.width = `${Math.round((Math.min(next, total) / total) * 100)}%`;

    // Reset link — show whenever next > 0
    slResetRow.style.display = next > 0 ? "block" : "none";

    // Button state
    if (allDone && _slManualIndex == null) {
      slFillBtn.disabled = true;
      slFillBtn.style.opacity = "0.5";
      slFillBtn.style.cursor = "not-allowed";
      slFillBtn.textContent = "All products filled — reset to start over";
    } else {
      slFillBtn.disabled = false;
      slFillBtn.style.opacity = "1";
      slFillBtn.style.cursor = "pointer";
      slFillBtn.textContent = `⚡ Fill Product ${active + 1}`;
    }
  }

  async function loadSmartListings() {
    if (!authToken || _slLoaded) return;
    try {
      const res = await fetch(`${SL_API_URL}?platform=meesho&limit=50`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      _smartListings = Array.isArray(data) ? data : data.listings || [];
      _slLoaded = true;

      slSelect.innerHTML = '<option value="">— Choose a smart listing —</option>';

      if (_smartListings.length === 0) {
        slEmptyState.style.display = "block";
        slSelect.parentElement.style.display = "none";
        return;
      }

      _smartListings.forEach((sl) => {
        const opt = document.createElement("option");
        opt.value = sl._id;
        const label =
          sl.title ||
          (Array.isArray(sl.titles) && sl.titles[0]) ||
          sl.product?.name ||
          "(Untitled)";
        opt.textContent = label.length > 50 ? label.substring(0, 50) + "…" : label;
        slSelect.appendChild(opt);
      });
    } catch (_) {}
  }

  // Smart listing picked — populate the optional title dropdown
  slSelect.addEventListener("change", () => {
    const id = slSelect.value;
    const sl = _smartListings.find((s) => s._id === id) || null;
    _slManualIndex = null;
    slMsg("");

    if (!sl) {
      slTitleRow.style.display = "none";
      renderSlState();
      return;
    }

    const titles = Array.isArray(sl.titles) ? sl.titles.filter(Boolean) : [];
    const fallback = sl.title || sl.product?.name || "";
    const allTitles = titles.length > 0 ? titles : (fallback ? [fallback] : []);
    const total = getProductCount(sl);

    slTitleSelect.innerHTML = "";
    const autoOpt = document.createElement("option");
    autoOpt.value = "";
    autoOpt.textContent = `Auto — fill next in sequence`;
    slTitleSelect.appendChild(autoOpt);

    for (let i = 0; i < total; i++) {
      const t = allTitles[i] || `Product ${i + 1}`;
      const preview = t.length > 55 ? t.substring(0, 55) + "…" : t;
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = `Product ${i + 1}: ${preview}`;
      slTitleSelect.appendChild(opt);
    }

    slTitleRow.style.display = total > 1 ? "block" : "none";
    slTitleSelect.value = "";
    renderSlState();
  });

  // Optional title picker — overrides the auto-pointer for the next fill
  slTitleSelect.addEventListener("change", () => {
    const v = slTitleSelect.value;
    _slManualIndex = v === "" ? null : parseInt(v);
    renderSlState();
  });

  // Reset the per-SL "next" pointer to 0
  slResetBtn.addEventListener("click", () => {
    const id = slSelect.value;
    if (!id) return;
    setNextIndex(id, 0);
    _slManualIndex = null;
    slTitleSelect.value = "";
    slMsg("Reset — starting from Product 1", "var(--muted)");
    renderSlState();
  });

  // ── Fill button: build per-product fill data and dispatch ──
  // While filling, the button doubles as a Stop button.
  slFillBtn.addEventListener("click", async () => {
    // ── Stop ──
    if (_slFilling) {
      _slFillGen++;
      _slFilling = false;
      slMsg("Fill stopped.", "var(--muted)");
      slFillBtn.style.background = "var(--accent)";
      renderSlState();
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) chrome.tabs.sendMessage(tab.id, { action: "abort_fill" }).catch(() => {});
      });
      return;
    }

    const id = slSelect.value;
    if (!id) return;

    const productIdx = _slManualIndex != null
      ? _slManualIndex
      : getNextIndex(id);

    // ── Enter fill mode: button becomes Stop ──
    _slFilling = true;
    _slFillGen++;
    const myGen = _slFillGen;

    slFillBtn.disabled = false;
    slFillBtn.textContent = "⏹ Stop";
    slFillBtn.style.opacity = "1";
    slFillBtn.style.cursor = "pointer";
    slFillBtn.style.background = "#dc2626";
    slMsg("");

    const isAborted = () => myGen !== _slFillGen;
    const exitFill = () => {
      if (isAborted()) return;
      _slFilling = false;
      slFillBtn.style.background = "var(--accent)";
      renderSlState();
    };

    try {
      // Fetch full smart listing with template.fields populated
      const res = await fetch(`${SL_API_URL}/${id}`, { headers: authHeaders() });
      if (isAborted()) return;
      if (!res.ok) throw new Error("Failed to fetch smart listing");
      const sl = await res.json();
      if (isAborted()) return;

      // Sync the list-cache entry with the full fetch so renderSlState and the
      // title dropdown show the correct data (list endpoint may have stale titles).
      const _cacheIdx = _smartListings.findIndex(s => s._id === sl._id);
      if (_cacheIdx !== -1) {
        _smartListings[_cacheIdx] = Object.assign({}, _smartListings[_cacheIdx], {
          titles: sl.titles,
          listingCount: sl.listingCount,
        });
        // If this SL is still selected, refresh the title dropdown with full titles.
        if (slSelect.value === sl._id) {
          const fullTitles = Array.isArray(sl.titles) ? sl.titles.filter(Boolean) : [];
          const fullTotal = getProductCount(_smartListings[_cacheIdx]);
          const prevVal = slTitleSelect.value;
          slTitleSelect.innerHTML = "";
          const autoOpt = document.createElement("option");
          autoOpt.value = "";
          autoOpt.textContent = "Auto — fill next in sequence";
          slTitleSelect.appendChild(autoOpt);
          for (let i = 0; i < fullTotal; i++) {
            const t = fullTitles[i] || `Product ${i + 1}`;
            const preview = t.length > 55 ? t.substring(0, 55) + "…" : t;
            const opt = document.createElement("option");
            opt.value = String(i);
            opt.textContent = `Product ${i + 1}: ${preview}`;
            slTitleSelect.appendChild(opt);
          }
          slTitleRow.style.display = fullTotal > 1 ? "block" : "none";
          slTitleSelect.value = prevVal;
        }
      }

      const template = sl.template;
      if (!template || !Array.isArray(template.fields) || template.fields.length === 0) {
        slMsg("No template linked — link a template to this smart listing first.", "var(--red)");
        exitFill();
        return;
      }

      // Per-product data ─────────────────────────────
      const titles = Array.isArray(sl.titles) ? sl.titles.filter(Boolean) : [];
      const fallbackTitle = sl.title || sl.product?.name || "";
      const allTitles = titles.length > 0 ? titles : (fallbackTitle ? [fallbackTitle] : []);
      const selectedTitle = allTitles[productIdx] || allTitles[0] || "";

      const slDesc =
        sl.description ||
        (Array.isArray(sl.product?.keywords) ? sl.product.keywords.join(", ") : "") ||
        "";

      // Pricing — compute fresh from min/max stored in DB.
      // Fixed mode: mrpMax === mrpMin (same value) → return exact.
      // Range mode: mrpMax > mrpMin → pick random within range.
      function pickPrice(min, max) {
        const lo = Number(min) || 0;
        const hi = Number(max) || 0;
        if (!lo) return null;
        if (!hi || hi <= lo) return lo;
        return Math.round(lo + Math.random() * (hi - lo));
      }
      const slMrp  = pickPrice(sl.mrpMin,  sl.mrpMax);
      const slSell = pickPrice(sl.sellMin, sl.sellMax);
      const slCost = pickPrice(sl.costMin, sl.costMax);
      const slDefective = (sl.defectivePrice > 0 ? sl.defectivePrice : null)
        || (slSell ? Math.max(0, slSell - 20) : null);

      // Merge fields — match against label/placeholder/name/id combined so we
      // catch fields like Meesho's <input id="meesho_price"> even when its label
      // is generic ("Price") or missing.
      const mergedFields = template.fields.map((field) => {
        const raw = [field.label, field.placeholder, field.name, field.id]
          .filter(Boolean).join(" ").toLowerCase();
        const copy = Object.assign({}, field);

        if (/\btitle\b|product[\s_-]?name/i.test(raw)) {
          if (selectedTitle) copy.value = selectedTitle;
        } else if (/\bdescription\b|\babout.?product\b/i.test(raw)) {
          if (slDesc) copy.value = slDesc;
        } else if (/\bbrand\b/i.test(raw)) {
          if (sl.product?.brand) copy.value = sl.product.brand;
        } else if (/\bm\.?r\.?p\b|maximum.?retail.?price/i.test(raw)) {
          if (slMrp != null) copy.value = String(slMrp);
        } else if (/\bsell(ing)?.?price\b|your.?price\b|sale.?price\b|meesho[\s_-]?price\b/i.test(raw)) {
          if (slSell != null) copy.value = String(slSell);
        } else if (/\bcost.?price\b/i.test(raw)) {
          if (slCost != null) copy.value = String(slCost);
        } else if (/\bdefective\b/i.test(raw)) {
          if (slDefective != null) copy.value = String(slDefective);
        }

        return copy;
      });

      // Per-product images: take index N from each category (front[N], side[N], etc.)
      const allImageUrls = [];
      if (sl.files && typeof sl.files === "object") {
        ["front", "side", "feature", "last"].forEach((cat) => {
          const imgs = sl.files[cat];
          if (Array.isArray(imgs) && imgs.length > 0) {
            const img = imgs[productIdx] || imgs[0]; // fall back to first if no per-product image
            if (img && img.url) {
              const url = img.url.startsWith("/") ? `${BASE_URL}${img.url}` : img.url;
              allImageUrls.push(url);
            }
          }
        });
      }

      const fillData = Object.assign({}, template, { fields: mergedFields });

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (isAborted()) return;
      if (!tab || !tab.url || isRestrictedUrl(tab.url)) {
        slMsg("Cannot fill on this page.", "var(--red)");
        exitFill();
        return;
      }
      await ensureContentScript(tab.id);
      if (isAborted()) return;

      // Category mismatch check — same guard as regular template fill.
      // Must run before fill_form so images are never uploaded on wrong category.
      if (template.category) {
        try {
          let currentCat = "";
          const domRes = await new Promise((resolve) =>
            chrome.tabs.sendMessage(tab.id, { action: "get_tab_category_dom" }, resolve)
          );
          currentCat = (domRes?.category || "").trim();

          if (!currentCat) {
            const storRes = await new Promise((resolve) =>
              chrome.tabs.sendMessage(tab.id, { action: "get_tab_category" }, resolve)
            );
            currentCat = (storRes?.category || "").trim();
          }

          const templateCat = template.category.trim();
          if (currentCat && currentCat.toLowerCase() !== templateCat.toLowerCase()) {
            chrome.tabs.sendMessage(tab.id, {
              action: "show_toast",
              message: `No template saved for "${currentCat}"`,
              toastType: "warning",
            }).catch(() => {});
            slMsg(`⚠ Wrong category — template is for "${templateCat}"`, "#a07000");
            exitFill();
            return;
          }
        } catch (_) {
          /* category check is best-effort */
        }
      }

      chrome.tabs.sendMessage(
        tab.id,
        { action: "fill_form", data: fillData },
        { frameId: 0 },
        (response) => {
          if (isAborted()) return; // user clicked Stop while fill was running
          exitFill();

          if (chrome.runtime.lastError) {
            slMsg("Content script error — refresh the page.", "var(--red)");
            return;
          }
          if (response?.success) {
            const filled = response.filledCount || 0;
            const missed =
              (response.notFoundCount || 0) + (response.optionNotFoundCount || 0);
            const imgNote = allImageUrls.length > 0 ? " Uploading images…" : "";
            slMsg(
              `Product ${productIdx + 1} filled — ${filled} field${filled !== 1 ? "s" : ""}${missed > 0 ? ` (${missed} not found)` : ""}.${imgNote}`,
              "var(--green)",
            );
            if (allImageUrls.length > 0) {
              chrome.tabs.sendMessage(tab.id, {
                action: "sl_upload_images",
                imageUrls: allImageUrls,
              }).catch(() => {});
            }
            if (template._id) {
              fetch(`${API_URL}/${template._id}/use`, {
                method: "POST",
                headers: authHeaders(),
              }).catch(() => {});
            }

            // Auto-advance the per-SL pointer (manual or not).
            setNextIndex(id, productIdx + 1);
            _slManualIndex = null;
            slTitleSelect.value = "";
            renderSlState();
          } else {
            slMsg("Fill failed: " + (response?.error || "unknown"), "var(--red)");
          }
        },
      );
    } catch (e) {
      if (isAborted()) return;
      slMsg("Error: " + e.message, "var(--red)");
      exitFill();
    }
  });

  // ── Image Maker tab ──
  const imDropArea          = document.getElementById("imDropArea");
  const imDropIdle          = document.getElementById("imDropIdle");
  const imDropSelected      = document.getElementById("imDropSelected");
  const imDropPreview       = document.getElementById("imDropPreview");
  const imChangeBtn         = document.getElementById("imChangeBtn");
  const imClearBtn          = document.getElementById("imClearBtn");
  const imFileInput         = document.getElementById("imFileInput");
  const imFileName          = document.getElementById("imFileName");
  const imOptions           = document.getElementById("imOptions");
  const imRemoveBg          = document.getElementById("imRemoveBg");
  const imAddBorder         = document.getElementById("imAddBorder");
  const imMultiVariation    = document.getElementById("imMultiVariation");
  const imSliderRow         = document.getElementById("imSliderRow");
  const imVariationSlider   = document.getElementById("imVariationSlider");
  const imCountLabel        = document.getElementById("imCountLabel");
  const imProBadge          = document.getElementById("imProBadge");
  const imUpgradeLink       = document.getElementById("imUpgradeLink");
  const imAddStickers       = document.getElementById("imAddStickers");
  const imCategory          = document.getElementById("imCategory");
  const imGenerateBtn       = document.getElementById("imGenerateBtn");
  const imGeneratingEl      = document.getElementById("imGenerating");
  const imSuccessEl         = document.getElementById("imSuccess");
  const imSuccessCount      = document.getElementById("imSuccessCount");
  const imLibraryLink       = document.getElementById("imLibraryLink");
  const imErrorEl           = document.getElementById("imError");
  const imErrorText         = document.getElementById("imErrorText");
  const imRefreshBtn        = document.getElementById("imRefreshBtn");
  const imHistoryLoad       = document.getElementById("imHistoryLoad");
  const imHistoryEmpty      = document.getElementById("imHistoryEmpty");
  const imHistoryGrid       = document.getElementById("imHistoryGrid");
  let _imFile = null;
  let _imPreviewUrl = null;
  let _imSuccessTimer = null;

  if (imLibraryLink) imLibraryLink.href = `${FRONTEND_URL}/dashboard/image`;
  if (imUpgradeLink) imUpgradeLink.href = `${FRONTEND_URL}/dashboard/subscription`;

  // Apply plan restrictions — called whenever tab opens or file is selected
  function imApplyPlan() {
    const isPro = _planName && _planName !== "free";
    // PRO badge + upgrade link on slider
    imProBadge.style.display    = isPro ? "none" : "inline";
    imUpgradeLink.style.display = isPro ? "none" : "inline";
    // Slider: free users locked at 5, pro users can adjust 5-50
    imVariationSlider.disabled      = !isPro;
    imVariationSlider.style.opacity = isPro ? "1" : "0.5";
    imVariationSlider.style.cursor  = isPro ? "pointer" : "not-allowed";
    if (!isPro) {
      imVariationSlider.value = "5";
      imCountLabel.textContent = "5";
    }
  }

  // Show/hide slider when Multiple Variations toggle changes
  imMultiVariation.addEventListener("change", () => {
    imSliderRow.style.display = imMultiVariation.checked ? "block" : "none";
  });

  // Update count label as slider moves
  imVariationSlider.addEventListener("input", () => {
    imCountLabel.textContent = imVariationSlider.value;
  });

  function imShowState(state, data) {
    imGeneratingEl.style.display = "none";
    imSuccessEl.style.display    = "none";
    imErrorEl.style.display      = "none";
    if (state === "generating") {
      imGeneratingEl.style.display = "block";
      imGenerateBtn.disabled       = true;
      imGenerateBtn.style.opacity  = "0.5";
    } else if (state === "done") {
      imSuccessEl.style.display    = "block";
      imSuccessCount.textContent   = data?.count ? `${data.count} images` : "Images";
      imGenerateBtn.disabled       = false;
      imGenerateBtn.style.opacity  = "1";
      clearTimeout(_imSuccessTimer);
      _imSuccessTimer = setTimeout(() => { imSuccessEl.style.display = "none"; }, 8000);
      imFetchHistory();
    } else if (state === "error") {
      imErrorEl.style.display      = "block";
      imErrorText.textContent      = data?.error || "Unknown error";
      imGenerateBtn.disabled       = !_imFile;
      imGenerateBtn.style.opacity  = _imFile ? "1" : "0.5";
    }
  }

  function imCheckStatus() {
    chrome.storage.local.get(["listify_img_status", "listify_img_count", "listify_img_error"], (r) => {
      if (r.listify_img_status === "generating") imShowState("generating");
      else if (r.listify_img_status === "done")  imShowState("done",  { count: r.listify_img_count });
      else if (r.listify_img_status === "error") imShowState("error", { error: r.listify_img_error });
    });
  }

  function imFetchHistory() {
    imHistoryLoad.style.display  = "block";
    imHistoryEmpty.style.display = "none";
    imHistoryGrid.innerHTML      = "";
    chrome.runtime.sendMessage({ action: "fetch_lisstify_generations" }, (res) => {
      imHistoryLoad.style.display = "none";
      if (chrome.runtime.lastError || !res?.ok) return;
      const gens = Array.isArray(res.data) ? res.data : (res.data?.generations || []);
      if (!gens.length) { imHistoryEmpty.style.display = "block"; return; }
      const sorted = [...gens].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      sorted.forEach((gen) => {
        const imgs = gen.generatedImages || [];
        if (!imgs.length) return;
        const card = document.createElement("div");
        card.style.cssText = "position:relative;border-radius:7px;overflow:hidden;border:1px solid var(--border);background:var(--surface2);cursor:pointer;";
        // padding-top:100% on a block element creates a reliable square regardless of img dimensions
        const square = document.createElement("div");
        square.style.cssText = "width:100%;padding-top:100%;position:relative;overflow:hidden;";
        const thumb = document.createElement("img");
        thumb.src = imgs[0];
        thumb.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;";
        thumb.onerror = () => { card.style.display = "none"; };
        square.appendChild(thumb);
        card.appendChild(square);
        if (imgs.length > 1) {
          const badge = document.createElement("div");
          badge.textContent = `+${imgs.length}`;
          badge.style.cssText = "position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;font-size:9.5px;font-weight:700;padding:1px 5px;border-radius:4px;pointer-events:none;";
          card.appendChild(badge);
        }
        card.title = gen.name || "Image";
        card.addEventListener("click", () => window.open(imgs[0], "_blank"));
        imHistoryGrid.appendChild(card);
      });
    });
  }

  imRefreshBtn.addEventListener("click", imFetchHistory);

  // Listen for background completion while popup is open
  chrome.storage.onChanged.addListener((changes) => {
    if (tabImageMakerContent.style.display === "none") return;
    if (!changes.listify_img_status) return;
    const newStatus = changes.listify_img_status.newValue;
    if (newStatus === "done") {
      chrome.storage.local.get(["listify_img_count"], (r) => imShowState("done", { count: r.listify_img_count }));
    } else if (newStatus === "error") {
      chrome.storage.local.get(["listify_img_error"], (r) => imShowState("error", { error: r.listify_img_error }));
    }
  });

  // Tab click handler
  tabImageMakerBtn.addEventListener("click", () => {
    hideAllTabs();
    tabImageMakerBtn.classList.add("tab-active");
    tabImageMakerContent.style.display = "block";
    imApplyPlan();
    imCheckStatus();
    imFetchHistory();
  });

  function imPreprocessImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 1000, 1000);
        const ratio = Math.min(1000 / img.width, 1000 / img.height);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const x = Math.round((1000 - w) / 2);
        const y = Math.round((1000 - h) / 2);
        ctx.drawImage(img, x, y, w, h);
        URL.revokeObjectURL(url);
        let quality = 0.92;
        const attempt = () => {
          canvas.toBlob((blob) => {
            if (!blob) { reject(new Error("Canvas compression failed")); return; }
            if (blob.size <= 50 * 1024 || quality <= 0.1) {
              const reader = new FileReader();
              reader.onload  = () => resolve(reader.result);
              reader.onerror = () => reject(new Error("FileReader failed"));
              reader.readAsDataURL(blob);
            } else {
              quality = Math.max(0.1, quality - 0.08);
              attempt();
            }
          }, "image/jpeg", quality);
        };
        attempt();
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
      img.src = url;
    });
  }

  function imSetFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    _imFile = file;
    if (_imPreviewUrl) URL.revokeObjectURL(_imPreviewUrl);
    _imPreviewUrl = URL.createObjectURL(file);
    imDropPreview.src     = _imPreviewUrl;
    imFileName.textContent = file.name;
    imDropIdle.style.display     = "none";
    imDropSelected.style.display = "block";
    imOptions.style.display      = "block";
    imGenerateBtn.disabled       = false;
    imGenerateBtn.style.opacity  = "1";
    imGeneratingEl.style.display = "none";
    imSuccessEl.style.display    = "none";
    imErrorEl.style.display      = "none";
    imApplyPlan();
  }

  function imClearFile() {
    _imFile = null;
    if (_imPreviewUrl) { URL.revokeObjectURL(_imPreviewUrl); _imPreviewUrl = null; }
    imDropPreview.src            = "";
    imDropIdle.style.display     = "block";
    imDropSelected.style.display = "none";
    imOptions.style.display      = "none";
    imGenerateBtn.disabled       = true;
    imGenerateBtn.style.opacity  = "0.5";
    imGeneratingEl.style.display = "none";
    imSuccessEl.style.display    = "none";
    imErrorEl.style.display      = "none";
  }

  // Click idle area → open picker; selected state uses its own buttons
  imDropArea.addEventListener("click", () => { if (!_imFile) imFileInput.click(); });
  imChangeBtn.addEventListener("click", (e) => { e.stopPropagation(); imFileInput.click(); });
  imClearBtn.addEventListener("click",  (e) => { e.stopPropagation(); imClearFile(); });

  imFileInput.addEventListener("change", () => {
    if (imFileInput.files[0]) imSetFile(imFileInput.files[0]);
    imFileInput.value = "";
  });
  imDropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    imDropArea.style.borderColor = "var(--accent)";
  });
  imDropArea.addEventListener("dragleave", () => {
    imDropArea.style.borderColor = "var(--border)";
  });
  imDropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    imDropArea.style.borderColor = "var(--border)";
    if (e.dataTransfer.files[0]) imSetFile(e.dataTransfer.files[0]);
  });

  imGenerateBtn.addEventListener("click", async () => {
    if (!_imFile) return;
    imGenerateBtn.disabled      = true;
    imGenerateBtn.style.opacity = "0.5";
    imGenerateBtn.textContent   = "Preprocessing…";
    imGeneratingEl.style.display = "none";
    imSuccessEl.style.display    = "none";
    imErrorEl.style.display      = "none";
    try {
      const dataUrl = await imPreprocessImage(_imFile);
      imGenerateBtn.textContent = "Generate & Save to Library";
      imShowState("generating");
      // Clear any previous result in storage so onChanged fires for the new run
      await chrome.storage.local.remove(["listify_img_status", "listify_img_count", "listify_img_error"]);
      chrome.runtime.sendMessage({
        action:         "generate_image_start",
        imageBase64:    dataUrl,
        removeBg:       imRemoveBg.checked,
        addBorder:      imAddBorder.checked,
        multiVariation: imMultiVariation.checked,
        numVariations:  parseInt(imVariationSlider.value) || 5,
        stickers:       imAddStickers.checked,
        category:       imCategory.value || "Other",
      });
    } catch (err) {
      imGenerateBtn.disabled      = false;
      imGenerateBtn.style.opacity = "1";
      imGenerateBtn.textContent   = "Generate & Save to Library";
      imShowState("error", { error: err.message });
    }
  });

  // ── Theme toggle ──
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIconSun = document.getElementById("themeIconSun");
  const themeIconMoon = document.getElementById("themeIconMoon");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      themeIconSun.style.display = "block";
      themeIconMoon.style.display = "none";
      themeToggleBtn.title = "Switch to light mode";
    } else {
      themeIconSun.style.display = "none";
      themeIconMoon.style.display = "block";
      themeToggleBtn.title = "Switch to dark mode";
    }
  }

  chrome.storage.local.get(["listify_theme"], (result) => {
    applyTheme(result.listify_theme || "light");
  });

  themeToggleBtn.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    chrome.storage.local.set({ listify_theme: next });
  });

  // ── Auto help popover ──
  const autoInfoBtn = document.getElementById("autoInfoBtn");
  const autoInfoPopover = document.getElementById("autoInfoPopover");
  const autoInfoClose = document.getElementById("autoInfoClose");
  if (autoInfoBtn && autoInfoPopover) {
    const closePopover = () => autoInfoPopover.classList.remove("open");
    autoInfoBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      autoInfoPopover.classList.toggle("open");
    });
    autoInfoClose?.addEventListener("click", closePopover);
    document.addEventListener("click", (e) => {
      if (!autoInfoPopover.classList.contains("open")) return;
      if (
        e.target !== autoInfoPopover &&
        !autoInfoPopover.contains(e.target) &&
        e.target !== autoInfoBtn &&
        !autoInfoBtn.contains(e.target)
      ) {
        closePopover();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePopover();
    });
  }

  // ── Global Auto-fill toggle ──
  const autoFillGlobalBtn = document.getElementById("autoFillGlobalBtn");

  function applyAutoFillGlobal(enabled) {
    if (!autoFillGlobalBtn) return;
    autoFillGlobalBtn.classList.toggle("off", !enabled);
    autoFillGlobalBtn.title = enabled
      ? "Auto-fill is ON — click to disable"
      : "Auto-fill is OFF — click to enable";
  }

  chrome.storage.local.get(["listify_autofill_enabled"], (r) => {
    // Default is ON (only false when explicitly turned off)
    applyAutoFillGlobal(r.listify_autofill_enabled !== false);
  });

  autoFillGlobalBtn.addEventListener("click", () => {
    if (!_canAutoFill) {
      const msg =
        _planName === "free"
          ? "Buy a subscription to use Autofill — iprixmedia.com/dashboard/subscription"
          : "Auto-fill is not included in your plan. Upgrade to Pro — iprixmedia.com/dashboard/subscription";
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab || !tab.id || tab.url?.startsWith("chrome://")) return;
        chrome.tabs
          .sendMessage(tab.id, {
            action: "show_toast",
            message: msg,
            toastType: "warning",
          })
          .catch(() => {});
      });
      return;
    }
    chrome.storage.local.get(["listify_autofill_enabled"], (r) => {
      const current = r.listify_autofill_enabled !== false; // default true
      const next = !current;
      chrome.storage.local.set({ listify_autofill_enabled: next });
      applyAutoFillGlobal(next);

      // Show toast on the current page
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab || !tab.id || tab.url?.startsWith("chrome://")) return;
        chrome.tabs
          .sendMessage(tab.id, {
            action: "show_toast",
            message: next ? "Auto-fill enabled" : "Auto-fill disabled",
            toastType: next ? "info" : "off",
          })
          .catch(() => {});
      });
    });
  });
  const authSection = document.getElementById("authSection");
  const mainSection = document.getElementById("mainSection");
  const logoutBtn = document.getElementById("logoutBtn");
  const templateList = document.getElementById("templateList");
  const loadingMsg = document.getElementById("loadingMsg");
  const recentContainer = document.getElementById("recentContainer");
  const recentTemplateList = document.getElementById("recentTemplateList");
  const mostUsedContainer = document.getElementById("mostUsedContainer");
  const mostUsedTemplateList = document.getElementById("mostUsedTemplateList");
  const allContainer = document.getElementById("allContainer");
  const allTitle = document.getElementById("allTitle");
  const captureBtn = document.getElementById("captureBtn");
  const statusDiv = document.getElementById("status");
  const captureSection = document.getElementById("captureSection");
  const saveSection = document.getElementById("saveSection");
  const listSection = document.getElementById("listSection");
  const templateNameInput = document.getElementById("templateNameInput");
  const confirmSaveBtn = document.getElementById("confirmSaveBtn");
  const cancelSaveBtn = document.getElementById("cancelSaveBtn");
  const mismatchWarning = document.getElementById("mismatchWarning");
  const warnList = document.getElementById("warnList");
  const warnSubtext = document.getElementById("warnSubtext");
  const warnFilled = document.getElementById("warnFilled");
  const warnCloseBtn = document.getElementById("warnCloseBtn");
  const quickCatSection = document.getElementById("quickCatSection");
  const recentCatRow = document.getElementById("recentCatRow");
  const recentCatChips = document.getElementById("recentCatChips");
  const categoryInput = document.getElementById("categoryInput");
  const categoryDatalist = document.getElementById("categoryDatalist");
  const saveCatChips = document.getElementById("saveCatChips");

  // ── Extension login elements ──
  const signInBtn = document.getElementById("signInBtn");
  const signUpLink = document.getElementById("signUpLink");
  const extLoginError = document.getElementById("extLoginError");

  // ── Mismatch warning close ──
  warnCloseBtn.addEventListener("click", () => {
    mismatchWarning.style.display = "none";
  });

  let pendingTemplateData = null;
  let authToken = null;
  let activeCategory = null;
  let _categoryAutoSet = false; // true when set from page detection, false when user clicks a chip
  let _fillsUsed = 0;
  let _fillLimit = -1;
  let _canAutoFill = true;
  let _planName = "free";

  // ── Shared helpers for platform modules (fk-tab.js etc.) ──
  // fk-tab.js is loaded after popup.js and reads these via window.listifyShared.
  // getAuthToken() is a function so it always returns the current token value,
  // even though authToken is set asynchronously after chrome.storage.local.get.
  window.listifyShared = {
    getAuthToken: () => authToken,
    authHeaders: () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    }),
    ensureContentScript: (tabId) => ensureContentScript(tabId),
    isRestrictedUrl: (url) => isRestrictedUrl(url),
  };

  // ── Redirect to login and close sidebar ──
  async function redirectToLogin() {
    clearStoredAuth();
    chrome.tabs.create({ url: `${FRONTEND_URL}/login?from=extension` });
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_SIDEBAR", forceOpen: false }).catch(() => {});
      }
    } catch (_) {}
  }

  // ── Storage listener: automatically sync authentication when storage changes ──
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "local" && changes.listify_token) {
      const newToken = changes.listify_token.newValue;
      if (newToken) {
        authToken = newToken;
        try {
          const res = await fetch(`${AUTH_URL}/me`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (res.ok) {
            const user = await res.json();
            chrome.storage.local.set({ listify_user: user });
            showMainUI(user);
          }
        } catch (_) {}
      } else {
        authToken = null;
        showAuthUI();
      }
    }
  });

  // ── Bootstrap: check stored token, or pick up from frontend ──
  chrome.storage.local.get(
    ["listify_token", "listify_user"],
    async (result) => {
      if (result.listify_token) {
        authToken = result.listify_token;
        // Show main UI immediately from cached user (no flash of sign-in).
        if (result.listify_user) showMainUI(result.listify_user);
        // Then verify in the background. Only clear on 401 (token actually
        // invalid); network/server errors leave the cached session intact.
        fetch(`${AUTH_URL}/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
          .then((r) => {
            if (r.ok) return r.json().then((user) => {
              chrome.storage.local.set({ listify_user: user });
              showMainUI(user);
            });
            if (r.status === 401 || r.status === 403) {
              redirectToLogin();
            }
          })
          .catch(() => {
            if (!result.listify_user) redirectToLogin();
          });
      } else {
        // Try to pick up token from the frontend if user is already logged in there
        const frontendToken = await _tryGetFrontendToken();
        if (frontendToken) {
          try {
            const res = await fetch(`${AUTH_URL}/me`, {
              headers: { Authorization: `Bearer ${frontendToken}` },
            });
            if (res.ok) {
              const user = await res.json();
              authToken = frontendToken;
              chrome.storage.local.set(
                {
                  listify_token: frontendToken,
                  listify_user: user,
                },
                () => showMainUI(user),
              );
              return;
            }
          } catch (_) {}
        }
        redirectToLogin();
      }
    },
  );

  // Try to read the token from any open frontend tab
  async function _tryGetFrontendToken() {
    try {
      const tabs = await chrome.tabs.query({ url: [`${FRONTEND_URL}/*`] });
      for (const tab of tabs) {
        if (!tab.id) continue;
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => localStorage.getItem("listify_token"),
          });
          const token = results?.[0]?.result;
          if (token) return token;
        } catch (_) {}
      }
    } catch (_) {}
    return null;
  }

  // ── Sign In / Sign Up — redirect to frontend ──
  signInBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: `${FRONTEND_URL}/login?from=extension` });
    // Start polling for the token from the frontend tab
    _pollFrontendToken();
  });

  signUpLink.addEventListener("click", () => {
    chrome.tabs.create({ url: `${FRONTEND_URL}/register?from=extension` });
    _pollFrontendToken();
  });

  // After opening the frontend login page, poll for the token.
  // When the user logs in on the frontend, localStorage gets the token.
  // We inject a script into the frontend tab to read it.
  function _pollFrontendToken() {
    extLoginError.style.display = "none";
    signInBtn.textContent = "Waiting for login…";
    signInBtn.disabled = true;

    let attempts = 0;
    const maxAttempts = 60; // ~60 seconds
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        signInBtn.innerHTML = `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg> Sign in with A+ Studio`;
        signInBtn.disabled = false;
        return;
      }

      try {
        // Find any tab on the frontend domain
        const tabs = await chrome.tabs.query({ url: [`${FRONTEND_URL}/*`] });
        if (tabs.length === 0) return;

        for (const tab of tabs) {
          if (!tab.id) continue;
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => localStorage.getItem("listify_token"),
            });
            const token = results?.[0]?.result;
            if (token) {
              clearInterval(interval);
              // Verify the token is valid
              const res = await fetch(`${AUTH_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                const user = await res.json();
                authToken = token;
                chrome.storage.local.set(
                  {
                    listify_token: token,
                    listify_user: user,
                  },
                  () => showMainUI(user),
                );
              }
              signInBtn.innerHTML = `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg> Sign in with A+ Studio`;
              signInBtn.disabled = false;
              return;
            }
          } catch (_) {
            /* tab may not be ready */
          }
        }
      } catch (_) {}
    }, 1000);
  }

  // ── Logout ──
  logoutBtn.addEventListener("click", () => {
    clearStoredAuth();
    authToken = null;
    showAuthUI();
  });

  // ── Show/hide sections ──
  function showAuthUI() {
    authSection.style.display = "block";
    mainSection.style.display = "none";
    // Reset bulk tab so no stale state bleeds through on next login
    bfActivePanel.style.display = "none";
    bfSetupPanel.style.display = "block";
  }

  async function showMainUI(user) {
    authSection.style.display = "none";
    mainSection.style.display = "block";
    document.getElementById("userDisplayName").textContent = user.name || "-";
    document.getElementById("userDisplayEmail").textContent = user.email || "-";
    const avatar = document.getElementById("userAvatar");
    if (avatar && user.name)
      avatar.textContent = user.name.charAt(0).toUpperCase();

    // On Meesho, auto-filter the template list to the currently tracked category.
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.url?.includes("meesho")) {
        const res = await chrome.tabs.sendMessage(tab.id, {
          action: "get_tab_category",
        });
        if (res?.category) { activeCategory = res.category; _categoryAutoSet = true; }
      }
    } catch (_) {
      /* ignore — loadTemplates will still run below */
    }

    loadTemplates();

    // Sync bulk fill state and pre-load templates for the Bulk tab
    bfRefreshActivePanel();
    bfLoadTemplates();
  }

  // ── Quick category chips ──
  // Recent  = categories from templates sorted by lastUsedAt / createdAt
  // Popular = categories ranked by how often user SELECTED them on Meesho
  //           (listify_meesho_steps click count — more reliable than fill count)
  async function updateCategoryChips(templates) {
    const withCat = templates.filter((t) => t.category);

    // ── Recent: last-used / last-saved category first ──
    const recentCats = [];
    if (withCat.length > 0) {
      const recentSorted = [...withCat].sort((a, b) => {
        const ta = a.lastUsedAt
          ? new Date(a.lastUsedAt)
          : new Date(a.createdAt);
        const tb = b.lastUsedAt
          ? new Date(b.lastUsedAt)
          : new Date(b.createdAt);
        return tb - ta;
      });
      for (const t of recentSorted) {
        if (t.category) {
          recentCats.push(t.category);
          break;
        }
      }
    }

    if (recentCats.length === 0) {
      loadCategoryChipsFromSteps();
      return;
    }

    renderChipRow(recentCatRow, recentCatChips, recentCats);
    quickCatSection.style.display = "block";
  }

  // Fallback: derive chips from Meesho category click history
  function loadCategoryChipsFromSteps() {
    chrome.storage.local.get(["listify_meesho_steps"], (result) => {
      const steps = result.listify_meesho_steps || [];
      if (steps.length === 0) {
        quickCatSection.style.display = "none";
        return;
      }

      const recentCats = [];
      for (let i = steps.length - 1; i >= 0; i--) {
        if (steps[i].category) {
          recentCats.push(steps[i].category);
          break;
        }
      }

      renderChipRow(recentCatRow, recentCatChips, recentCats);
      quickCatSection.style.display = "block";
    });
  }

  function renderChipRow(row, container, cats) {
    if (cats.length === 0) {
      row.style.display = "none";
      return;
    }
    row.style.display = "flex";
    container.innerHTML = "";
    cats.forEach((cat) => {
      const chip = document.createElement("button");
      chip.className = "chip" + (activeCategory === cat ? " active" : "");
      chip.textContent = cat;
      chip.title = cat;
      chip.addEventListener("click", () => {
        activeCategory = activeCategory === cat ? null : cat;
        _categoryAutoSet = false; // user explicitly chose this filter
        loadTemplates();
      });
      container.appendChild(chip);
    });
  }

  function clearStoredAuth() {
    chrome.storage.local.remove(["listify_token", "listify_user"]);
  }

  // ── Helper: auth headers ──
  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };
  }

  // ── Meesho auto-fill category enforcement ──
  // One template per category may have autoFill=true. If none is on, the
  // most-recent template is promoted. Kept in sync with fk-tab.js logic.
  let _meeshoTemplates = [];
  function _meeshoCatKey(c) {
    return (c || "").toLowerCase().trim();
  }
  async function _putMeeshoAutoFill(id, val) {
    try {
      const r = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ autoFill: val }),
      });
      return r.ok;
    } catch {
      return false;
    }
  }
  async function enforceMeeshoCategoryAuto() {
    const byCat = new Map();
    for (const t of _meeshoTemplates) {
      const k = _meeshoCatKey(t.category);
      if (!k) continue;
      if (!byCat.has(k)) byCat.set(k, []);
      byCat.get(k).push(t);
    }
    const updates = [];
    for (const list of byCat.values()) {
      const sorted = [...list].sort(
        (a, b) =>
          new Date(b.lastUsedAt || b.createdAt || 0) -
          new Date(a.lastUsedAt || a.createdAt || 0),
      );
      const onTemplates = sorted.filter((t) => t.autoFill);
      // Promote most-recent only when nothing is on. Do NOT silently demote
      // duplicates — if multiple are on (e.g. a cascade PUT failed), leave
      // them visible so the user can resolve it explicitly instead of having
      // their most recent toggle silently reverted on the next load.
      if (onTemplates.length === 0 && list.length >= 2) {
        const pick = sorted[0];
        if (pick) {
          pick.autoFill = true;
          updates.push(_putMeeshoAutoFill(pick._id, true));
        }
      }
    }
    if (updates.length) await Promise.all(updates);
  }
  async function cascadeMeeshoAutoToggle(t, newVal) {
    const catK = _meeshoCatKey(t.category);
    if (!catK) return;
    const siblings = _meeshoTemplates.filter(
      (x) => x._id !== t._id && _meeshoCatKey(x.category) === catK,
    );
    if (newVal) {
      const toOff = siblings.filter((s) => s.autoFill);
      await Promise.all(
        toOff.map(async (s) => {
          if (await _putMeeshoAutoFill(s._id, false)) s.autoFill = false;
        }),
      );
    } else if (siblings.length && !siblings.some((s) => s.autoFill)) {
      const pick = [...siblings].sort(
        (a, b) =>
          new Date(b.lastUsedAt || b.createdAt || 0) -
          new Date(a.lastUsedAt || a.createdAt || 0),
      )[0];
      if (await _putMeeshoAutoFill(pick._id, true)) pick.autoFill = true;
    }
  }

  // ─────────────────────────────────────────
  // Existing template functionality (updated
  // to include auth headers in all requests)
  // ─────────────────────────────────────────

  async function ensureContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: true },
        files: ["content-script.js"],
      });
      if (chrome.runtime.lastError) {
        console.warn(
          "Script injection warning:",
          chrome.runtime.lastError.message,
        );
      }
    } catch (e) {
      console.log("Script injection check:", e.message);
    }
  }

  // 1. Capture Click
  captureBtn.addEventListener("click", async () => {
    setBusy(true, "Scanning page...");

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab || !tab.url || isRestrictedUrl(tab.url)) {
        setBusy(false);
        return status("Cannot save from this page.", "red");
      }

      await ensureContentScript(tab.id);

      chrome.tabs.sendMessage(
        tab.id,
        { action: "scan_form" },
        { frameId: 0 },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn(
              "[LISTIFY POPUP] Scan error:",
              chrome.runtime.lastError.message,
            );
            setBusy(false);
            return status("Error: Refresh the page.", "red");
          }

          if (
            response &&
            response.data &&
            response.data.fields &&
            response.data.fields.length > 0
          ) {
            pendingTemplateData = response.data;

            // Log scanned fields in popup console
            console.log(
              `%c[LISTIFY POPUP] ═══ SCAN RESULT ═══`,
              "color: #ff4f1f; font-weight: bold",
            );
            console.log(`[LISTIFY POPUP] Page: ${response.data.url}`);
            console.log(`[LISTIFY POPUP] Domain: ${response.data.domain}`);
            console.log(
              `[LISTIFY POPUP] Fields captured: ${response.data.fields.length}`,
            );
            console.table(
              response.data.fields.map((f, i) => ({
                "#": i + 1,
                Label: f.label || "—",
                Value:
                  typeof f.value === "boolean"
                    ? f.value
                      ? "CHECKED"
                      : "UNCHECKED"
                    : f.value || "(empty)",
                Type: f.type,
                ID: f.id || "—",
                Name: f.name || "—",
              })),
            );

            templateNameInput.value =
              (response.data.title || "My Form") + " - Template";

            categoryInput.value = "";
            try {
              chrome.tabs.sendMessage(
                tab.id,
                { action: "get_tab_category" },
                (res) => {
                  if (res?.category) {
                    categoryInput.value = res.category;
                  } else if (pendingTemplateData.category) {
                    categoryInput.value = pendingTemplateData.category;
                  }
                },
              );
            } catch (_) {}

            showSaveUI(true);
            status("Form scanned! Enter name to save.", "blue");
          } else {
            console.log("[LISTIFY POPUP] Scan returned 0 fields.");
            setBusy(false);
            status("No inputs found to save.", "orange");
          }
        },
      );
    } catch (err) {
      console.error(err);
      setBusy(false);
      status("Error: " + err.message, "red");
    }
  });

  // 2. Confirm Save Click
  confirmSaveBtn.addEventListener("click", async () => {
    if (confirmSaveBtn.disabled) return;

    const name = templateNameInput.value.trim();
    if (!name) return status("Please enter a name.", "red");
    if (!pendingTemplateData) return status("No data to save.", "red");

    setBusy(true, "Saving...");

    let category = categoryInput.value.trim();
    if (!category) {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const res = await chrome.tabs.sendMessage(tab.id, {
          action: "get_tab_category",
        });
        category = res?.category || "";
      } catch (_) {}
    }

    // Fall back to the DOM-scraped category if we didn't track any explicit clicks
    if (!category) {
      category = pendingTemplateData?.category || "";
    }

    if (category) {
      console.log(`[LISTIFY] Saving template with category: "${category}"`);
    }

    const payload = {
      name: name,
      url: pendingTemplateData.domain,
      fields: pendingTemplateData.fields,
      category,
    };

    const doSave = () =>
      fetch(API_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

    try {
      let saveRes;
      try {
        saveRes = await doSave();
      } catch {
        // First attempt failed — server may be cold-starting. Retry after 5 s.
        status("Server starting up… retrying", "orange");
        await new Promise((r) => setTimeout(r, 5000));
        saveRes = await doSave();
      }

      if (saveRes.ok) {
        status("Template saved!", "green");
        showSaveUI(false);
        loadTemplates();
      } else {
        let errMsg = `Error ${saveRes.status}`;
        try {
          const errData = await saveRes.json();
          errMsg = errData.error || errMsg;
        } catch {
          /* non-JSON body */
        }
        status(errMsg, "red");
        console.error("[LISTIFY] Save failed:", saveRes.status, errMsg);
      }
    } catch (e) {
      status("Server unreachable — please try again.", "red");
      console.error(e);
    } finally {
      setBusy(false);
    }
  });

  // 3. Cancel Click
  cancelSaveBtn.addEventListener("click", () => {
    showSaveUI(false);
    status("Cancelled.");
  });

  function showSaveUI(show) {
    if (show) {
      captureSection.style.display = "none";
      listSection.style.display = "none";
      saveSection.style.display = "block";
      templateNameInput.focus();
      populateSaveChips();
      setBusy(false);
    } else {
      captureSection.style.display = "block";
      listSection.style.display = "block";
      saveSection.style.display = "none";
      pendingTemplateData = null;
      setBusy(false);
    }
  }

  function populateSaveChips() {
    if (!authToken) return;
    saveCatChips.innerHTML = "";
    saveCatChips.style.display = "none";
    categoryDatalist.innerHTML = "";

    fetch(`${API_URL}?limit=50`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const arr = Array.isArray(data) ? data : data?.templates || [];
        const freq = {};
        arr.forEach((t) => {
          if (t.category) freq[t.category] = (freq[t.category] || 0) + 1;
        });
        const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);

        // Populate datalist for autocomplete
        sorted.forEach((cat) => {
          const opt = document.createElement("option");
          opt.value = cat;
          categoryDatalist.appendChild(opt);
        });

        // Top 3 as chips
        const topCats = sorted.slice(0, 3);
        if (topCats.length > 0) {
          saveCatChips.style.display = "flex";
          topCats.forEach((cat) => {
            const chip = document.createElement("button");
            chip.className = "chip";
            chip.textContent = cat;
            chip.type = "button";
            chip.title = cat;
            chip.onclick = () => {
              categoryInput.value = cat;
            };
            saveCatChips.appendChild(chip);
          });
        }
      })
      .catch(() => {});
  }

  function setBusy(busy, msg) {
    if (msg) status(msg);
    captureBtn.disabled = busy;
    confirmSaveBtn.disabled = busy;
    captureBtn.style.opacity = busy ? "0.7" : "1";
  }

  function isRestrictedUrl(url) {
    return (
      url.startsWith("chrome://") ||
      url.startsWith("edge://") ||
      url.startsWith("about:")
    );
  }

  async function loadTemplates() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab || !tab.url || isRestrictedUrl(tab.url)) return;

      const domain = new URL(tab.url).hostname;
      let apiUrl = `${API_URL}?url=${encodeURIComponent(domain)}`;
      if (activeCategory)
        apiUrl += `&category=${encodeURIComponent(activeCategory)}`;
      const res = await fetch(apiUrl, { headers: authHeaders() });

      if (!res.ok) {
        if (res.status === 401) {
          clearStoredAuth();
          authToken = null;
          showAuthUI();
          return;
        }
        throw new Error("HTTP " + res.status);
      }

      const data = await res.json();
      const templates = Array.isArray(data) ? data : data.templates || [];
      _fillsUsed = data.fillsUsed ?? _fillsUsed;
      _fillLimit = data.fillLimit ?? _fillLimit;
      _canAutoFill = data.canAutoFill !== false; // false only when backend explicitly says so
      _planName = (data.planName || "free").toLowerCase();

      _meeshoTemplates = templates;
      if (_canAutoFill) {
        try { await enforceMeeshoCategoryAuto(); } catch {}
      }

      // Disable global autofill toggle for free plan users
      if (!_canAutoFill) {
        autoFillGlobalBtn.disabled = true;
        autoFillGlobalBtn.title = "Upgrade to Pro to enable Auto-fill";
        chrome.storage.local.set({ listify_autofill_enabled: false });
        applyAutoFillGlobal(false);
      } else {
        autoFillGlobalBtn.disabled = false;
      }

      // Fetch ALL templates (no domain filter) for accurate chip data
      fetch(`${API_URL}?limit=50`, { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const all = d ? (Array.isArray(d) ? d : d.templates || []) : [];
          updateCategoryChips(all.length ? all : templates);
        })
        .catch(() => updateCategoryChips(templates));

      templateList.innerHTML = "";
      recentTemplateList.innerHTML = "";
      mostUsedTemplateList.innerHTML = "";
      recentContainer.style.display = "none";
      mostUsedContainer.style.display = "none";
      allContainer.style.display = "none";
      loadingMsg.style.display = "none";

      if (templates.length === 0) {
        if (activeCategory && _categoryAutoSet) {
          // Auto-detected category matched nothing — silently show all templates
          activeCategory = null;
          _categoryAutoSet = false;
          loadTemplates();
          return;
        }
        loadingMsg.style.display = "block";
        if (activeCategory) {
          loadingMsg.innerHTML = `No templates for <strong style="color:var(--accent)">${activeCategory}</strong>.<br><span style="font-size:11px">Click the chip above to show all templates.</span>`;
        } else {
          loadingMsg.innerHTML = "No templates found for this site.";
        }
        return;
      }

      const escHtml = (str) =>
        String(str ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

      const buildMeeshoDetailHTML = (t) => {
        const sections = Array.isArray(t.sections) ? t.sections : [];
        const flatFields = Array.isArray(t.fields) ? t.fields : [];
        const rowHTML = (f) =>
          `<tr>
            <td style="padding:3px 6px;color:var(--soft);font-size:10.5px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(f.label || f.placeholder || f.name || "—")}</td>
            <td style="padding:3px 6px;color:var(--text);font-size:10.5px;font-weight:600;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(String(f.value ?? ""))}</td>
          </tr>`;

        if (sections.length > 0) {
          return sections
            .map((s) => {
              const title =
                s.title === "_unknown" ? "Other Fields" : escHtml(s.title);
              const rows = (s.fields || []).map(rowHTML).join("");
              return `
                <div style="margin-bottom:8px;">
                  <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--accent);margin-bottom:4px;">${title}</div>
                  <table style="width:100%;border-collapse:collapse;background:var(--surface2);border-radius:6px;overflow:hidden;">
                    ${rows || '<tr><td colspan="2" style="padding:4px 6px;color:var(--muted);font-size:10px;">No fields</td></tr>'}
                  </table>
                </div>`;
            })
            .join("");
        }

        if (flatFields.length > 0) {
          const rows = flatFields.map(rowHTML).join("");
          return `<table style="width:100%;border-collapse:collapse;background:var(--surface2);border-radius:6px;overflow:hidden;">${rows}</table>`;
        }

        return '<div style="font-size:11px;color:var(--muted);">No field data stored.</div>';
      };

      const renderSet = (listData, containerEl) => {
        listData.forEach((t) => {
          const li = document.createElement("li");
          li.className = "template-item";

          const infoDiv = document.createElement("div");
          infoDiv.className = "template-info";

          const nameSpan = document.createElement("span");
          nameSpan.className = "template-name";
          nameSpan.textContent = t.name;
          nameSpan.title = t.name;
          infoDiv.appendChild(nameSpan);

          if (t.category) {
            const catSpan = document.createElement("span");
            catSpan.className = "template-cat";
            catSpan.textContent = t.category;
            infoDiv.appendChild(catSpan);
          }

          const actionsDiv = document.createElement("div");
          actionsDiv.className = "template-actions";

          const btnFill = document.createElement("button");
          btnFill.className = "btn-fill";
          btnFill.textContent = "Fill";
          btnFill.onclick = () => fillTemplate(t);

          // ⚡ Auto-fill toggle
          const btnAutoFill = document.createElement("button");
          if (!_canAutoFill) {
            btnAutoFill.className = "btn-autofill btn-auto-toggle";
            btnAutoFill.textContent = 'Auto';
            btnAutoFill.title = "Upgrade to Pro to enable Auto-fill";
            btnAutoFill.disabled = true;
            btnAutoFill.style.opacity = "0.4";
            btnAutoFill.style.cursor = "not-allowed";
            btnAutoFill.onclick = (e) => {
              e.stopPropagation();
              const msg =
                _planName === "free"
                  ? "Buy a subscription to use Autofill — iprixmedia.com/dashboard/subscription"
                  : "Auto-fill is not included in your plan. Upgrade to Pro — iprixmedia.com/dashboard/subscription";
              chrome.tabs.query(
                { active: true, currentWindow: true },
                ([tab]) => {
                  if (!tab || !tab.id || tab.url?.startsWith("chrome://"))
                    return;
                  chrome.tabs
                    .sendMessage(tab.id, {
                      action: "show_toast",
                      message: msg,
                      toastType: "warning",
                    })
                    .catch(() => {});
                },
              );
            };
            // Re-enable click even on disabled button
            btnAutoFill.disabled = false;
          } else {
            btnAutoFill.className =
              "btn-autofill btn-auto-toggle" + (t.autoFill ? " active" : "");
            btnAutoFill.textContent = "Auto";
            btnAutoFill.title = t.autoFill
              ? `Auto-fill ON for "${t.category || "this category"}" — click to disable`
              : `Click to make this the auto-fill template for "${t.category || "this category"}"`;
            btnAutoFill.onclick = async (e) => {
              e.stopPropagation();
              btnAutoFill.disabled = true;
              const newVal = !t.autoFill;
              const ok = await _putMeeshoAutoFill(t._id, newVal);
              if (!ok) {
                btnAutoFill.disabled = false;
                return;
              }
              t.autoFill = newVal;
              await cascadeMeeshoAutoToggle(t, newVal);
              btnAutoFill.disabled = false;
              loadTemplates();
            };
          }

          const btnDelete = document.createElement("button");
          btnDelete.className = "btn-delete";
          btnDelete.textContent = "Delete";
          btnDelete.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${t.name}"?`)) {
              deleteTemplate(t._id);
            }
          };

          const btnDetails = document.createElement("button");
          btnDetails.className = "btn-autofill";
          btnDetails.textContent = "▼";
          btnDetails.title = "Show/hide field details";

          actionsDiv.appendChild(btnAutoFill);
          actionsDiv.appendChild(btnFill);
          actionsDiv.appendChild(btnDetails);
          actionsDiv.appendChild(btnDelete);
          li.appendChild(infoDiv);
          li.appendChild(actionsDiv);
          containerEl.appendChild(li);

          const detail = document.createElement("div");
          detail.style.cssText =
            "display:none;padding:8px 10px 10px;border:1px solid var(--border);border-top:none;" +
            "background:var(--surface2);margin-top:-6px;margin-bottom:6px;border-radius:0 0 8px 8px;";
          detail.innerHTML = buildMeeshoDetailHTML(t);
          containerEl.appendChild(detail);

          btnDetails.addEventListener("click", (e) => {
            e.stopPropagation();
            const open = detail.style.display !== "none";
            detail.style.display = open ? "none" : "block";
            btnDetails.textContent = open ? "···" : "▲";
          });
        });
      };

      const recentTemplates = [...templates]
        .sort(
          (a, b) =>
            new Date(b.lastUsedAt || b.createdAt) -
            new Date(a.lastUsedAt || a.createdAt),
        )
        .slice(0, 1);

      const shownIds = new Set();

      if (recentTemplates.length > 0) {
        recentContainer.style.display = "block";
        renderSet(recentTemplates, recentTemplateList);
        recentTemplates.forEach((t) => shownIds.add(t._id));
      }

      // Most Used: top 3 by usageCount, only templates with at least 1 use,
      // excluding anything already shown in Recent
      const mostUsedTemplates = [...templates]
        .filter((t) => (t.usageCount || 0) > 0 && !shownIds.has(t._id))
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 3);

      if (mostUsedTemplates.length > 0) {
        mostUsedContainer.style.display = "block";
        renderSet(mostUsedTemplates, mostUsedTemplateList);
        mostUsedTemplates.forEach((t) => shownIds.add(t._id));
      }

      const otherTemplates = templates
        .filter((t) => !shownIds.has(t._id))
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
      if (otherTemplates.length > 0) {
        allContainer.style.display = "block";
        allTitle.textContent = "Most Used Templates";
        renderSet(otherTemplates, templateList);
      }
    } catch (err) {
      console.error(err);
      loadingMsg.style.display = "block";
      loadingMsg.innerHTML =
        '<span style="color:red">Error loading templates. Is backend running?</span>';
    }
  }

  async function deleteTemplate(id) {
    status("Deleting template...");
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (res.ok) {
        status("Template deleted", "green");
        loadTemplates();
      } else {
        status("Error deleting template", "red");
      }
    } catch (err) {
      console.error(err);
      status("Error connecting to server", "red");
    }
  }

  async function fillTemplate(template) {
    mismatchWarning.style.display = "none";

    // Block fill if free user has hit their limit
    if (_fillLimit !== -1 && _fillsUsed >= _fillLimit) {
      status(
        `Fill limit reached (${_fillsUsed}/${_fillLimit}). Upgrade to continue.`,
        "red",
      );
      return;
    }

    status("Filling form...");
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.url || isRestrictedUrl(tab.url)) {
        return status("Cannot fill on this page.", "red");
      }

      await ensureContentScript(tab.id);

      // Category mismatch check — prefer live DOM detection, fall back to storage
      if (template.category) {
        try {
          // Try DOM-based detection first (most accurate on the current form page)
          let currentCat = "";
          const domRes = await new Promise((resolve) =>
            chrome.tabs.sendMessage(
              tab.id,
              { action: "get_tab_category_dom" },
              resolve,
            ),
          );
          currentCat = (domRes?.category || "").trim();

          // Fall back to storage if DOM returned nothing
          if (!currentCat) {
            const storRes = await new Promise((resolve) =>
              chrome.tabs.sendMessage(
                tab.id,
                { action: "get_tab_category" },
                resolve,
              ),
            );
            currentCat = (storRes?.category || "").trim();
          }

          const templateCat = template.category.trim();
          if (
            currentCat &&
            currentCat.toLowerCase() !== templateCat.toLowerCase()
          ) {
            chrome.tabs
              .sendMessage(tab.id, {
                action: "show_toast",
                message: `No template saved for "${currentCat}"`,
                toastType: "warning",
              })
              .catch(() => {});
            return status(
              `Wrong category — template is for "${templateCat}"`,
              "red",
            );
          }
        } catch (_) {
          /* category check is best-effort */
        }
      }

      chrome.tabs.sendMessage(
        tab.id,
        { action: "fill_form", data: template },
        { frameId: 0 },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn(
              "[LISTIFY POPUP] Fill error:",
              chrome.runtime.lastError.message,
            );
            status("Error: content script disconnected. Retry.", "red");
            return;
          }
          if (response && response.success) {
            const filled = response.filledCount || 0;
            const notFound = response.notFoundCount || 0;
            const optionMissed = response.optionNotFoundCount || 0;
            const totalMissed = notFound + optionMissed;

            // Log fill results in popup console
            console.log(
              `%c[LISTIFY POPUP] ═══ FILL RESULT ═══`,
              "color: #2196F3; font-weight: bold",
            );
            console.log(`[LISTIFY POPUP] Template: ${template.name}`);
            console.log(
              `[LISTIFY POPUP] Filled: ${filled} | Not Found: ${notFound} | Option Missed: ${optionMissed}`,
            );
            if (response.notFoundLabels && response.notFoundLabels.length > 0) {
              console.log(
                `[LISTIFY POPUP] Missing fields: ${response.notFoundLabels.join(", ")}`,
              );
            }
            if (
              response.optionNotFoundLabels &&
              response.optionNotFoundLabels.length > 0
            ) {
              console.log(
                `[LISTIFY POPUP] Missing options: ${response.optionNotFoundLabels.join(", ")}`,
              );
            }

            if (totalMissed === 0) {
              mismatchWarning.style.display = "none";
              status(`Filled ${filled} fields!`, "green");
            } else {
              status(`Filled ${filled} field(s).`, "green");
              showMismatchWarning(
                filled,
                totalMissed,
                response.notFoundLabels || [],
                response.optionNotFoundLabels || [],
              );
            }

            // Record usage → updates usageCount + lastUsedAt on backend
            _fillsUsed++;
            fetch(`${API_URL}/${template._id}/use`, {
              method: "POST",
              headers: authHeaders(),
            }).catch((err) =>
              console.warn("[LISTIFY] Usage tracking failed:", err),
            );

            // Enable auto-fill on this template if not already set —
            // only for paid plan users; free plan users cannot use autofill
            if (!template.autoFill && _canAutoFill) {
              fetch(`${API_URL}/${template._id}`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify({ autoFill: true }),
              })
                .then(() => {
                  template.autoFill = true; // update local reference too
                  loadTemplates();
                })
                .catch((err) =>
                  console.warn("[LISTIFY] autoFill enable failed:", err),
                );
            } else {
              loadTemplates();
            }
          } else {
            const err =
              response && response.error ? response.error : "Unknown error";
            status("Failed: " + err, "red");
          }
        },
      );
    } catch (e) {
      console.error(e);
      status("Unexpected error.", "red");
    }
  }

  function showMismatchWarning(
    filled,
    totalMissed,
    notFoundLabels,
    optionNotFoundLabels,
  ) {
    // Subtext line
    warnSubtext.textContent =
      `This template was saved from a different form/category. ` +
      `${totalMissed} field(s) could not be matched on this page.`;

    // Build the combined list
    warnList.innerHTML = "";
    const allMissed = [];

    notFoundLabels.forEach((lbl) =>
      allMissed.push({ lbl, reason: "field not found on page" }),
    );
    optionNotFoundLabels.forEach((lbl) =>
      allMissed.push({ lbl, reason: "dropdown option not available" }),
    );

    allMissed.forEach(({ lbl, reason }) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${lbl}</strong> <span style="color:#a07000;font-size:10.5px">(${reason})</span>`;
      warnList.appendChild(li);
    });

    // Filled count footer
    warnFilled.textContent = `✔ ${filled} field(s) were filled successfully.`;

    mismatchWarning.style.display = "block";
  }

  function status(msg, color = "#333") {
    statusDiv.textContent = msg;
    statusDiv.style.color = color;
    if (color !== "red") {
      // Warnings (orange) stay for 7 s; success/info clear after 3 s
      const delay = color === "orange" ? 7000 : 3000;
      setTimeout(() => {
        if (statusDiv.textContent === msg) statusDiv.textContent = "";
      }, delay);
    }
  }
});
