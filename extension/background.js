importScripts("logger.js", "config.js");

// Toggle overlay sidebar when extension icon is clicked
// Toggle overlay sidebar when extension icon is clicked, or redirect to login if unauthenticated
chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get(["listify_token"], (result) => {
    if (result.listify_token) {
      chrome.tabs
        .sendMessage(tab.id, { action: "TOGGLE_SIDEBAR" }, { frameId: 0 })
        .catch(() => {});
    } else {
      chrome.tabs.create({ url: `${FRONTEND_URL}/login?from=extension` });
    }
  });
});

// Track which tabs have already been auto-filled (reset on new page load)
const filledTabIds = new Set();

// Cancellation flag for runBulkFillTabs — set to true when user clicks Stop
let _bulkFillAborted = false;

// ─────────────────────────────────────────────────────────────
// BULK FILL — Tab-based driver
// Opens the form URL in a new tab for each row, fills it,
// auto-saves, closes it, then moves to the next row.
// ─────────────────────────────────────────────────────────────

function waitForTabLoad(tabId, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("Tab load timeout"));
    }, timeoutMs);
    function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function runBulkFillTabs(queue, templateUrl, firstTabId) {
  _bulkFillAborted = false;
  console.log(`[LISTIFY BG] Parallel bulk fill: ${queue.length} rows`);

  // ── Read category from original tab before anything navigates away ──
  let bulkCategoryFull = queue[0]?.categoryFull || "";
  if (firstTabId && !bulkCategoryFull) {
    const catRes = await chrome.tabs
      .sendMessage(firstTabId, { action: "get_category_full" }, { frameId: 0 })
      .catch(() => null);
    bulkCategoryFull = catRes?.categoryFull || "";
    console.log("[LISTIFY BG] Category:", bulkCategoryFull);
  }

  // ── Step 1: Open all tabs sequentially (Chrome rejects rapid parallel duplicates) ──
  // Row 1 uses current tab, rows 2+ duplicate the original tab
  const tabAssignments = [];

  // Mark firstTabId as driver immediately so onUpdated skips it
  // Also store firstTabId separately so stop handler knows not to close it
  await chrome.storage.local.set({
    listify_bulk_driver_tabs: [firstTabId],
    listify_bulk_first_tab_id: firstTabId,
  });

  for (let i = 0; i < queue.length; i++) {
    if (i === 0 && firstTabId) {
      tabAssignments.push({ tabId: firstTabId, row: queue[i], isFirst: true });
      console.log(`[LISTIFY BG] Row 1 → current tab ${firstTabId}`);
    } else {
      const tab = await chrome.tabs.duplicate(firstTabId);
      tabAssignments.push({ tabId: tab.id, row: queue[i], isFirst: false });
      console.log(`[LISTIFY BG] Row ${i + 1} → new tab ${tab.id}`);

      // Add new tab to driver list immediately so onUpdated skips it
      const driverIds = tabAssignments.map((t) => t.tabId);
      await chrome.storage.local.set({ listify_bulk_driver_tabs: driverIds });
    }
  }

  // ── Step 2: Wait for all new tabs to load ──
  await Promise.all(
    tabAssignments.map(({ tabId, isFirst }) => {
      if (isFirst) return Promise.resolve();
      return waitForTabLoad(tabId);
    }),
  );

  if (_bulkFillAborted) {
    console.log("[LISTIFY BG] Bulk fill aborted after tab load.");
    return;
  }

  // Wait for React to mount
  await new Promise((r) => setTimeout(r, 3000));

  if (_bulkFillAborted) {
    console.log("[LISTIFY BG] Bulk fill aborted after React wait.");
    return;
  }

  // ── Step 3: Inject content scripts into all tabs ──
  await Promise.all(
    tabAssignments.map(({ tabId }) =>
      chrome.scripting
        .executeScript({
          target: { tabId, allFrames: true },
          files: ["content-script.js"],
        })
        .catch(() => {}),
    ),
  );

  if (_bulkFillAborted) {
    console.log("[LISTIFY BG] Bulk fill aborted after script inject.");
    return;
  }

  // ── Step 4: Click "Add Single Catalog" on all new tabs ──
  await Promise.all(
    tabAssignments
      .filter((t) => !t.isFirst)
      .map(({ tabId }) =>
        chrome.tabs
          .sendMessage(tabId, { action: "fk_click_add_single" }, { frameId: 0 })
          .catch(() => {}),
      ),
  );

  if (_bulkFillAborted) {
    console.log("[LISTIFY BG] Bulk fill aborted after add-single click.");
    return;
  }

  // ── Step 5: Setup all tabs in parallel (category → image) ──
  await Promise.all(
    tabAssignments
      .filter((t) => !t.isFirst)
      .map(({ tabId, row }) =>
        chrome.tabs
          .sendMessage(
            tabId,
            {
              action: "meesho_setup_catalog",
              categoryFull: bulkCategoryFull || row.categoryFull || "",
              imageUrl: row.imageUrl || row.image_url || "",
            },
            { frameId: 0 },
          )
          .catch(() => {}),
      ),
  );

  if (_bulkFillAborted) {
    console.log("[LISTIFY BG] Bulk fill aborted after catalog setup.");
    return;
  }

  // ── Step 6: Click Continue on all new tabs ──
  await Promise.all(
    tabAssignments
      .filter((t) => !t.isFirst)
      .map(({ tabId }) =>
        chrome.tabs
          .sendMessage(
            tabId,
            { action: "meesho_click_continue" },
            { frameId: 0 },
          )
          .catch(() => {}),
      ),
  );

  // Wait for all forms to render
  await new Promise((r) => setTimeout(r, 3000));

  if (_bulkFillAborted) {
    console.log("[LISTIFY BG] Bulk fill aborted before fill.");
    return;
  }

  let completedFills = 0;
  // ── Step 7: Fill all tabs in parallel using assigned row data ──
  const fillResults = await Promise.all(
    tabAssignments.map(async ({ tabId, row }) => {
      const result = await chrome.tabs
        .sendMessage(
          tabId,
          { action: "bulk_fill_row", rowData: row },
          { frameId: 0 },
        )
        .catch((e) => ({ ok: false, error: e.message }));
      completedFills++;
      await chrome.storage.local.set({ listify_bulk_index: completedFills });
      return result;
    })
  );
  console.log("[LISTIFY BG] Fill results:", fillResults);

  // Wait for React to register values
  await new Promise((r) => setTimeout(r, 1500));

  // ── Step 8: Save all tabs in parallel ──
  await Promise.all(
    tabAssignments.map(({ tabId }) =>
      chrome.tabs
        .sendMessage(tabId, { action: "bulk_auto_save" }, { frameId: 0 })
        .catch(() => {}),
    ),
  );

  // Update progress
  await chrome.storage.local.set({ listify_bulk_index: queue.length });

  // ── Record bulk fill usage in backend ──
  const rowResults = fillResults.map((r, i) => ({
    index: i + 1,
    status: r?.ok !== false ? "success" : "failed",
    error: r?.error || null,
  }));
  const successCount = rowResults.filter((r) => r.status === "success").length;
  console.log(
    `[LISTIFY BG] Fill results — success: ${successCount}, failed: ${rowResults.length - successCount}`,
  );

  const { listify_token, listify_bulk_template_id } =
    await chrome.storage.local.get([
      "listify_token",
      "listify_bulk_template_id",
    ]);
  console.log(
    `[LISTIFY BG] bulk-use check — token: ${listify_token ? "present" : "MISSING"}, templateId: ${listify_bulk_template_id || "MISSING"}, successCount: ${successCount}`,
  );

  if (listify_token && listify_bulk_template_id && successCount > 0) {
    const bulkUseUrl = `${API_URL}/${listify_bulk_template_id}/bulk-use`;
    console.log(
      `[LISTIFY BG] Calling bulk-use API: POST ${bulkUseUrl} count=${successCount}`,
    );
    try {
      const res = await fetch(bulkUseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${listify_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count: successCount }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(
          `[LISTIFY BG] bulk-use SUCCESS — fillsUsed now: ${data.fillsUsed}, usageCount: ${data.usageCount}`,
        );
      } else {
        console.error(
          `[LISTIFY BG] bulk-use FAILED — HTTP ${res.status}:`,
          data,
        );
      }
    } catch (err) {
      console.error("[LISTIFY BG] bulk-use FETCH ERROR:", err);
    }
  } else {
    if (!listify_token)
      console.warn("[LISTIFY BG] bulk-use skipped — no auth token in storage");
    if (!listify_bulk_template_id)
      console.warn("[LISTIFY BG] bulk-use skipped — no template ID in storage");
    if (successCount === 0)
      console.warn("[LISTIFY BG] bulk-use skipped — successCount is 0");
  }

  // ── Notify dashboard bulk-fill page ──
  const allTabs = await chrome.tabs.query({}).catch(() => []);
  console.log(
    `[LISTIFY BG] All open tabs (${allTabs.length}):`,
    allTabs.map((t) => `[${t.id}] ${t.url}`),
  );
  const dashboardTabs = await chrome.tabs
    .query({
      url: [
        "*://aplusstudio.iprixmedia.com/dashboard*",
        "*://iprixmedia.com/dashboard*",
        "*://localhost:*/dashboard*",
        "*://127.0.0.1:*/dashboard*",
      ],
    })
    .catch(() => []);
  
  for (const dashboardTab of dashboardTabs) {
    chrome.tabs
      .sendMessage(dashboardTab.id, {
        source: "lisstify-extension",
        type: "BULK_FILL_DONE",
        total: queue.length,
        successCount,
        results: rowResults,
      })
      .then(() => {
        console.log(`[LISTIFY BG] BULK_FILL_DONE sent to dashboard tab ${dashboardTab.id}`);
      })
      .catch((err) => {
        // Ignore inactive tabs
      });
  }

  // All done — clear queue immediately so no new bulk triggers fire
  await chrome.storage.local.remove([
    "listify_bulk_active",
    "listify_bulk_queue",
    "listify_bulk_index",
    "listify_bulk_total",
    "listify_bulk_template_id",
    "listify_bulk_template_url",
  ]);
  // Keep listify_bulk_driver_tabs alive for 15s so the post-save redirect
  // ("Add Single Catalog" page load) is suppressed by the driver tab check.
  setTimeout(() => {
    chrome.storage.local.remove(["listify_bulk_driver_tabs"]);
  }, 15000);
  console.log(
    "[LISTIFY BG] Parallel bulk fill complete — all tabs left open for review.",
  );
}
chrome.tabs.onRemoved.addListener((tabId) => {
  filledTabIds.delete(tabId);
  chrome.storage.local.remove([`listify_cat_${tabId}`]);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // New page load — reset filled status. Per-tab category is kept so that
  // post-category-click navigation doesn't race-clear the just-saved category.
  // Category is only cleared on "Add Single Catalog" click or back/cancel.
  if (changeInfo.status === "loading") {
    filledTabIds.delete(tabId);
    return;
  }

  if (changeInfo.status !== "complete" && !changeInfo.url) return;
  if (!tab.url) return;

  // Only run on the active tab in the focused window
  if (!tab.active) return;
  const win = await chrome.windows.get(tab.windowId).catch(() => null);
  if (!win || !win.focused) return;

  const url = tab.url;
  if (
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("chrome-extension://")
  )
    return;

  // For Flipkart seller, only auto-fill on the Add Single Listing form page (must have ?brand= param)
  if (url.includes("seller.flipkart.com") && !url.includes("dashboard/addListings/single?brand=")) return;

  const stored = await chrome.storage.local.get([
    "listify_autofill_enabled",
    "listify_token",
    `listify_cat_${tabId}`,
  ]);

  // Global toggle: default is ON, only skip if explicitly set to false
  if (stored.listify_autofill_enabled === false) return;

  const token = stored.listify_token;
  if (!token) return;

  // ── BULK FILL AUTO-TRIGGER ──
  // If a bulk queue is active, skip regular template matching and auto-fill the next row
  try {
    const bulk = await chrome.storage.local.get([
      "listify_bulk_active",
      "listify_bulk_index",
      "listify_bulk_total",
      "listify_bulk_template_url",
      "listify_bulk_driver_tabs",
    ]);

    // Skip if this tab was opened by runBulkFillTabs — background.js manages it directly
    const driverTabs = bulk.listify_bulk_driver_tabs || [];
    if (driverTabs.includes(tabId)) {
      return;
    }

    const bulkRemaining =
      (bulk.listify_bulk_total ?? 0) - (bulk.listify_bulk_index ?? 0);
    if (bulk.listify_bulk_active && bulkRemaining > 0) {
      const tmplUrl = bulk.listify_bulk_template_url || "";

      // Safe URL parse — template URL must be a full valid URL (http/https)
      let tmplHost = "",
        tmplPath = "";
      try {
        if (
          tmplUrl &&
          (tmplUrl.startsWith("http://") || tmplUrl.startsWith("https://"))
        ) {
          const parsed = new URL(tmplUrl);
          tmplHost = parsed.hostname;
          tmplPath = parsed.pathname.replace(/\/$/, "");
        }
      } catch (_) {}

      const curHost = new URL(url).hostname;
      const curPath = new URL(url).pathname.replace(/\/$/, "");

      // Match if on the same domain (or sub-domain) as the template
      const domainMatches =
        !tmplHost || curHost === tmplHost || curHost.endsWith("." + tmplHost);

      if (domainMatches) {
        // If Meesho redirected away from the form page, navigate back to it
        if (tmplPath && !curPath.startsWith(tmplPath)) {
          console.log(
            `[LISTIFY BG] Bulk fill: wrong page (${curPath}), navigating to form (${tmplPath})`,
          );
          chrome.tabs.update(tabId, { url: tmplUrl });
          return; // onUpdated fires again when form page loads
        }

        // On the correct form page — wait for React/MUI to fully mount, then fill
        await new Promise((r) => setTimeout(r, 4000));
        await chrome.scripting
          .executeScript({
            target: { tabId, allFrames: true },
            files: ["content-script.js"],
          })
          .catch(() => {});
        chrome.tabs.sendMessage(
          tabId,
          { action: "bulk_fill_next" },
          { frameId: 0 },
          async (res) => {
            if (chrome.runtime.lastError) {
              console.warn(
                "[LISTIFY BG] bulk_fill_next error:",
                chrome.runtime.lastError.message,
              );
              return;
            }
            console.log(
              "[LISTIFY BG] Bulk auto-fill row",
              (bulk.listify_bulk_index ?? 0) + 1,
              res,
            );

            // ── Record usage for the auto-filled row ──
            const templateId = res?.templateId || bulk.listify_bulk_template_id;
            if (token && templateId && res?.ok) {
              fetch(`${API_URL}/${templateId}/use`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }).catch(() => {});
              
              // Notify dashboard to refresh counters
              chrome.runtime.sendMessage({ action: "refresh_dashboard_stats" });
            }
          },
        );
        return; // skip regular template matching
      }
    }
  } catch (bulkErr) {
    console.warn("[LISTIFY BG] Bulk trigger error:", bulkErr.message);
  }

  try {
    const domain = new URL(url).hostname;

    const res = await fetch(
      `${API_URL}?url=${encodeURIComponent(domain)}&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) return;

    const data = await res.json();
    const templates = Array.isArray(data) ? data : data.templates || [];

    if (templates.length === 0) return;

    if (data.canAutoFill === false) return;

    // Check fill limit before attempting auto-fill on page load
    const fillsUsed = data.fillsUsed ?? 0;
    const fillLimit = data.fillLimit ?? -1;
    if (fillLimit !== -1 && fillsUsed >= fillLimit) {
      chrome.tabs
        .sendMessage(
          tabId,
          {
            action: "show_toast",
            message: `You've used all ${fillLimit} form fills this month. Upgrade to continue autofilling.`,
            toastType: "warning",
          },
          { frameId: 0 },
        )
        .catch(() => {});
      return;
    }

    // Inject content script (no-op if already present due to window.__listifyCS guard)
    await chrome.scripting
      .executeScript({
        target: { tabId, allFrames: true },
        files: ["content-script.js"],
      })
      .catch(() => {});

    // Wait longer on first load — React/MUI needs time to mount click handlers.
    // Without this, element.click() fires before MUI event listeners are attached
    // and dropdowns silently fail to open.
    await new Promise((r) => setTimeout(r, 3000));

    // Pre-scan: only auto-fill if this page actually has a form.
    // Flipkart addListings pages are exempt — sections are collapsed by default so
    // scan_form always returns < 5 fields even on the correct form page.
    const isFlipkartListing = url.includes("seller.flipkart.com") && url.includes("dashboard/addListings/single?brand=");
    if (!isFlipkartListing) {
      try {
        const scanRes = await chrome.tabs.sendMessage(
          tabId,
          { action: "scan_form" },
          { frameId: 0 },
        );
        const fieldCount = scanRes?.data?.fields?.length ?? 0;
        if (fieldCount < 5) return;
      } catch (_) {
        return; // can't reach content script — not a form page
      }
    }

    let actualCat = "";
    try {
      const domCatRes = await chrome.tabs.sendMessage(
        tabId,
        { action: "get_tab_category_dom" },
        { frameId: 0 },
      );
      if (domCatRes?.category)
        actualCat = domCatRes.category.toLowerCase().trim();
    } catch (_) {}

    // Re-read category after the delay — fk-category.js may have saved it during the wait
    const freshCat = await chrome.storage.local.get([`listify_cat_${tabId}`]);
    const trackedCat =
      (freshCat[`listify_cat_${tabId}`] || stored[`listify_cat_${tabId}`] || "").toLowerCase().trim() || actualCat;
    let template = null;
    const markedTemplates = templates.filter((t) => t.autoFill === true);

    if (trackedCat) {
      template = markedTemplates.find(
        (t) => t.category && t.category.toLowerCase().trim() === trackedCat,
      );
    }

    if (!template && !trackedCat && markedTemplates.length > 0) {
      template = markedTemplates[0];
    }

    if (!template) return;

    // Flipkart uses fk_autofill (opens collapsed sections); other sites use fill_form
    const fillAction = isFlipkartListing ? "fk_autofill" : "fill_form";
    const fillPayload = isFlipkartListing
      ? { action: fillAction, template }
      : { action: fillAction, data: template };

    const fillAndRecord = async () => {
      const response = await chrome.tabs.sendMessage(
        tabId,
        fillPayload,
        { frameId: 0 },
      );
      if (response?.success) {
        fetch(`${API_URL}/${template._id}/use`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch(() => {});
        // Ensure FABs become visible after fill by writing the category back per-tab
        if (template.category) {
          chrome.storage.local.set({
            [`listify_cat_${tabId}`]: template.category,
          });
        }
      }
      return response;
    };

    try {
      const response = await fillAndRecord();

      if (!response?.success) return;

      filledTabIds.add(tabId); // mark so onActivated doesn't re-fill
      const missed =
        (response.optionNotFoundCount || 0) + (response.notFoundCount || 0);
      console.log(
        `[LISTIFY BG] Auto-filled "${template.name}" on ${domain} — ${response.filledCount} filled, ${missed} missed`,
      );

      // Show toast on the page after first fill
      const fillMsg =
        missed > 0
          ? `Auto-filled ${response.filledCount} field(s) · ${missed} missed`
          : `Auto-filled ${response.filledCount} field(s) ✓`;
      chrome.tabs
        .sendMessage(
          tabId,
          {
            action: "show_toast",
            message: fillMsg,
            toastType: missed > 0 ? "warning" : "success",
          },
          { frameId: 0 },
        )
        .catch(() => {});

      // Retry once for any dropdowns that failed to open on first pass.
      // MUI dropdowns sometimes need a second attempt after the page has settled.
      if (missed > 0 && !isFlipkartListing) {
        console.log(`[LISTIFY BG] Retrying ${missed} missed field(s) in 3s…`);
        await new Promise((r) => setTimeout(r, 3000));
        const retry = await chrome.tabs
          .sendMessage(
            tabId,
            fillPayload,
            { frameId: 0 },
          )
          .catch(() => null);

        if (retry?.success) {
          console.log(
            `[LISTIFY BG] Retry filled ${retry.filledCount} more field(s)`,
          );
          // Update toast with retry result
          const retryMissed =
            (retry.optionNotFoundCount || 0) + (retry.notFoundCount || 0);
          chrome.tabs
            .sendMessage(
              tabId,
              {
                action: "show_toast",
                message:
                  retryMissed > 0
                    ? `Filled ${retry.filledCount} more · ${retryMissed} still missing`
                    : `All fields filled ✓`,
                toastType: retryMissed > 0 ? "warning" : "success",
              },
              { frameId: 0 },
            )
            .catch(() => {});
        }
      }
    } catch (msgErr) {
      console.warn(
        "[LISTIFY BG] Could not reach content script:",
        msgErr.message,
      );
    }
  } catch (e) {
    console.error("[LISTIFY BG] Auto-fill error:", e);
  }
});

// Auto-fill when user switches to a tab that hasn't been filled yet.
// Handles duplicated tabs (opened in background, then activated) and
// tabs that were loading when onUpdated fired but weren't active.
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  if (filledTabIds.has(tabId)) return; // already filled this page load

  let tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch {
    return;
  }

  if (!tab.url) return;
  if (
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("edge://") ||
    tab.url.startsWith("about:") ||
    tab.url.startsWith("chrome-extension://")
  )
    return;

  // For Flipkart seller, only auto-fill on the Add Single Listing form page (must have ?brand= param)
  if (tab.url.includes("seller.flipkart.com") && !tab.url.includes("dashboard/addListings/single?brand=")) return;

  const stored = await chrome.storage.local.get([
    "listify_autofill_enabled",
    "listify_token",
    `listify_cat_${tabId}`,
  ]);
  if (stored.listify_autofill_enabled === false) return;
  const token = stored.listify_token;
  if (!token) return;

  try {
    const domain = new URL(tab.url).hostname;
    const res = await fetch(
      `${API_URL}?url=${encodeURIComponent(domain)}&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) return;
    const data = await res.json();
    const templates = Array.isArray(data) ? data : data.templates || [];
    if (templates.length === 0) return;

    if (data.canAutoFill === false) return;

    const fillsUsed = data.fillsUsed ?? 0;
    const fillLimit = data.fillLimit ?? -1;
    if (fillLimit !== -1 && fillsUsed >= fillLimit) return;

    await chrome.scripting
      .executeScript({
        target: { tabId, allFrames: true },
        files: ["content-script.js"],
      })
      .catch(() => {});

    // Page is already loaded (user just switched to it) — short wait for React
    await new Promise((r) => setTimeout(r, 1500));

    const isFlipkartListing2 = tab.url.includes("seller.flipkart.com") && tab.url.includes("dashboard/addListings/single?brand=");
    if (!isFlipkartListing2) {
      try {
        const scanRes = await chrome.tabs.sendMessage(
          tabId,
          { action: "scan_form" },
          { frameId: 0 },
        );
        const fieldCount = scanRes?.data?.fields?.length ?? 0;
        if (fieldCount < 5) return;
      } catch {
        return;
      }
    }

    let actualCat = "";
    try {
      const domCatRes = await chrome.tabs.sendMessage(
        tabId,
        { action: "get_tab_category_dom" },
        { frameId: 0 },
      );
      if (domCatRes?.category)
        actualCat = domCatRes.category.toLowerCase().trim();
    } catch {}

    // Re-read category after the delay — fk-category.js may have saved it during the wait
    const freshCat2 = await chrome.storage.local.get([`listify_cat_${tabId}`]);
    const trackedCat =
      (freshCat2[`listify_cat_${tabId}`] || stored[`listify_cat_${tabId}`] || "").toLowerCase().trim() || actualCat;
    const markedTemplates = templates.filter((t) => t.autoFill === true);
    let template = null;
    if (trackedCat) {
      template = markedTemplates.find(
        (t) => t.category && t.category.toLowerCase().trim() === trackedCat,
      );
    }
    if (!template && !trackedCat && markedTemplates.length > 0) {
      template = markedTemplates[0];
    }
    if (!template) return;

    // Flipkart uses fk_autofill (opens collapsed sections); other sites use fill_form
    const fillAction2 = isFlipkartListing2 ? "fk_autofill" : "fill_form";
    const fillPayload2 = isFlipkartListing2
      ? { action: fillAction2, template }
      : { action: fillAction2, data: template };

    const response = await chrome.tabs.sendMessage(
      tabId,
      fillPayload2,
      { frameId: 0 },
    );
    if (response?.success) {
      filledTabIds.add(tabId);
      fetch(`${API_URL}/${template._id}/use`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch(() => {});
      const missed =
        (response.optionNotFoundCount || 0) + (response.notFoundCount || 0);
      chrome.tabs
        .sendMessage(
          tabId,
          {
            action: "show_toast",
            message:
              missed > 0
                ? `Auto-filled ${response.filledCount} field(s) · ${missed} missed`
                : `Auto-filled ${response.filledCount} field(s) ✓`,
            toastType: missed > 0 ? "warning" : "success",
          },
          { frameId: 0 },
        )
        .catch(() => {});
    }
  } catch (e) {
    console.warn("[LISTIFY BG] onActivated auto-fill error:", e.message);
  }
});

// Handle save_template and trigger_autofill from content scripts.
// Doing fetches here (in the background) bypasses any CSP on the host page.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "trigger_autofill") {
    (async () => {
      try {
        // For auto-triggered fills (onChanged), only allow the active tab in the focused window.
        // This prevents all duplicate Meesho tabs/windows from filling simultaneously.
        if (msg.autoTriggered && _sender?.tab) {
          const [activeTab] = await chrome.tabs
            .query({ active: true, lastFocusedWindow: true })
            .catch(() => [null]);
          if (activeTab && activeTab.id !== _sender.tab.id) {
            sendResponse({ ok: false, error: "not_active_tab" });
            return;
          }
        }

        const tabId = _sender?.tab?.id;
        const stored = await chrome.storage.local.get(
          ["listify_token", tabId ? `listify_cat_${tabId}` : null].filter(
            Boolean,
          ),
        );
        if (!stored.listify_token) {
          sendResponse({
            ok: false,
            error: "Not signed in — open the A+ Studio popup first.",
          });
          return;
        }

        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tab) {
          sendResponse({ ok: false, error: "No active tab." });
          return;
        }

        const domain = new URL(tab.url).hostname;
        const res = await fetch(
          `${API_URL}?url=${encodeURIComponent(domain)}&limit=50`,
          {
            headers: { Authorization: `Bearer ${stored.listify_token}` },
          },
        );
        if (!res.ok) {
          sendResponse({ ok: false, error: `Server error ${res.status}` });
          return;
        }

        const data = await res.json();
        const templates = Array.isArray(data) ? data : data.templates || [];
        if (templates.length === 0) {
          sendResponse({
            ok: false,
            error: "No saved templates for this page.",
          });
          return;
        }

        const fillsUsed = data.fillsUsed ?? 0;
        const fillLimit = data.fillLimit ?? -1;
        if (fillLimit !== -1 && fillsUsed >= fillLimit) {
          sendResponse({
            ok: false,
            error: "fill_limit_exceeded",
            fillsUsed,
            fillLimit,
          });
          return;
        }

        // Pick the template that matches the tracked category.
        // Priority: 1. Per-tab chrome.storage (listify_cat_<tabId>) 2. DOM detection fallback
        const perTabCat = (tabId ? stored[`listify_cat_${tabId}`] || "" : "")
          .toLowerCase()
          .trim();
        const cat = perTabCat || (msg.domCategory || "").toLowerCase().trim();
        let template = null;
        const markedTemplates = templates.filter((t) => t.autoFill);

        if (cat) {
          // Category is known — only fill if an exact match exists, no fallback to wrong template
          template = markedTemplates.find(
            (t) => t.category && t.category.toLowerCase().trim() === cat,
          );
          if (!template) {
            template = templates.find(
              (t) => t.category && t.category.toLowerCase().trim() === cat,
            );
          }
          if (!template) {
            // Category detected but no template matches → warn, don't fill wrong data
            sendResponse({
              ok: false,
              error: "no_category_match",
              category: cat,
            });
            return;
          }
        } else {
          // No category context → use first marked/available template as best guess
          if (markedTemplates.length > 0) template = markedTemplates[0];
          else if (templates.length === 1) template = templates[0];
        }

        if (!template) {
          sendResponse({ ok: false, error: "no_category_match", category: "" });
          return;
        }

        sendResponse({
          ok: true,
          template: template,
          category: perTabCat || template.category || template.name,
        });
      } catch (e) {
        sendResponse({ ok: false, error: e.message || "Error" });
      }
    })();
    return true;
  }

  if (msg.action === "fk_trigger_autofill_fk") {
    (async () => {
      try {
        if (msg.autoTriggered && _sender?.tab) {
          const [activeTab] = await chrome.tabs
            .query({ active: true, lastFocusedWindow: true })
            .catch(() => [null]);
          if (activeTab && activeTab.id !== _sender.tab.id) {
            sendResponse({ ok: false, error: "not_active_tab" });
            return;
          }
        }

        const tabId = _sender?.tab?.id;
        const stored = await chrome.storage.local.get(
          ["listify_token", tabId ? `listify_cat_${tabId}` : null].filter(Boolean),
        );
        if (!stored.listify_token) {
          sendResponse({ ok: false, error: "Not signed in — open the A+ Studio popup first." });
          return;
        }

        const res = await fetch(
          `${BASE_URL}/api/flipkart/templates?url=${encodeURIComponent("seller.flipkart.com")}&limit=50`,
          { headers: { Authorization: `Bearer ${stored.listify_token}` } },
        );
        if (!res.ok) {
          sendResponse({ ok: false, error: `Server error ${res.status}` });
          return;
        }
        const data = await res.json();
        const templates = Array.isArray(data) ? data : data.templates || [];
        console.log(`[LISTIFY BG FK] Templates fetched: ${templates.length} — names: ${templates.map(t => t.name || t.category).join(', ')}`);
        if (templates.length === 0) {
          console.warn('[LISTIFY BG FK] No templates found for this seller account');
          sendResponse({ ok: false, error: "no_match" });
          return;
        }

        const perTabCat = (tabId ? stored[`listify_cat_${tabId}`] || "" : "").toLowerCase().trim();
        const cat = perTabCat || (msg.domCategory || "").toLowerCase().trim();
        console.log(`[LISTIFY BG FK] Category lookup — perTab="${perTabCat}" dom="${(msg.domCategory || '').toLowerCase().trim()}" → using="${cat}"`);
        let template = null;
        if (cat) {
          template = templates.find(
            (t) => t.category && t.category.toLowerCase().trim() === cat,
          );
          if (!template) {
            console.warn(`[LISTIFY BG FK] No template matched category="${cat}" — available: ${templates.map(t => t.category || t.name).join(', ')}`);
            sendResponse({ ok: false, error: "no_match", category: cat });
            return;
          }
        } else if (templates.length === 1) {
          template = templates[0];
        }

        if (!template) {
          console.warn(`[LISTIFY BG FK] No template selected (cat empty, ${templates.length} templates) — available: ${templates.map(t => t.category || t.name).join(', ')}`);
          sendResponse({ ok: false, error: "no_match", category: "" });
          return;
        }

        const fieldCount = (template.fields?.length || 0) + (template.sections?.reduce((s, sec) => s + (sec.fields?.length || 0), 0) || 0);
        console.log(`[LISTIFY BG FK] ✅ Template matched: "${template.name}" category="${template.category}" fields≈${fieldCount}`);
        sendResponse({
          ok: true,
          template,
          category: perTabCat || template.category || template.name,
        });
      } catch (e) {
        console.error('[LISTIFY BG FK] fk_trigger_autofill_fk error:', e.message, e.stack?.slice(0, 300));
        sendResponse({ ok: false, error: e.message || "Error" });
      }
    })();
    return true;
  }

  if (msg.action === "get_my_tab_category") {
    const tabId = _sender?.tab?.id;
    (async () => {
      const keys = tabId
        ? [`listify_cat_${tabId}`, `listify_vertical_${tabId}`, `listify_brand_${tabId}`]
        : [];
      const stored = keys.length ? await chrome.storage.local.get(keys) : {};
      sendResponse({
        category: (tabId ? stored[`listify_cat_${tabId}`] : "") || "",
        vertical: (tabId ? stored[`listify_vertical_${tabId}`] : "") || "",
        brand:    (tabId ? stored[`listify_brand_${tabId}`] : "") || "",
      });
    })();
    return true;
  }

  if (msg.action === "save_tab_category") {
    const tabId = _sender?.tab?.id;
    if (tabId && msg.category) {
      chrome.storage.local.set({ [`listify_cat_${tabId}`]: msg.category });
    }
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === "save_tab_vertical_brand") {
    const tabId = _sender?.tab?.id;
    if (tabId) {
      const data = {};
      if (msg.vertical) data[`listify_vertical_${tabId}`] = msg.vertical;
      if (msg.brand) data[`listify_brand_${tabId}`] = msg.brand;
      if (Object.keys(data).length) chrome.storage.local.set(data);
    }
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === "get_tab_id") {
    sendResponse({ tabId: _sender?.tab?.id || null });
    return false;
  }

  if (msg.action === "get_listify_token_status") {
    chrome.storage.local.get("listify_token", (stored) => {
      sendResponse({ hasToken: !!stored?.listify_token });
    });
    return true;
  }

  // ── FK buffer — storage routed through background because content scripts
  //    in cross-origin iframes cannot access chrome.storage.session directly ──

  if (msg.action === "fk_save_field") {
    const { storKey, field } = msg;
    if (!storKey || !field) {
      sendResponse({ ok: false });
      return false;
    }
    // Never save Flipkart nav menu fields (Log Out, Switch Account, etc.)
    if (field.id && field.id.startsWith("checkMarkOption_")) {
      sendResponse({ ok: false });
      return false;
    }
    chrome.storage.session.get([storKey], (stored) => {
      const buf = stored[storKey] || { fields: {}, sections: {} };
      const key = field._key;
      const sec = field._section;
      const old = buf.fields[key];
      if (old?._section && old._section !== sec) {
        if (buf.sections[old._section]) delete buf.sections[old._section][key];
      }
      buf.fields[key] = field;
      if (!buf.sections[sec]) buf.sections[sec] = {};
      buf.sections[sec][key] = field;
      chrome.storage.session.set({ [storKey]: buf }, () => {
        const fc = Object.keys(buf.fields).length;
        const sc = Object.keys(buf.sections).filter(
          (t) => Object.keys(buf.sections[t]).length > 0,
        ).length;
        // Show badge on extension icon so user sees count without opening popup
        const tabId = _sender?.tab?.id;
        if (tabId && chrome.action) {
          try {
            chrome.action.setBadgeBackgroundColor({ color: "#16a34a", tabId });
            chrome.action.setBadgeText({ text: String(fc), tabId });
          } catch (_) {}
        }
        sendResponse({ ok: true, fieldCount: fc, sectionCount: sc });
      });
    });
    return true; // async
  }

  if (msg.action === "fk_clear_buffer") {
    // msg.tabId set when called from popup; _sender.tab.id when called from content script
    const tabId = msg.tabId || _sender?.tab?.id;
    const storKey = tabId ? `fk_buffer_${tabId}` : null;
    if (storKey) {
      chrome.storage.session.remove([storKey], () => {
        console.log("[FK BG] Buffer cleared:", storKey);
        if (tabId && chrome.action) {
          try { chrome.action.setBadgeText({ text: "", tabId }); } catch (_) {}
        }
        sendResponse({ ok: true });
      });
    } else {
      sendResponse({ ok: true });
    }
    return true;
  }

  if (msg.action === "fk_get_buffer") {
    const tabId = msg.tabId || _sender?.tab?.id;
    if (!tabId) {
      sendResponse({ ok: false, buf: { fields: {}, sections: {} } });
      return false;
    }
    const storKey = `fk_buffer_${tabId}`;
    chrome.storage.session.get([storKey], (stored) => {
      sendResponse({ ok: true, buf: stored[storKey] || { fields: {}, sections: {} } });
    });
    return true;
  }

  // Fetch a Flipkart CDN (or any) image URL from the background context.
  // Content scripts CAN fetch CDN URLs directly when host_permissions cover them,
  // but we proxy through bg for symmetry + to centralize errors.
  if (msg.action === "fk_fetch_image") {
    (async () => {
      try {
        const { url } = msg;
        if (!url) return sendResponse({ ok: false, error: "no url" });
        const res = await fetch(url);
        if (!res.ok) return sendResponse({ ok: false, error: `HTTP ${res.status}` });
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onload = () => sendResponse({ ok: true, dataUrl: reader.result, type: blob.type, bytes: blob.size });
        reader.onerror = () => sendResponse({ ok: false, error: "read failed" });
        reader.readAsDataURL(blob);
      } catch (e) {
        sendResponse({ ok: false, error: e.message || String(e) });
      }
    })();
    return true;
  }

  // ── fetch_lisstify_generations — gets image history from the Meesho image API ──
  if (msg.action === "fetch_lisstify_generations") {
    (async () => {
      try {
        let { listify_token } = await chrome.storage.local.get(["listify_token"]);

        // Fallback: pull token directly from an open Lisstify tab's localStorage
        // (covers the case where the user hasn't visited Lisstify since the token bridge was added)
        if (!listify_token) {
          try {
            const lisstifyTabs = await chrome.tabs.query({ url: ["https://aplusstudio.iprixmedia.com/*", "https://iprixmedia.com/*", "http://localhost:3000/*", "http://localhost/*"] });
            for (const tab of lisstifyTabs) {
              if (!tab.id) continue;
              const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => localStorage.getItem("listify_token"),
              }).catch(() => null);
              const token = results?.[0]?.result;
              if (token) {
                listify_token = token;
                await chrome.storage.local.set({ listify_token: token });
                break;
              }
            }
          } catch (_) {}
        }

        if (!listify_token) {
          sendResponse({ ok: false, error: "Not signed in" });
          return;
        }
        // Decode JWT payload to extract userId
        let userId = "";
        try {
          const payload = JSON.parse(atob(listify_token.split(".")[1]));
          userId = payload.id || payload.userId || payload._id || payload.sub || "";
        } catch (_) {}
        if (!userId) {
          sendResponse({ ok: false, error: "Could not determine user ID from token" });
          return;
        }
        const res = await fetch(
          `https://messho-images.picckie.com/generations?userId=${encodeURIComponent(userId)}`,
          { headers: { "x-api-key": "mk-imagify-2024" } },
        );
        if (!res.ok) {
          sendResponse({ ok: false, error: `API error ${res.status}` });
          return;
        }
        const data = await res.json();
        sendResponse({ ok: true, data });
      } catch (e) {
        sendResponse({ ok: false, error: e.message || String(e) });
      }
    })();
    return true;
  }

  // Inject fetch+XHR interceptor into the page's MAIN world (bypasses CSP).
  // Content script calls this because inline <script> injection is blocked by Meesho's CSP.
  if (msg.action === "inject_transfer_interceptor") {
    const tabId = _sender?.tab?.id;
    if (!tabId) { sendResponse({ ok: false, error: "no tab id" }); return true; }
    chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: function () {
        if (window.__listifyFetchPatched) {
          console.log("[LISTIFY-PAGE] already patched");
          return;
        }
        window.__listifyFetchPatched = true;

        // Patch fetch
        var _origFetch = window.fetch;
        window.fetch = async function () {
          var args = arguments;
          var url = typeof args[0] === "string" ? args[0] : ((args[0] && args[0].url) || "");
          var res = await _origFetch.apply(this, args);
          if (url.includes("getTransferPrice")) {
            console.log("[LISTIFY-PAGE] getTransferPrice via fetch, status:", res.status);
            res.clone().json().then(function (d) {
              console.log("[LISTIFY-PAGE] postMessage transferPrice:", d);
              window.postMessage({ __listify: "transferPrice", data: d }, "*");
            }).catch(function (e) { console.log("[LISTIFY-PAGE] fetch JSON error:", e); });
          }
          return res;
        };

        // Patch XHR (in case Meesho uses XMLHttpRequest)
        var _origOpen = XMLHttpRequest.prototype.open;
        var _origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function (method, url) {
          this.__listifyUrl = url || "";
          return _origOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function () {
          var self = this;
          if (self.__listifyUrl && self.__listifyUrl.includes("getTransferPrice")) {
            console.log("[LISTIFY-PAGE] getTransferPrice via XHR:", self.__listifyUrl);
            self.addEventListener("load", function () {
              try {
                var d = JSON.parse(self.responseText);
                console.log("[LISTIFY-PAGE] postMessage transferPrice (XHR):", d);
                window.postMessage({ __listify: "transferPrice", data: d }, "*");
              } catch (e) { console.log("[LISTIFY-PAGE] XHR JSON error:", e); }
            });
          }
          return _origSend.apply(this, arguments);
        };

        console.log("[LISTIFY-PAGE] fetch + XHR patched OK via scripting API");
      },
    }).then(() => {
      console.log("[LISTIFY BG] inject_transfer_interceptor OK for tab", tabId);
      sendResponse({ ok: true });
    }).catch((e) => {
      console.error("[LISTIFY BG] inject_transfer_interceptor FAILED:", e.message);
      sendResponse({ ok: false, error: e.message });
    });
    return true;
  }

  if (msg.action === "sync_website_shipping_costs") {
    (async () => {
      try {
        const lisstifyTabs = await chrome.tabs.query({
          url: ["https://aplusstudio.iprixmedia.com/*", "https://iprixmedia.com/*", "http://localhost:3000/*", "http://localhost/*"],
        });
        let websiteCosts = {};
        for (const tab of lisstifyTabs) {
          if (!tab.id) continue;
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              try {
                const raw = localStorage.getItem("listify_shipping_costs");
                return raw ? JSON.parse(raw) : null;
              } catch (_) { return null; }
            },
          }).catch(() => null);
          const costs = results?.[0]?.result;
          if (costs && typeof costs === "object" && !Array.isArray(costs)) {
            // Only keep valid numeric costs
            for (const [k, v] of Object.entries(costs)) {
              if (typeof v === "number" && isFinite(v)) websiteCosts[k] = v;
            }
            break;
          }
        }

        if (Object.keys(websiteCosts).length === 0) {
          sendResponse({ ok: true, synced: 0 });
          return;
        }

        // Merge into chrome.storage.local
        const stored = await chrome.storage.local.get(["listify_shipping_costs"]);
        const merged = { ...(stored.listify_shipping_costs || {}), ...websiteCosts };
        await chrome.storage.local.set({ listify_shipping_costs: merged });

        // Push to backend so they're persisted for future sessions
        const { listify_token } = await chrome.storage.local.get(["listify_token"]);
        if (listify_token) {
          await fetch(`${IMAGES_API_URL}/shipping-costs`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${listify_token}` },
            body: JSON.stringify({ costs: websiteCosts }),
          }).catch(() => {});
        }

        sendResponse({ ok: true, synced: Object.keys(websiteCosts).length });
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    })();
    return true;
  }

  if (msg.action === "save_shipping_costs") {
    (async () => {
      const { listify_token } = await chrome.storage.local.get(["listify_token"]);
      if (!listify_token) { sendResponse({ ok: false, error: "Not signed in" }); return; }
      try {
        const res = await fetch(`${IMAGES_API_URL}/shipping-costs`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${listify_token}` },
          body: JSON.stringify({ costs: msg.costs || {} }),
        });
        sendResponse(await res.json());
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    })();
    return true;
  }

  if (msg.action === "fetch_shipping_costs") {
    (async () => {
      const { listify_token } = await chrome.storage.local.get(["listify_token"]);
      if (!listify_token) { sendResponse({ ok: false, costs: {} }); return; }
      try {
        const res = await fetch(`${IMAGES_API_URL}/shipping-costs`, {
          headers: { Authorization: `Bearer ${listify_token}` },
        });
        const data = await res.json();
        if (data.ok && data.costs) {
          const stored = await chrome.storage.local.get(["listify_shipping_costs"]);
          const merged = { ...(stored.listify_shipping_costs || {}), ...data.costs };
          await chrome.storage.local.set({ listify_shipping_costs: merged });
        }
        sendResponse(data);
      } catch (e) {
        sendResponse({ ok: false, costs: {} });
      }
    })();
    return true;
  }

  if (msg.action === "fk_capture_all_sections") {
    const tabId = _sender?.tab?.id;
    if (!tabId) {
      sendResponse({ ok: false, error: "no tab id" });
      return false;
    }
    chrome.tabs.sendMessage(tabId, { action: "fk_capture_all_sections" }, (res) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(res || { ok: false });
      }
    });
    return true;
  }

  if (msg.action === "fk_get_section_order_bg") {
    const tabId = _sender?.tab?.id;
    if (!tabId) {
      sendResponse({ order: [] });
      return false;
    }
    chrome.tabs.sendMessage(tabId, { action: "fk_get_section_order" }, (res) => {
      sendResponse(res || { order: [] });
    });
    return true;
  }

  if (msg.action === "fk_save_template_bg") {
    (async () => {
      try {
        const { listify_token } = await chrome.storage.local.get(["listify_token"]);
        if (!listify_token) {
          sendResponse({ ok: false, error: "Not signed in — open the A+ Studio popup first." });
          return;
        }
        const res = await fetch(`${BASE_URL}/api/flipkart/templates`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${listify_token}`,
          },
          body: JSON.stringify(msg.payload),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          sendResponse({ ok: true, data });
        } else {
          const err = await res.json().catch(() => ({}));
          sendResponse({ ok: false, error: err.error || `Server error ${res.status}` });
        }
      } catch (e) {
        sendResponse({ ok: false, error: e.message || "Network error" });
      }
    })();
    return true;
  }

  if (msg.action === "get_tab_category_bg") {
    const tabId = _sender?.tab?.id;
    if (!tabId) {
      sendResponse({ category: "", vertical: "", brand: "" });
      return true;
    }
    const keys = [`listify_cat_${tabId}`, `listify_vertical_${tabId}`, `listify_brand_${tabId}`];
    chrome.storage.local.get(keys, (result) => {
      sendResponse({
        category: result[`listify_cat_${tabId}`] || "",
        vertical: result[`listify_vertical_${tabId}`] || "",
        brand:    result[`listify_brand_${tabId}`] || "",
      });
    });
    return true;
  }

  if (msg.action === "clear_tab_category") {
    const tabId = _sender?.tab?.id;
    if (tabId) chrome.storage.local.remove([`listify_cat_${tabId}`]);
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === "generate_image_start") {
    const { imageBase64, removeBg, addBorder, multiVariation, numVariations, stickers, category } = msg;
    sendResponse({ ok: true });
    (async () => {
      await chrome.storage.local.set({ listify_img_status: "generating" });
      try {
        const { listify_token } = await chrome.storage.local.get(["listify_token"]);
        if (!listify_token) throw new Error("Not signed in");

        const res = await fetch(`${BASE_URL}/api/images/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${listify_token}`,
          },
          body: JSON.stringify({
            imageBase64,
            removeBg:       !!removeBg,
            addBorder:      !!addBorder,
            multiVariation: !!multiVariation,
            numVariations:  numVariations || 5,
            stickers:       !!stickers,
            category:       category || "Other",
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

        await chrome.storage.local.set({ listify_img_status: "done", listify_img_count: data.count || 0 });
        console.log(`[LISTIFY BG] Image generation done — ${data.count} image(s) saved.`);
      } catch (e) {
        console.error("[LISTIFY BG] generate_image_start error:", e.message);
        await chrome.storage.local.set({ listify_img_status: "error", listify_img_error: e.message || "Generation failed" });
      }
    })();
    return false;
  }

  if (msg.action === "record_template_usage") {
    (async () => {
      try {
        // Mark the tab as filled so onActivated doesn't re-trigger autofill
        // on this page when the user switches away and back.
        if (_sender?.tab?.id) filledTabIds.add(_sender.tab.id);

        const { listify_token } = await chrome.storage.local.get([
          "listify_token",
        ]);
        if (listify_token && msg.templateId) {
          fetch(`${API_URL}/${msg.templateId}/use`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${listify_token}`,
              "Content-Type": "application/json",
            },
          }).catch(() => {});
        }
        sendResponse({ success: true });
      } catch (e) {
        sendResponse({ success: false });
      }
    })();
    return true;
  }

  if (msg.action === "refresh_dashboard_stats") {
    (async () => {
      // Small delay to ensure backend has finished processing the last row's use increment
      await new Promise(r => setTimeout(r, 1000));
      const dashboardTabs = await chrome.tabs.query({
        url: [
          "*://aplusstudio.iprixmedia.com/dashboard*",
          "*://iprixmedia.com/dashboard*",
          "*://localhost:*/dashboard*",
          "*://127.0.0.1:*/dashboard*",
        ],
      });
      for (const t of dashboardTabs) {
        chrome.tabs.sendMessage(t.id, {
          source: "lisstify-extension",
          type: "BULK_FILL_DONE",
        }).catch(() => {});
      }
    })();
    return true;
  }

  if (msg.action === "save_template") {
    (async () => {
      try {
        const { listify_token } = await chrome.storage.local.get([
          "listify_token",
        ]);
        if (!listify_token) {
          sendResponse({
            ok: false,
            error: "Not signed in — open the A+ Studio popup first.",
          });
          return;
        }
        const res = await fetch(`${BASE_URL}/api/templates`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${listify_token}`,
          },
          body: JSON.stringify(msg.payload),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          sendResponse({ ok: true, data });
        } else {
          const err = await res.json().catch(() => ({}));
          sendResponse({
            ok: false,
            error: err.error || `Server error ${res.status}`,
          });
        }
      } catch (e) {
        sendResponse({ ok: false, error: e.message || "Network error" });
      }
    })();
    return true; // keep message channel open for async response
  }
  if (msg.action === "ai_fill") {
    (async () => {
      try {
        const { listify_token } = await chrome.storage.local.get([
          "listify_token",
        ]);
        if (!listify_token) {
          sendResponse({
            success: false,
            error: "Please sign in to use AI Fill.",
          });
          return;
        }

        const res = await fetch(`${BASE_URL}/api/ai/fill`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${listify_token}`,
          },
          body: JSON.stringify({
            category: msg.category,
            fields: msg.fields,
            imageUrl: msg.imageUrl,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          sendResponse({
            success: false,
            error: err.error || `Server error ${res.status}`,
          });
          return;
        }
        const data = await res.json();
        sendResponse({ success: true, data: data.data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // ── BULK_START_NEW_TAB — popup triggers tab-based bulk fill ──
  if (msg.action === "bulk_start_new_tab") {
    (async () => {
      try {
        const stored = await chrome.storage.local.get([
          "listify_bulk_queue",
          "listify_bulk_template_url",
          "listify_token",
        ]);
        if (!stored.listify_token) {
          sendResponse({ ok: false, error: "Not signed in" });
          return;
        }
        if (!stored.listify_bulk_queue?.length) {
          sendResponse({ ok: false, error: "No queue found" });
          return;
        }
        sendResponse({ ok: true });
        // msg.firstTabId = the tab the user is already on (row 1 fills here)
        runBulkFillTabs(
          stored.listify_bulk_queue,
          stored.listify_bulk_template_url,
          msg.firstTabId || null,
        ).catch((e) => console.error("[LISTIFY BG] runBulkFillTabs error:", e));
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    })();
    return true;
  }

  // ── BULK_FILL_SET_QUEUE — save queue from dashboard to chrome.storage ──
  if (
    msg.type === "BULK_FILL_SET_QUEUE" &&
    msg.source === "lisstify-dashboard"
  ) {
    (async () => {
      await chrome.storage.local.set({
        listify_bulk_active: true,
        listify_bulk_queue: msg.rows,
        listify_bulk_index: 0,
        listify_bulk_total: msg.total,
        listify_bulk_template_id: msg.templateId,
        listify_bulk_template_url: msg.templateUrl,
      });
      sendResponse({ ok: true });
    })();
    return true;
  }

  // ── BULK_FILL_CLEAR_QUEUE — remove queue from chrome.storage ──
  if (
    msg.type === "BULK_FILL_CLEAR_QUEUE" &&
    msg.source === "lisstify-dashboard"
  ) {
    chrome.storage.local.remove([
      "listify_bulk_active",
      "listify_bulk_queue",
      "listify_bulk_index",
      "listify_bulk_total",
      "listify_bulk_template_id",
      "listify_bulk_template_url",
    ]);
    sendResponse({ ok: true });
    return false;
  }

  // ── BULK_FILL_STOP — user clicked Stop in popup sidebar ──
  if (msg.action === "bulk_fill_stop") {
    _bulkFillAborted = true;
    (async () => {
      try {
        const stored = await chrome.storage.local.get([
          "listify_bulk_driver_tabs",
          "listify_bulk_first_tab_id",
        ]);
        const driverTabs = stored.listify_bulk_driver_tabs || [];
        const firstTabId = stored.listify_bulk_first_tab_id || null;
        // Close all driver tabs except the original tab the user was on
        for (const tabId of driverTabs) {
          if (tabId !== firstTabId) {
            chrome.tabs.remove(tabId).catch(() => {});
          }
        }
      } catch (_) {}
      chrome.storage.local.remove([
        "listify_bulk_active",
        "listify_bulk_queue",
        "listify_bulk_index",
        "listify_bulk_total",
        "listify_bulk_template_id",
        "listify_bulk_template_url",
        "listify_bulk_driver_tabs",
        "listify_bulk_first_tab_id",
        "listify_bulk_driver_tab_id",
      ]);
      sendResponse({ ok: true });
    })();
    return true;
  }

  return false;
});
