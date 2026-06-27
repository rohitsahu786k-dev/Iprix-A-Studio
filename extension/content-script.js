(function () {
  // Guard: prevent double-injection, but allow re-injection when the
  // previous instance's extension context was invalidated (e.g. dev reload).
  // window.__listifyPing is a closure over the OLD chrome.runtime; calling it
  // throws "Extension context invalidated" once that context is torn down.
  if (window.__listifyCS) {
    let prevAlive = false;
    try { window.__listifyPing?.(); prevAlive = true; } catch (_) {}
    if (prevAlive) return; // previous instance still valid — don't double-inject
    // Previous context gone — remove stale sidebar so we rebuild it fresh.
    try { document.getElementById("__listify_sidebar__")?.remove(); } catch (_) {}
    try { document.getElementById("__listify_backdrop__")?.remove(); } catch (_) {}
  }
  window.__listifyCS = true;
  // Store a ping function closed over THIS instance's chrome.runtime.
  // It throws automatically when this context is later invalidated.
  window.__listifyPing = () => chrome.runtime.getURL("");

  // Abort flag — set to true by abort_fill message; reset at fillForm start.
  let _listifyAbortFill = false;

  console.log("Smart Autofill Content Script Loaded (v6.0)");

  // ── Token bridge: sync localStorage → chrome.storage.local ──
  // The A+ Studio frontend stores the JWT in localStorage. The background script
  // reads from chrome.storage.local (cross-origin safe). Sync whenever the
  // content script loads on an A+ Studio page so the token is always available.
  (function syncListifyToken() {
    const host = window.location.hostname;
    if (
      host === "iprixmedia.com" ||
      host.endsWith(".iprixmedia.com") ||
      host === "localhost" ||
      host === "127.0.0.1"
    ) {
      const syncNow = () => {
        try {
          const token = localStorage.getItem("listify_token");
          if (token) {
            chrome.storage.local.set({ listify_token: token });
          } else {
            chrome.storage.local.remove("listify_token");
          }
        } catch (_) {}
      };
      syncNow();
      // Re-sync on login/logout (storage event fires cross-tab AND same-tab in some browsers)
      window.addEventListener("storage", (e) => {
        if (e.key === "listify_token") syncNow();
      });
      // Re-sync every 5s to catch same-tab mutations (React login/logout)
      setInterval(syncNow, 5000);

      // Sync shipping costs: chrome.storage.local → localStorage so the dashboard can read them
      const syncCosts = () => {
        try {
          chrome.storage.local.get(["listify_shipping_costs"], (stored) => {
            if (stored.listify_shipping_costs) {
              localStorage.setItem("listify_shipping_costs", JSON.stringify(stored.listify_shipping_costs));
            }
          });
        } catch (_) {}
      };
      syncCosts();
      setInterval(syncCosts, 5000);
    }
  })();

  // ── Overlay Sidebar (top-level frame only) ──
  if (window !== window.top) return;

  function injectSidebar() {
    if (!chrome.runtime?.id) return;
    if (document.getElementById("__listify_sidebar__")) return;

    let popupUrl;
    try {
      popupUrl = chrome.runtime.getURL("popup/popup.html");
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
      pointerEvents: "none",
    });

    const sidebar = document.createElement("div");
    sidebar.id = "__listify_sidebar__";
    Object.assign(sidebar.style, {
      position: "fixed",
      top: "0",
      right: "0",
      width: "100vw",
      height: "100%",
      zIndex: "2147483646",
      transform: "translateX(100%)",
      transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      boxShadow: "-4px 0 32px rgba(0,0,0,0.18)",
      borderRadius: "0",
      overflow: "hidden",
    });

    const iframe = document.createElement("iframe");
    iframe.src = popupUrl;
    Object.assign(iframe.style, {
      width: "100%",
      height: "100%",
      border: "none",
      display: "block",
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
    const open = forceOpen !== undefined ? forceOpen : !isOpen;
    sidebar.dataset.open = open;
    sidebar.style.transform = open ? "translateX(0%)" : "translateX(100%)";
    if (backdrop) {
      backdrop.style.opacity = open ? "1" : "0";
      backdrop.style.pointerEvents = open ? "auto" : "none";
    }
  }

  // ── Relay postMessage from dashboard → background (Bulk Fill) ──
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const d = event.data;
    if (!d || d.source !== "lisstify-dashboard") return;
    if (
      d.type === "BULK_FILL_SET_QUEUE" ||
      d.type === "BULK_FILL_CLEAR_QUEUE"
    ) {
      chrome.runtime.sendMessage(d).catch(() => {});
    }
  });

  // ── Relay background → dashboard (progress updates) ──
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.source === "lisstify-extension") {
      console.log("[LISTIFY CS] Relaying extension message to page:", msg.type);
      window.postMessage(msg, "*");
    }
  });

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    (async () => {
      try {
        if (request.action === "TOGGLE_SIDEBAR") {
          toggleSidebar(request.forceOpen);
          sendResponse({ success: true });
        } else if (request.action === "scan_form") {
          const data = await scanForms();
          sendResponse({ success: true, data: data });
        } else if (request.action === "studio_field_audit") {
          const data = await buildStudioFieldAudit();
          sendResponse({ success: true, data });
        } else if (request.action === "studio_save_local_draft") {
          const draft = await scanForms();
          const key = `aplus_local_draft_${Date.now()}`;
          const slimDraft = {
            savedAt: new Date().toISOString(),
            url: draft.url,
            domain: draft.domain,
            title: draft.title,
            category: draft.category,
            fields: draft.fields,
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
            category: sessionStorage.getItem("listify_tab_category") || "",
          });
        } else if (request.action === "get_tab_category_dom") {
          const domCat =
            typeof detectCurrentCategory === "function"
              ? detectCurrentCategory()
              : "";
          const sessionCat =
            sessionStorage.getItem("listify_tab_category") || "";
          sendResponse({ category: sessionCat || domCat });
        } else if (request.action === "clear_tab_category") {
          sessionStorage.removeItem("listify_tab_category");
          sendResponse({ success: true });
        } else if (request.action === "get_current_url") {
          sendResponse({ url: window.location.href });
        } else if (request.action === "get_category_full") {
          // Returns full breadcrumb path saved for this tab e.g. "Home & Living / Bed Linen & Furnishing / Bean Bags / Bean Bags"
          const full =
            sessionStorage.getItem("listify_tab_category_full") || "";
          sendResponse({ categoryFull: full });
        } else if (request.action === "fk_click_add_single") {
          const btn = [
            ...document.querySelectorAll('button,a,[role="button"]'),
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
              return (p || "")
                .split(/\s*[\/\>]\s*/)
                .map((s) => s.trim().toLowerCase())
                .join(" > ");
            }

            function waitFor(selectorFn, timeout = 10000) {
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

              // ── Step 1: type full path in search bar ──
              const searchInput = await waitFor(() =>
                document.querySelector(
                  'input.MuiInputBase-input[placeholder*="Sarees" i],' +
                    'input.MuiInputBase-input[placeholder*="Try" i],' +
                    'input[placeholder*="Search" i],' +
                    'input[placeholder*="category" i],' +
                    'input[type="search"]',
                ),
              );

              searchInput.focus();
              searchInput.click();
              await new Promise((r) => setTimeout(r, 300));

              // Clear existing value
              const nativeSetter = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                "value",
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

              // ── Step 2: wait for dropdown, match option by sub-path ──
              await new Promise((r) => setTimeout(r, 1500));
              const targetPath = normPath(categoryFull);
              const option = await waitFor(() => {
                const items = [
                  ...document.querySelectorAll(
                    'li[class*="suggestion" i], li[class*="item" i], li[class*="option" i], ul li, [role="listbox"] li, [role="option"]',
                  ),
                ];
                return items.find((el) => {
                  const t = normPath(el.textContent);
                  return t === targetPath || t.includes(targetPath);
                });
              });

              option.click();
              console.log("[MEESHO LIVE TEST] Selected category successfully");

              // Optional click on continue or add single catalog after selection if it's there
              await new Promise((r) => setTimeout(r, 1000));
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
          // Meesho bulk listing setup:
          // 1. Type full category path in search bar
          // 2. Match dropdown option by sub-path text
          // 3. Click "Add Product Images"
          // 4. Upload image from Excel row URL
          (async () => {
            const { categoryFull, imageUrl } = request;

            // Normalize path for comparison: "A / B / C" → "a > b > c"
            function normPath(p) {
              return (p || "")
                .split(/\s*[\/\>]\s*/)
                .map((s) => s.trim().toLowerCase())
                .join(" > ");
            }

            // Wait for element via MutationObserver — no polling
            function waitFor(selectorFn, timeout = 10000) {
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
              // ── Step 1: type full path in search bar ──
              // Target Meesho's MUI search input by placeholder or class
              const searchInput = await waitFor(() =>
                document.querySelector(
                  'input.MuiInputBase-input[placeholder*="Sarees" i],' +
                    'input.MuiInputBase-input[placeholder*="Try" i],' +
                    'input[placeholder*="Search" i],' +
                    'input[placeholder*="category" i],' +
                    'input[type="search"]',
                ),
              );
              // Focus + click first so React registers the input as active
              searchInput.focus();
              searchInput.click();
              await new Promise((r) => setTimeout(r, 300));

              // Clear existing value then set new value using native setter
              const nativeSetter = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                "value",
              )?.set;
              if (nativeSetter) nativeSetter.call(searchInput, "");
              searchInput.dispatchEvent(new Event("input", { bubbles: true }));
              await new Promise((r) => setTimeout(r, 100));

              if (nativeSetter) nativeSetter.call(searchInput, categoryFull);
              else searchInput.value = categoryFull;
              searchInput.dispatchEvent(new Event("input", { bubbles: true }));
              searchInput.dispatchEvent(new Event("change", { bubbles: true }));
              searchInput.dispatchEvent(
                new KeyboardEvent("keyup", { bubbles: true }),
              );
              console.log("[MEESHO SETUP] Typed full path:", categoryFull);

              // ── Step 2: wait for dropdown, match option by sub-path ──
              await new Promise((r) => setTimeout(r, 1500));
              const targetPath = normPath(categoryFull);
              const option = await waitFor(() => {
                // Meesho dropdown: each <li> has bold name + gray sub-path with ">" separators
                // e.g. "Home & Living > Bed Linen & Furnishing > Bean Bags > Bean Bags"
                const items = [
                  ...document.querySelectorAll(
                    'li[class*="suggestion" i], li[class*="item" i], li[class*="option" i], ul li, [role="listbox"] li, [role="option"]',
                  ),
                ];
                console.log(
                  "[MEESHO SETUP] Dropdown items found:",
                  items.length,
                  items.map((i) => i.textContent.trim().slice(0, 60)),
                );
                return items.find((el) => {
                  const t = normPath(el.textContent);
                  return t === targetPath || t.includes(targetPath);
                });
              });
              option.click();
              console.log("[MEESHO SETUP] Selected:", categoryFull);

              // ── Step 3: click "Add Product Images" button ──
              const addImgBtn = await waitFor(() =>
                [...document.querySelectorAll('button,a,[role="button"]')].find(
                  (b) => /add\s+product\s+image/i.test(b.textContent),
                ),
              );
              addImgBtn.click();
              console.log('[MEESHO SETUP] Clicked "Add Product Images"');

              // ── Step 4: upload image from URL ──
              if (imageUrl) {
                const fileInput = await waitFor(() =>
                  document.querySelector('input[type="file"]'),
                );
                const res = await fetch(imageUrl);
                const blob = await res.blob();
                const ext = (
                  imageUrl.split(".").pop().split("?")[0] || "jpg"
                ).toLowerCase();
                const file = new File([blob], `product.${ext}`, {
                  type: blob.type || "image/jpeg",
                });
                const dt = new DataTransfer();
                dt.items.add(file);
                fileInput.files = dt.files;
                fileInput.dispatchEvent(new Event("change", { bubbles: true }));
                console.log("[MEESHO SETUP] Image uploaded:", imageUrl);
              }

              // ── Step 5: click Continue button ──
              const continueBtn = await waitFor(() =>
                [
                  ...document.querySelectorAll(
                    "button.MuiButton-containedPrimary",
                  ),
                ].find((b) => /continue/i.test(b.textContent)),
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
          // Parallel bulk fill — row data passed directly, no shared index needed
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
                category: rowData.category || "",
              },
              { resolvedCategory: "bulk" },
            );
            showToast(
              `Filled ${result.filledCount} fields — saving…`,
              result.filledCount > 0 ? "success" : "warning",
            );
            sendResponse({ ok: true, templateId: request.templateId, ...result });
          } catch (e) {
            sendResponse({ ok: false, error: e.message });
          } finally {
            window.__listify_is_filling = false;
          }
        } else if (request.action === "meesho_click_continue") {
          const btn = [
            ...document.querySelectorAll("button.MuiButton-containedPrimary"),
          ].find((b) => /continue/i.test(b.textContent));
          if (btn) {
            btn.click();
            console.log("[MEESHO] Clicked Continue");
            sendResponse({ ok: true });
          } else {
            sendResponse({ ok: false, error: "Continue button not found" });
          }
        } else if (request.action === "bulk_fill_next") {
          // Bulk fill: read current row from chrome.storage, fill form, advance index
          if (window.__listify_is_filling) {
            sendResponse({ ok: false, error: "Already filling" });
            return;
          }
          window.__listify_is_filling = true;
          try {
            const stored = await new Promise((resolve) =>
              chrome.storage.local.get(
                [
                  "listify_bulk_queue",
                  "listify_bulk_index",
                  "listify_bulk_total",
                  "listify_bulk_active",
                  "listify_bulk_template_url",
                ],
                resolve,
              ),
            );
            if (!stored.listify_bulk_active) {
              sendResponse({ ok: false, error: "No active bulk fill queue" });
              return;
            }
            const queue = stored.listify_bulk_queue || [];
            const idx = stored.listify_bulk_index || 0;
            if (idx >= queue.length) {
              // Queue done
              chrome.storage.local.remove([
                "listify_bulk_active",
                "listify_bulk_queue",
                "listify_bulk_index",
                "listify_bulk_total",
                "listify_bulk_template_id",
                "listify_bulk_template_url",
              ]);
              sendResponse({ ok: false, error: "Queue complete" });
              return;
            }
            const rowData = queue[idx];
            // Fill the form — background.js handles save & tab management
            const result = await fillForm(
              {
                fields: rowData.fields || [],
                category: rowData.category || "",
              },
              { resolvedCategory: "bulk" },
            );
            const isLast = idx + 1 >= queue.length;

            // Advance index so next call picks up the right row
            const nextIdx = idx + 1;
            await new Promise((resolve) =>
              chrome.storage.local.set(
                { listify_bulk_index: nextIdx },
                resolve,
              ),
            );

            showToast(
              `Row ${idx + 1}/${queue.length} filled (${result.filledCount} fields) — saving…`,
              result.filledCount > 0 ? "success" : "warning",
            );

            sendResponse({ ok: true, rowIndex: idx + 1, isLast, templateId: stored.listify_bulk_template_id, ...result });
            // background.js sends bulk_auto_save next to click the save button
          } catch (e) {
            sendResponse({ ok: false, error: e.message });
          } finally {
            window.__listify_is_filling = false;
          }
        } else if (request.action === "bulk_auto_save") {
          // Called by background.js after filling a row — clicks the save button
          const saved = bulkAutoClickSave();
          sendResponse({ ok: true, saved });
        } else if (request.action === "sl_upload_images") {
          sendResponse({ ok: true }); // respond immediately; upload is async
          (async () => {
            const urls = request.imageUrls || [];
            console.log(`%c[SL IMG CS] sl_upload_images received. URLs: ${urls.length}`, "color:#E91E63;font-weight:bold", urls);

            if (!urls.length) {
              console.warn("[SL IMG CS] No URLs in message — nothing to upload");
              return;
            }

            // Find the file input by id, testid, or fallback
            const byId    = document.getElementById("addMoreImagesInput");
            const byTest  = document.querySelector('[data-testid="addMoreImagesInput"]');
            const fileInput = byId || byTest;
            console.log(`[SL IMG CS] getElementById: ${byId ? "FOUND" : "null"}, querySelector testid: ${byTest ? "FOUND" : "null"}`);

            if (!fileInput) {
              console.error("[SL IMG CS] ❌ File input NOT FOUND in DOM");
              // List all file inputs on page for debugging
              const allFileInputs = document.querySelectorAll('input[type="file"]');
              console.log(`[SL IMG CS] All file inputs on page (${allFileInputs.length}):`,
                Array.from(allFileInputs).map(i => ({ id: i.id, testid: i.dataset.testid, class: i.className, accept: i.accept })));
              showToast("Image upload field not found — scroll to image section first", "warning");
              return;
            }

            console.log(`[SL IMG CS] ✓ File input found:`, { id: fileInput.id, testid: fileInput.dataset.testid, accept: fileInput.accept, multiple: fileInput.multiple });

            // Remove images from the previous product before uploading the new ones.
            // Limit to 3 parent levels and use exact aria-label values to avoid
            // accidentally clicking unrelated Meesho page buttons.
            {
              const IMG_DELETE_SEL =
                'button[aria-label="Remove image"], button[aria-label="Delete image"], ' +
                'button[aria-label="remove image"], button[aria-label="delete image"], ' +
                '[data-testid="removeImage"], [data-testid="deleteImage"], ' +
                '[data-testid="remove-image"], [data-testid="delete-image"]';
              let imgContainer = fileInput.parentElement;
              let cleared = 0;
              for (let depth = 0; depth < 3 && imgContainer; depth++, imgContainer = imgContainer.parentElement) {
                if (imgContainer.querySelector(IMG_DELETE_SEL)) {
                  for (let attempt = 0; attempt < 10; attempt++) {
                    const btn = imgContainer.querySelector(IMG_DELETE_SEL);
                    if (!btn) break;
                    btn.click();
                    cleared++;
                    await new Promise(r => setTimeout(r, 200));
                  }
                  if (cleared > 0) await new Promise(r => setTimeout(r, 300));
                  console.log(`[SL IMG CS] Cleared ${cleared} existing image(s)`);
                  break;
                }
              }
            }

            showToast(`Uploading ${urls.length} image${urls.length > 1 ? "s" : ""}…`, "info");

            const dt = new DataTransfer();
            let uploaded = 0;

            for (let i = 0; i < urls.length; i++) {
              const url = urls[i];
              console.log(`[SL IMG CS] Fetching image ${i + 1}/${urls.length}: ${url}`);
              try {
                const imgRes = await new Promise((resolve) =>
                  chrome.runtime.sendMessage({ action: "fk_fetch_image", url }, resolve),
                );
                console.log(`[SL IMG CS] fk_fetch_image response for img ${i + 1}:`, {
                  ok: imgRes?.ok,
                  type: imgRes?.type,
                  hasDataUrl: !!imgRes?.dataUrl,
                  dataUrlPrefix: imgRes?.dataUrl?.substring(0, 40),
                  lastError: chrome.runtime.lastError?.message,
                });

                if (!imgRes?.ok) {
                  console.warn(`[SL IMG CS] ❌ Fetch failed for img ${i + 1} (ok=false)`);
                  continue;
                }
                if (!imgRes.dataUrl) {
                  console.warn(`[SL IMG CS] ❌ No dataUrl in response for img ${i + 1}`);
                  continue;
                }

                const mimeType = imgRes.type || "image/jpeg";
                const base64 = imgRes.dataUrl.split(",")[1];
                if (!base64) {
                  console.warn(`[SL IMG CS] ❌ Could not extract base64 from dataUrl for img ${i + 1}`);
                  continue;
                }
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
                const blob = new Blob([bytes], { type: mimeType });
                const ext = mimeType.includes("png") ? "png" : "jpg";
                const rawName = url.split("/").pop().split("?")[0] || `image-${i + 1}.${ext}`;
                const file = new File([blob], rawName, { type: mimeType });
                console.log(`[SL IMG CS] ✓ Built File: name="${file.name}" size=${file.size} type="${file.type}"`);
                dt.items.add(file);
                uploaded++;
              } catch (err) {
                console.error(`[SL IMG CS] ❌ Exception for img ${i + 1}:`, err);
              }
            }

            console.log(`[SL IMG CS] Fetch loop done. uploaded=${uploaded}, dt.files.length=${dt.files.length}`);

            if (uploaded === 0) {
              console.error("[SL IMG CS] ❌ 0 images built — aborting");
              showToast("Could not fetch images from smart listing", "error");
              return;
            }

            console.log(`[SL IMG CS] Setting fileInput.files with ${dt.files.length} file(s)…`);
            fileInput.files = dt.files;
            console.log(`[SL IMG CS] fileInput.files.length after set: ${fileInput.files.length}`);

            fileInput.dispatchEvent(new Event("change", { bubbles: true }));
            console.log("[SL IMG CS] dispatched 'change'");
            fileInput.dispatchEvent(new Event("input", { bubbles: true }));
            console.log("[SL IMG CS] dispatched 'input'");

            showToast(`${uploaded} image${uploaded > 1 ? "s" : ""} uploaded ✓`, "success");
            console.log(`%c[SL IMG CS] ✅ Done — ${uploaded} image(s) set on #addMoreImagesInput`, "color:#1a9e5a;font-weight:bold");
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

  // Auto-click the Save/Submit button after bulk fill
  function bulkAutoClickSave() {
    const priority = [
      "save & continue",
      "save and continue",
      "save",
      "submit",
      "next",
      "continue",
    ];
    const allBtns = Array.from(
      document.querySelectorAll("button:not([disabled])"),
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
            `[LISTIFY BULK] Auto-clicking: "${btn.innerText.trim()}"`,
          );
          btn.click();
          return true;
        }
      }
    }
    console.warn("[LISTIFY BULK] No save button found");
    return false;
  }

  function showToast(message, type = "info") {
    const existing = document.getElementById("__listify_toast__");
    if (existing) existing.remove();

    const colors = {
      success: "#1a9e5a",
      error: "#dc2626",
      warning: "#d97706",
      info: "#ff4f1f",
      off: "#6b7280",
    };

    const toast = document.createElement("div");
    toast.id = "__listify_toast__";

    // Use setProperty with 'important' for layout styles so page CSS cannot override.
    // opacity and transform are set WITHOUT !important so requestAnimationFrame
    // and setTimeout can update them freely for the slide-in/out animation.
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
      "important",
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
      "important",
    );
    // Animation start state — plain assignment so animation can update them
    s.opacity = "0";
    s.transform = "translateY(-10px)";

    const brand = document.createElement("span");
    brand.setAttribute(
      "style",
      "font-weight:700;font-size:11px;opacity:0.85;white-space:nowrap;letter-spacing:0.03em;",
    );
    brand.textContent = "A+ Studio";

    const dot = document.createElement("span");
    dot.setAttribute("style", "opacity:0.4;margin:0 2px;");
    dot.textContent = "·";

    const text = document.createElement("span");
    text.setAttribute(
      "style",
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;",
    );
    text.textContent = message;

    toast.appendChild(brand);
    toast.appendChild(dot);
    toast.appendChild(text);
    document.body.appendChild(toast);

    // Slide in
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    // Slide out and remove
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 280);
    }, 3500);
  }

  const clean = (txt) =>
    txt ? txt.replace(/[\u200B-\u200D\uFEFF]/g, "").trim() : "";

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
    } catch (e) {}
    return "";
  }

  function isGenericText(txt) {
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
  function getTableRowContext(el) {
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

  function _tableCtxStrict(cell) {
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

  // Read the currently selected category from the page DOM at scan time.
  // Checks MUI Select/Autocomplete, data-value attributes, native <select>, labelled inputs.
  function detectCurrentCategory() {
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
  function scrapeBreadcrumbCategory() {
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

  // Auto-save full category path as soon as the form's breadcrumb appears in DOM
  // So sessionStorage is populated even before user clicks "Save Template" or "Add Product Images"
  (function watchBreadcrumb() {
    if (window !== window.top) return;
    if (!window.location.hostname.includes("meesho")) return;

    function tryScrapeBreadcrumb() {
      const el = document.querySelector('[data-testid="imageGuidelines"]');
      if (el) scrapeBreadcrumbCategory(); // always update — overwrite stale value
    }

    // Run immediately in case element is already in DOM
    tryScrapeBreadcrumb();

    // Also watch for it to appear (React renders async)
    const obs = new MutationObserver(tryScrapeBreadcrumb);
    obs.observe(document.body, { childList: true, subtree: true });
  })();

  // ── Meesho Step 2: "Choose from A+ Studio Library" button injection ──
  (function watchMeeshoLibrary() {
    if (!window.location.hostname.includes("supplier.meesho.com")) return;

    const BTN_ID = "__listify_library_btn__";
    const PANEL_ID = "__listify_library_panel__";

    // ── Fetch + XHR interceptor ──
    // Delegates to background.js which uses chrome.scripting.executeScript (world: MAIN)
    // to bypass Meesho's CSP (which blocks inline scripts).
    let _interceptorInjected = false;
    function injectFetchInterceptor() {
      if (_interceptorInjected) { console.log("[LISTIFY] interceptor already requested"); return Promise.resolve(); }
      _interceptorInjected = true;
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "inject_transfer_interceptor" }, (res) => {
          if (chrome.runtime.lastError) {
            console.error("[LISTIFY] inject_transfer_interceptor error:", chrome.runtime.lastError.message);
          } else {
            console.log("[LISTIFY] inject_transfer_interceptor result:", res);
          }
          resolve(res);
        });
      });
    }

    // Queue of resolvers waiting for the next getTransferPrice response
    const _priceListeners = [];
    window.addEventListener("message", (e) => {
      if (!e.data || e.data.__listify !== "transferPrice") return;
      console.log("[LISTIFY] received transferPrice postMessage:", e.data.data);
      const cb = _priceListeners.shift();
      if (cb) cb(e.data.data);
      else console.log("[LISTIFY] no listener waiting for price data");
    });

    function waitForPrice(ms) {
      ms = ms || 7000;
      console.log("[LISTIFY] waitForPrice started, timeout:", ms, "ms, listeners in queue:", _priceListeners.length);
      return new Promise((resolve) => {
        let wrapped;
        const t = setTimeout(() => {
          const idx = _priceListeners.indexOf(wrapped);
          if (idx >= 0) _priceListeners.splice(idx, 1);
          console.log("[LISTIFY] waitForPrice TIMED OUT after", ms, "ms");
          resolve(null);
        }, ms);
        wrapped = (data) => { clearTimeout(t); console.log("[LISTIFY] waitForPrice resolved:", data); resolve(data); };
        _priceListeners.push(wrapped);
      });
    }

    // URL: supplier.meesho.com/panel/v3/new/cataloging/{id}/catalogs/single/add
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
      s.setProperty("background", "#ff4f1f", "important");
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
      s.setProperty("box-shadow", "0 4px 20px rgba(255,79,31,0.45)", "important");
      s.setProperty("white-space", "nowrap", "important");
      s.setProperty("transition", "opacity 0.15s, transform 0.15s", "important");
      btn.addEventListener("mouseover", () => { s.setProperty("opacity", "0.88", "important"); s.setProperty("transform", "scale(1.04)", "important"); });
      btn.addEventListener("mouseout", () => { s.setProperty("opacity", "1", "important"); s.setProperty("transform", "scale(1)", "important"); });
      btn.addEventListener("click", openLibraryPanel);

      document.body.appendChild(btn);
      console.log("[LISTIFY] Library button injected on Meesho Step 2");
    }

    function openLibraryPanel() {
      document.getElementById(PANEL_ID)?.remove();

      // Spin keyframe (only once)
      if (!document.getElementById("__listify_lib_spin__")) {
        const st = document.createElement("style");
        st.id = "__listify_lib_spin__";
        st.textContent = "@keyframes __listify_lib_spin__ { to { transform: rotate(360deg); } }";
        document.head.appendChild(st);
      }

      const backdrop = document.createElement("div");
      backdrop.id = PANEL_ID;
      Object.assign(backdrop.style, {
        position: "fixed", inset: "0",
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
        zIndex: "2147483646", display: "flex", alignItems: "center",
        justifyContent: "center", padding: "20px",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      });

      const modal = document.createElement("div");
      Object.assign(modal.style, {
        background: "#fff", borderRadius: "14px",
        width: "100%", maxWidth: "700px", maxHeight: "82vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.22)", overflow: "hidden",
      });

      // Header
      const hdr = document.createElement("div");
      Object.assign(hdr.style, {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 20px 14px", borderBottom: "1px solid #e5e7eb", flexShrink: "0",
      });
      const hdrLeft = document.createElement("div");
      hdrLeft.innerHTML = `
        <div style="font-size:16px;font-weight:700;color:#111;margin-bottom:2px">A+ Studio Image Library</div>
        <div style="font-size:12px;color:#6b7280">Select a generated image to use as the product image</div>
      `;
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "✕";
      Object.assign(closeBtn.style, {
        background: "none", border: "none", fontSize: "20px",
        cursor: "pointer", color: "#6b7280", padding: "4px 8px", borderRadius: "6px",
      });
      closeBtn.addEventListener("click", () => backdrop.remove());
      hdr.appendChild(hdrLeft);
      hdr.appendChild(closeBtn);

      // Content
      const content = document.createElement("div");
      Object.assign(content.style, { flex: "1", overflowY: "auto", padding: "16px" });
      content.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:60px 0;"><div style="width:32px;height:32px;border:3px solid #e5e7eb;border-top-color:#ff4f1f;border-radius:50%;animation:__listify_lib_spin__ 0.8s linear infinite;"></div></div>`;

      modal.appendChild(hdr);
      modal.appendChild(content);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      backdrop.addEventListener("click", (e) => { if (e.target === backdrop) backdrop.remove(); });

      // Fetch generations via background
      chrome.runtime.sendMessage({ action: "fetch_lisstify_generations" }, (res) => {
        if (chrome.runtime.lastError || !res?.ok) {
          content.innerHTML = `<div style="text-align:center;padding:40px;color:#6b7280;font-size:14px;line-height:1.6;">
            Could not load images.<br><br>
            <strong style="color:#111;">To fix this:</strong><br>
            1. Open <a href="https://aplusstudio.iprixmedia.com" target="_blank" style="color:#ff4f1f;">aplusstudio.iprixmedia.com</a> in a new tab and sign in<br>
            2. Come back here and click <strong>A+ Studio Library</strong> again
          </div>`;
          return;
        }
        const generations = Array.isArray(res.data) ? res.data : (res.data?.generations || []);
        if (!generations.length) {
          content.innerHTML = `<div style="text-align:center;padding:40px;color:#6b7280;font-size:14px;">No generated images found.<br>Create some in the A+ Studio Image Maker dashboard first!</div>`;
          return;
        }

        content.innerHTML = "";
        let shippingCosts = {};
        let selectedUrl = null;
        let lastFolderGen = null;
        let lastFolderName = "";
        let _priceNudgeDir = 1; // alternates +1 / -1 each use

        function _fmtGenLabel(gen) {
          const cat = gen.category && gen.category.toLowerCase() !== "other" ? gen.category : "Product";
          if (!gen.createdAt) return cat;
          const d = new Date(gen.createdAt);
          const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          const h = d.getHours();
          const m = String(d.getMinutes()).padStart(2, "0");
          const ampm = h >= 12 ? "PM" : "AM";
          const hour = h % 12 || 12;
          return `${cat} · ${months[d.getMonth()]} ${d.getDate()}, ${hour}:${m} ${ampm}`;
        }

        // Nudge #meesho_price by ±1 to trigger Meesho's shipping-charge recalculation.
        // Retries for up to ~6s to let React render the pricing section after image upload.
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
            _priceNudgeDir *= -1; // flip so next call goes the other way
            return true;
          }
          return false;
        }

        // ── Find Best Image ──
        // Uploads each image in the folder one by one, nudges meesho_price to trigger
        // getTransferPrice API, records shipping_charges, then uploads the winner.
        async function runFindBest(gen, folderName) {
          const images = (gen.generatedImages || []).filter(Boolean);
          if (!images.length) { showToast("No images in this folder", "error"); return; }

          // Inject interceptor first and wait for confirmation before starting tests
          await injectFetchInterceptor();
          console.log("[LISTIFY] interceptor ready, starting image tests");

          // Reconfigure footer: hide Use This Image, change Cancel to Stop
          useBtn.style.display = "none";
          const origCancelText = cancelBtn.textContent;
          cancelBtn.textContent = "Stop";
          let stopped = false;
          const stopHandler = () => { stopped = true; backdrop.remove(); };
          cancelBtn.removeEventListener("click", cancelBtn._listifyHandler || (() => {}));
          cancelBtn._listifyHandler = stopHandler;
          cancelBtn.addEventListener("click", stopHandler);

          // Progress UI
          content.innerHTML = "";
          const pw = document.createElement("div");
          Object.assign(pw.style, { padding: "16px 0" });

          const folderLbl = document.createElement("div");
          Object.assign(folderLbl.style, { fontSize: "11px", color: "#9ca3af", marginBottom: "10px", textAlign: "center" });
          folderLbl.textContent = folderName;

          const titleEl = document.createElement("div");
          Object.assign(titleEl.style, { fontSize: "15px", fontWeight: "700", color: "#111", marginBottom: "4px", textAlign: "center" });
          titleEl.textContent = "Finding best image…";

          const subEl = document.createElement("div");
          Object.assign(subEl.style, { fontSize: "12px", color: "#6b7280", marginBottom: "14px", textAlign: "center" });
          subEl.textContent = `Testing 1 of ${images.length}`;

          const thumbWrap = document.createElement("div");
          Object.assign(thumbWrap.style, { display: "flex", justifyContent: "center", marginBottom: "14px" });
          const thumbEl = document.createElement("img");
          Object.assign(thumbEl.style, {
            width: "100px", height: "100px", objectFit: "contain",
            border: "2px solid #e5e7eb", borderRadius: "10px", background: "#f9fafb",
          });
          thumbWrap.appendChild(thumbEl);

          const barWrap = document.createElement("div");
          Object.assign(barWrap.style, { height: "4px", background: "#f3f4f6", borderRadius: "2px", overflow: "hidden", marginBottom: "14px" });
          const barFill = document.createElement("div");
          Object.assign(barFill.style, { height: "100%", background: "#ff4f1f", borderRadius: "2px", width: "0%", transition: "width 0.4s" });
          barWrap.appendChild(barFill);

          const logList = document.createElement("div");
          Object.assign(logList.style, {
            borderTop: "1px solid #f0f0f0", paddingTop: "10px", maxHeight: "180px", overflowY: "auto",
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
            subEl.textContent = `Testing ${i + 1} of ${images.length}…`;
            thumbEl.src = url;
            barFill.style.width = `${Math.round((i / images.length) * 100)}%`;

            // Fetch image blob via background
            const imgRes = await new Promise((r) => chrome.runtime.sendMessage({ action: "fk_fetch_image", url }, r));
            if (!imgRes?.ok || stopped) { _logRow(logList, i + 1, url, null, "fetch failed"); continue; }

            // Build File object
            let file;
            try {
              const mt = imgRes.type || "image/jpeg";
              const bin = atob(imgRes.dataUrl.split(",")[1]);
              const bytes = new Uint8Array(bin.length);
              for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
              file = new File([new Blob([bytes], { type: mt })], `lst.${mt.includes("png") ? "png" : "jpg"}`, { type: mt });
            } catch (_) { _logRow(logList, i + 1, url, null, "build failed"); continue; }

            // Upload to Meesho's file input
            const fi = document.querySelector('[data-testid="changeFrontImage"]') ||
                        document.getElementById("changeFrontImage") ||
                        document.querySelector('input[type="file"]');
            if (!fi) { _logRow(logList, i + 1, url, null, "no file input"); break; }
            const dt = new DataTransfer(); dt.items.add(file); fi.files = dt.files;
            fi.dispatchEvent(new Event("change", { bubbles: true }));
            fi.dispatchEvent(new Event("input", { bubbles: true }));

            // Wait for Meesho to process image upload
            await new Promise((r) => setTimeout(r, 2000));
            if (stopped) break;

            // Nudge price to trigger getTransferPrice API call
            const priceInput = document.getElementById("meesho_price");
            if (!priceInput) {
              console.log("[LISTIFY] #meesho_price not found on page");
              _logRow(logList, i + 1, url, null, "no price field"); break;
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

            // Wait for API response
            console.log("[LISTIFY] waiting for getTransferPrice response for image", i + 1);
            const apiData = await waitForPrice(7000);
            console.log("[LISTIFY] apiData received:", apiData);
            if (stopped) break;
            const shipping = apiData?.shipping_charges;
            _logRow(logList, i + 1, url, shipping, shipping == null ? "timeout" : null);
            if (shipping != null) results.push({ url, shipping, idx: i + 1 });

            barFill.style.width = `${Math.round(((i + 1) / images.length) * 100)}%`;
          }

          if (stopped) return;

          if (!results.length) {
            titleEl.textContent = "No shipping data received";
            subEl.textContent = "API responses timed out — try again.";
            useBtn.style.display = "";
            useBtn.textContent = "Back to Folders";
            useBtn.disabled = false; useBtn.style.opacity = "1"; useBtn.style.cursor = "pointer";
            const handler = () => { useBtn.style.display = "none"; renderFolders(); };
            useBtn.addEventListener("click", handler, { once: true });
            cancelBtn.textContent = origCancelText;
            cancelBtn.removeEventListener("click", stopHandler);
            cancelBtn.addEventListener("click", () => backdrop.remove());
            return;
          }

          // Pick winner
          const best = results.reduce((a, b) => a.shipping <= b.shipping ? a : b);
          const worst = Math.max(...results.map((r) => r.shipping));
          const savings = worst - best.shipping;

          titleEl.textContent = `Best image found!`;
          subEl.textContent = `Image ${best.idx} — ₹${best.shipping} shipping${savings > 0 ? ` (saves ₹${savings})` : ""}`;
          thumbEl.src = best.url;
          thumbEl.style.borderColor = "#ff4f1f";
          barFill.style.width = "90%";

          // Upload winner
          const winRes = await new Promise((r) => chrome.runtime.sendMessage({ action: "fk_fetch_image", url: best.url }, r));
          if (winRes?.ok) {
            try {
              const mt = winRes.type || "image/jpeg";
              const bin = atob(winRes.dataUrl.split(",")[1]);
              const bytes = new Uint8Array(bin.length);
              for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
              const wfile = new File([new Blob([bytes], { type: mt })], `lst.${mt.includes("png") ? "png" : "jpg"}`, { type: mt });
              const fi = document.querySelector('[data-testid="changeFrontImage"]') ||
                          document.getElementById("changeFrontImage") ||
                          document.querySelector('input[type="file"]');
              if (fi) {
                const dt = new DataTransfer(); dt.items.add(wfile); fi.files = dt.files;
                fi.dispatchEvent(new Event("change", { bubbles: true }));
                fi.dispatchEvent(new Event("input", { bubbles: true }));
              }
            } catch (_) {}
          }

          // Wait for Meesho to process the winner image before nudging price.
          // Without this, the UI still shows the last-tested image (not the winner).
          titleEl.textContent = "Applying best image…";
          subEl.textContent = "Please wait…";
          await new Promise((r) => setTimeout(r, 2000));

          barFill.style.width = "100%";

          // Persist all shipping costs locally and to backend so badges survive session clears
          chrome.storage.local.get(["listify_shipping_costs"], (stored) => {
            const costs = stored.listify_shipping_costs || {};
            const newCosts = {};
            for (const r of results) { costs[r.url] = r.shipping; newCosts[r.url] = r.shipping; }
            chrome.storage.local.set({ listify_shipping_costs: costs });
            // Mirror into in-memory cache so re-opened folder grid shows badge immediately
            for (const r of results) shippingCosts[r.url] = r.shipping;
            // Also save to backend for cross-device / cross-session persistence
            chrome.runtime.sendMessage({ action: "save_shipping_costs", costs: newCosts });
          });

          backdrop.remove();
          // Nudge price so Meesho recalculates shipping for the winner image and updates the UI
          await _nudgeMeeshoPrice();
          showToast(`Best image applied ✓  Shipping: ₹${best.shipping}${savings > 0 ? `  (saves ₹${savings} vs worst)` : ""}`, "success");
        }

        function _logRow(list, num, url, shipping, errMsg) {
          const row = document.createElement("div");
          Object.assign(row.style, {
            display: "flex", alignItems: "center", gap: "10px",
            padding: "5px 0", borderBottom: "1px solid #f9f9f9",
          });
          const th = document.createElement("img");
          th.src = url;
          Object.assign(th.style, {
            width: "32px", height: "32px", objectFit: "contain",
            background: "#f9fafb", borderRadius: "4px", flexShrink: "0",
          });
          const lbl = document.createElement("div");
          lbl.style.flex = "1";
          lbl.innerHTML = `<span style="font-size:11px;color:#6b7280;">Image ${num}</span>`;
          const val = document.createElement("div");
          Object.assign(val.style, { fontSize: "13px", fontWeight: "700", flexShrink: "0" });
          if (shipping != null) {
            val.style.color = "#111";
            val.textContent = `₹${shipping}`;
          } else {
            val.style.color = "#9ca3af";
            val.textContent = errMsg || "—";
          }
          row.appendChild(th); row.appendChild(lbl); row.appendChild(val);
          list.appendChild(row);
          list.scrollTop = list.scrollHeight;
        }

        // Footer (declared early so renderImages can reference useBtn)
        const footer = document.createElement("div");
        Object.assign(footer.style, {
          display: "flex", gap: "10px",
          padding: "14px 20px", borderTop: "1px solid #e5e7eb", flexShrink: "0",
        });

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        Object.assign(cancelBtn.style, {
          flex: "1", padding: "9px 16px", background: "none",
          border: "1px solid #d1d5db", borderRadius: "8px",
          fontSize: "13px", fontWeight: "500", color: "#6b7280", cursor: "pointer",
        });
        cancelBtn.addEventListener("click", () => backdrop.remove());

        const useBtn = document.createElement("button");
        useBtn.textContent = "Use This Image";
        useBtn.disabled = true;
        Object.assign(useBtn.style, {
          flex: "2", padding: "9px 16px", background: "#ff4f1f",
          color: "#fff", border: "none", borderRadius: "8px",
          fontSize: "13px", fontWeight: "700", cursor: "not-allowed",
          opacity: "0.4", transition: "opacity 0.15s",
        });

        // Level 1: folder grid
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
            gap: "12px", padding: "4px 0 8px",
          });

          for (const gen of generations) {
            if (!gen.generatedImages?.length) continue;
            const folderName = _fmtGenLabel(gen);
            const count = gen.generatedImages.length;

            const card = document.createElement("div");
            Object.assign(card.style, {
              border: "1.5px solid #e5e7eb", borderRadius: "10px",
              overflow: "hidden", cursor: "pointer", background: "#fff",
              transition: "border-color 0.15s, box-shadow 0.15s, transform 0.1s",
            });
            card.addEventListener("mouseover", () => {
              card.style.borderColor = "#ff4f1f";
              card.style.boxShadow = "0 4px 14px rgba(255,79,31,0.13)";
              card.style.transform = "translateY(-2px)";
            });
            card.addEventListener("mouseout", () => {
              card.style.borderColor = "#e5e7eb";
              card.style.boxShadow = "none";
              card.style.transform = "none";
            });

            // Thumbnail wrapper (position:relative so badge can overlay)
            const thumbWrap = document.createElement("div");
            Object.assign(thumbWrap.style, { position: "relative" });

            const thumb = document.createElement("img");
            thumb.src = gen.generatedImages[0];
            thumb.loading = "lazy";
            Object.assign(thumb.style, {
              width: "100%", aspectRatio: "1", objectFit: "contain", display: "block",
              background: "#f3f4f6", padding: "10px", boxSizing: "border-box",
            });

            const info = document.createElement("div");
            Object.assign(info.style, {
              padding: "8px 10px 10px", borderTop: "1px solid #f0f0f0",
            });

            const nameEl = document.createElement("div");
            Object.assign(nameEl.style, {
              fontSize: "11px", fontWeight: "700", color: "#111",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              marginBottom: "3px",
            });
            nameEl.title = folderName;
            nameEl.textContent = folderName;

            const countEl = document.createElement("div");
            Object.assign(countEl.style, { fontSize: "10px", color: "#9ca3af" });
            countEl.textContent = `${count} image${count !== 1 ? "s" : ""}`;

            info.appendChild(nameEl);
            info.appendChild(countEl);

            const testedCosts = (gen.generatedImages || []).map(u => shippingCosts[u]).filter(v => typeof v === "number" && isFinite(v));
            if (testedCosts.length > 0) {
              const bestCost = Math.min(...testedCosts);
              const worstCost = Math.max(...testedCosts);

              // Overlay badge on thumbnail (top-left corner)
              const testedBadge = document.createElement("div");
              testedBadge.textContent = "Tested";
              Object.assign(testedBadge.style, {
                position: "absolute", top: "6px", left: "6px",
                fontSize: "9px", fontWeight: "700", color: "#fff",
                background: "#ff4f1f", borderRadius: "4px", padding: "2px 7px",
                letterSpacing: "0.02em", zIndex: "1",
              });
              thumbWrap.appendChild(testedBadge);

              // Cost line in info
              const costEl = document.createElement("div");
              costEl.textContent = testedCosts.length > 1
                ? `★ ₹${bestCost} best · ₹${worstCost} worst`
                : `★ ₹${bestCost}`;
              Object.assign(costEl.style, {
                fontSize: "10px", fontWeight: "600", color: "#f59e0b", marginTop: "4px",
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

        // Level 2: images inside a folder
        function renderImages(gen, folderName) {
          selectedUrl = null;
          lastFolderGen = gen;
          lastFolderName = folderName;
          useBtn.textContent = "Use This Image";
          useBtn.disabled = true;
          useBtn.style.opacity = "0.4";
          useBtn.style.cursor = "not-allowed";
          content.innerHTML = "";

          // Back + breadcrumb row
          const navRow = document.createElement("div");
          Object.assign(navRow.style, {
            display: "flex", alignItems: "center", gap: "10px",
            marginBottom: "12px", paddingBottom: "10px",
            borderBottom: "1px solid #f0f0f0",
          });

          const backBtn = document.createElement("button");
          backBtn.innerHTML = `&#8592; All Folders`;
          Object.assign(backBtn.style, {
            background: "none", border: "none", fontSize: "12px",
            color: "#ff4f1f", cursor: "pointer", fontWeight: "600",
            padding: "0", flexShrink: "0", whiteSpace: "nowrap",
          });
          backBtn.addEventListener("click", renderFolders);

          const titleEl = document.createElement("div");
          Object.assign(titleEl.style, {
            fontSize: "13px", fontWeight: "700", color: "#111",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
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
            gap: "10px",
          });

          for (const url of gen.generatedImages) {
            const card = document.createElement("div");
            Object.assign(card.style, {
              border: "2px solid #e5e7eb", borderRadius: "8px",
              overflow: "hidden", cursor: "pointer",
              transition: "border-color 0.15s, box-shadow 0.15s",
            });
            card.dataset.url = url;

            const imgEl = document.createElement("img");
            imgEl.src = url;
            imgEl.loading = "lazy";
            Object.assign(imgEl.style, {
              width: "100%", aspectRatio: "1", objectFit: "contain", display: "block",
              background: "#f9fafb", padding: "4px", boxSizing: "border-box",
            });
            card.appendChild(imgEl);

            const imgCost = shippingCosts[url];
            if (typeof imgCost === "number" && isFinite(imgCost)) {
              const allTestedCosts = (gen.generatedImages || []).map(u => shippingCosts[u]).filter(v => typeof v === "number" && isFinite(v));
              const isBest = allTestedCosts.length > 0 && imgCost === Math.min(...allTestedCosts);
              const costBadge = document.createElement("div");
              costBadge.textContent = `${isBest ? "★ " : ""}₹${imgCost}`;
              Object.assign(costBadge.style, {
                fontSize: "11px", fontWeight: "700",
                color: isBest ? "#fff" : "#374151",
                background: isBest ? "#16a34a" : "#f3f4f6",
                padding: "3px 8px", textAlign: "center",
                borderTop: "1px solid #e5e7eb",
              });
              card.appendChild(costBadge);
            }

            card.addEventListener("click", () => {
              content.querySelectorAll("[data-url]").forEach((c) => {
                c.style.borderColor = "#e5e7eb";
                c.style.boxShadow = "none";
              });
              card.style.borderColor = "#ff4f1f";
              card.style.boxShadow = "0 0 0 3px rgba(255,79,31,0.15)";
              selectedUrl = url;
              useBtn.disabled = false;
              useBtn.style.opacity = "1";
              useBtn.style.cursor = "pointer";
            });
            grid.appendChild(card);
          }
          content.appendChild(grid);
        }

        // Direct upload + auto-nudge price to trigger shipping recalculation
        useBtn.addEventListener("click", () => {
          if (!selectedUrl || useBtn.disabled) return;
          useBtn.textContent = "Applying…";
          useBtn.disabled = true;
          useBtn.style.opacity = "0.6";

          chrome.runtime.sendMessage({ action: "fk_fetch_image", url: selectedUrl }, (imgRes) => {
            if (chrome.runtime.lastError || !imgRes?.ok) {
              showToast("Could not fetch image — try again", "error");
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

              const fileInput =
                document.querySelector('[data-testid="changeFrontImage"]') ||
                document.getElementById("changeFrontImage") ||
                document.querySelector('input[type="file"]');
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
              showToast("Image applied ✓ Refreshing shipping charges…", "success");

              // Nudge meesho_price ±1 to force Meesho to recalculate shipping
              _nudgeMeeshoPrice().then((ok) => {
                if (ok) showToast("Shipping charges refreshed ✓", "success");
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

        // Start on folder view — load costs from all sources before rendering
        // Step 1: pull costs from the A+ Studio website's localStorage (recovers data lost when chrome.storage was cleared)
        // Step 2: fetch from backend (merges backend costs into local)
        // Step 3: read merged result and render
        chrome.runtime.sendMessage({ action: "sync_website_shipping_costs" }, () => {
          chrome.runtime.sendMessage({ action: "fetch_shipping_costs" }, () => {
            chrome.storage.local.get(["listify_shipping_costs"], (stored) => {
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

    // Poll every 500ms — handles SPA navigation (history.pushState doesn't fire popstate)
    let _lastUrl = location.href;
    setInterval(() => {
      const cur = location.href;
      if (cur !== _lastUrl) {
        _lastUrl = cur;
        document.getElementById(BTN_ID)?.remove();
        setTimeout(tryInject, 800);
      } else {
        // Re-inject if button was removed by React re-render
        tryInject();
      }
    }, 500);

    // Try immediately + after React mounts
    tryInject();
    setTimeout(tryInject, 1000);
    setTimeout(tryInject, 2500);
  })();

  async function scanForms() {
    const allElements = getAllElementsDeep();
    const formData = [];
    let skippedCount = 0;

    for (const input of allElements) {
      let valueToSend = "";
      if (input.tagName === "DIV" || input.tagName === "SPAN") {
        // SVG-toggle div: store value as true (user saves template when toggle is ON)
        if (
          input.firstElementChild &&
          input.firstElementChild.tagName.toLowerCase() === "svg"
        ) {
          valueToSend = true;
          console.log(
            `[DEBUG SVG] scanForms: Extracted valueToSend=true for SVG-toggle container:`,
            input,
            `Text:`,
            input.innerText,
          );
        } else {
          valueToSend =
            input.innerText && input.innerText !== "Select"
              ? input.innerText
              : "";
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

      // DO NOT skip checkboxes just because they use MUI's PrivateSwitchBase-input class.
      // Checkboxes are usually vital fields (e.g. Manufacturing Info).
      // if (input.classList && input.classList.contains('PrivateSwitchBase-input') && input.getAttribute('aria-label') === 'Checkbox') { skippedCount++; return; }

      if (input.tagName === "TEXTAREA" && !input.id && !input.name) {
        const v = String(valueToSend).trim();
        if (v.length <= 2 && !input.placeholder) {
          skippedCount++;
          continue;
        }
      }
      const labelText = getEnrichedLabel(input);
      if (
        labelText &&
        /^\d+\/\d+$/.test(labelText) &&
        !input.id &&
        !input.name
      ) {
        skippedCount++;
        continue;
      }
      if (
        !labelText &&
        !valueToSend &&
        !input.id &&
        !input.name &&
        !input.placeholder
      ) {
        skippedCount++;
        continue;
      }

      const isSvgToggle =
        (input.tagName === "DIV" || input.tagName === "SPAN") &&
        input.firstElementChild &&
        input.firstElementChild.tagName.toLowerCase() === "svg";
      if (isSvgToggle) {
        console.log(
          `[DEBUG SVG] scanForms: Classifying element as SVG-toggle checkbox (type will be set to 'checkbox'):`,
          input,
        );
      }
      formData.push({
        selector: getUniqueSelector(input),
        id: input.id,
        name: input.name,
        label: labelText,
        value: valueToSend,
        type: isSvgToggle
          ? "checkbox"
          : input.type || input.tagName.toLowerCase(),
        placeholder: input.placeholder || "",
      });
    }

    console.log(
      `%c[LISTIFY SCAN] ${formData.length} fields captured, ${skippedCount} skipped`,
      "color: #ff4f1f; font-weight: bold",
    );

    // Detect the currently selected category from the page (MUI Select, native select, labelled input)
    let detectedCategory = detectCurrentCategory();
    // Fallback: find a captured field whose label contains "category" and has a real value
    if (!detectedCategory) {
      const catField = formData.find((f) => /categor/i.test(f.label || ""));
      if (
        catField &&
        typeof catField.value === "string" &&
        catField.value.trim()
      ) {
        const v = catField.value.trim();
        if (v.toLowerCase() !== "meesho") detectedCategory = v;
      }
    }
    if (detectedCategory)
      console.log(
        `%c[LISTIFY SCAN] Category detected: "${detectedCategory}"`,
        "color: #ff4f1f",
      );

    return {
      url: window.location.href,
      domain: window.location.hostname,
      title: document.title,
      fields: formData,
      category: detectedCategory,
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
    if (field.value !== "" && field.value !== null && field.value !== undefined) score += 8;
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
        field.selector,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return kws.some((kw) => haystack.includes(kw));
    });
    return normalizeStudioText(matched?.value);
  }

  function makeStudioChecks(fields) {
    const title = findStudioValue(fields, ["title", "product name", "catalog name"]);
    const description = findStudioValue(fields, ["description", "desc", "details", "about"]);
    const price = findStudioValue(fields, ["selling price", "price", "mrp"]);
    const sku = findStudioValue(fields, ["sku", "seller sku", "sku id"]);
    const keywords = fields
      .filter((field) => /keyword|tag|search/i.test(`${field.label || ""} ${field.placeholder || ""} ${field.name || ""}`))
      .map((field) => normalizeStudioText(field.value))
      .filter(Boolean);
    const hasImage = fields.some((field) => field.type === "file" || /image|photo|upload/i.test(`${field.label || ""} ${field.placeholder || ""}`));

    const checks = [
      {
        key: "title",
        label: "Title has marketplace-ready length",
        ok: title.length >= 35 && title.length <= 120,
      },
      {
        key: "description",
        label: "Description has enough detail",
        ok: description.length >= 80,
      },
      {
        key: "keywords",
        label: "Keywords or tags are present",
        ok: keywords.length > 0 || /keyword|tag|search/i.test(document.body.innerText || ""),
      },
      {
        key: "price",
        label: "Price/MRP field has a value",
        ok: Boolean(price),
      },
      {
        key: "image",
        label: "Image upload/preview detected",
        ok: hasImage,
      },
      {
        key: "sku",
        label: "SKU field is available",
        ok: Boolean(sku) || fields.some((field) => /sku/i.test(`${field.label || ""} ${field.placeholder || ""} ${field.name || ""}`)),
      },
    ];

    const inferred = {
      brand: findStudioValue(fields, ["brand"]),
      category: detectCurrentCategory() || findStudioValue(fields, ["category", "vertical"]),
      color: findStudioValue(fields, ["color", "colour"]),
      size: findStudioValue(fields, ["size"]),
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
      hasValue: field.value !== "" && field.value !== null && field.value !== undefined,
      confidence: studioFieldConfidence(field),
    }));
    const { checks, inferred } = makeStudioChecks(scanned.fields || []);
    const score = Math.round((checks.filter((check) => check.ok).length / checks.length) * 100);

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
        fields,
      },
    };
  }

  function findElement(field, allInputs) {
    let bestMatch = null,
      maxScore = 0;
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
      // Prefer elements whose type matches the saved field type.
      // This prevents a text input from stealing a checkbox field's match
      // when both share the same surrounding label (e.g. "Packer Name*").
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
      } catch (e) {}
    }
    if (field.label && field.label.length > 3) {
      const d = allInputs.find((el) => {
        const t = getEnrichedLabel(el);
        return t && t.includes(field.label);
      });
      if (d) return d;
      const dm = allInputs.find(
        (el) => el.innerText && el.innerText.includes(field.label),
      );
      if (dm) return dm;
    }
    return null;
  }

  // Wait for a popup to appear in the DOM containing targetValue text
  function waitForPopup(targetValue, timeoutMs = 5000) {
    return new Promise((resolve) => {
      const val = targetValue.trim();
      let resolved = false;

      function searchPopups() {
        const popups = document.querySelectorAll(
          '[role="presentation"] .MuiPaper-root, .MuiPopover-paper, .MuiMenu-paper',
        );
        for (const popup of popups) {
          const rect = popup.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          // Search <p> first to avoid matching parent divs
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
          // Partial match
          for (const tag of priorityOrder) {
            const els = Array.from(popup.querySelectorAll(tag));
            for (const el of els) {
              const t = (el.textContent || "").trim();
              if (
                t.length > 0 &&
                t.length < 80 &&
                (t.includes(val) || val.includes(t)) &&
                t.length >= val.length * 0.5
              ) {
                return { textEl: el, popup };
              }
            }
          }
        }
        return null;
      }

      // Check existing popups
      const existing = searchPopups();
      if (existing) {
        resolve(existing);
        return;
      }

      // MutationObserver
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

  // Close all open MUI popups (only when one is actually visible)
  async function closeAllPopups() {
    const hasOpen = Array.from(
      document.querySelectorAll(
        ".MuiPopover-root, .MuiMenu-root, .MuiAutocomplete-popper, [data-popper-placement]",
      ),
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
            cancelable: true,
          }),
        );
      }
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      );
      await new Promise((r) => setTimeout(r, 150));
      document.body.click();
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // Click inside a popup: find SVG checkbox and click it, or click the text row
  // Find a single option element within an already-open popup by value text
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

  // Wait for any popup/menu to appear in the DOM (used for size multi-select)
  function waitForAnyPopup(timeoutMs = 5000) {
    return new Promise((resolve) => {
      function findAny() {
        const selectors = [
          '[role="presentation"] .MuiPaper-root',
          ".MuiPopover-paper",
          ".MuiMenu-paper",
          ".MuiPopover-root .MuiPaper-root",
          "[data-popper-placement] .MuiPaper-root",
          '[role="listbox"]',
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

  // Returns the visual checked state of a checkbox/toggle element.
  // For standard MUI inputs: uses Mui-checked class (React state), NOT element.checked (raw DOM).
  // For SVG-toggle divs: uses aria-checked / aria-pressed attribute.
  function isCheckboxChecked(element) {
    // SVG-toggle div: always return false so autofill always clicks it when shouldCheck=true
    if (
      (element.tagName === "DIV" || element.tagName === "SPAN") &&
      element.querySelector("svg")
    ) {
      console.log(
        `[DEBUG SVG] isCheckboxChecked: Forcing return false for SVG-toggle element to ensure autofill clicks it:`,
        element,
      );
      return false;
    }
    // Standard MUI input: use Mui-checked class (React visual state)
    const muiWrapper = element.closest(
      ".MuiCheckbox-root, .PrivateSwitchBase-root",
    );
    return muiWrapper
      ? muiWrapper.classList.contains("Mui-checked")
      : element.checked;
  }

  // Clicks a checkbox/toggle element by dispatching a MouseEvent to the SVG inside it.
  function clickCheckboxElement(element) {
    // SVG-toggle: div.MuiBox-root contains svg + p
    // Simply find the svg inside the div and dispatch click on it
    if (element.tagName === "DIV" || element.tagName === "SPAN") {
      const svg = element.querySelector("svg");
      console.log(
        `[DEBUG SVG] clickCheckboxElement: Attempting to click SVG inside div. SVG found:`,
        !!svg,
        `Element:`,
        element,
      );
      if (svg) {
        console.log(
          `%c[CLICK_CB] SVG-toggle: clicking svg inside div`,
          "color:#E91E63; font-weight:bold",
        );
        svg.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
        setTimeout(() => {
          const path = element.querySelector("svg path");
          const fill = path ? path.getAttribute("fill") : null;
          console.log(
            `[DEBUG SVG] Post-click verification. SVG path fill attribute = "${fill}"`,
          );
          console.log(
            `%c[CLICK_CB] after click — fill="${fill}" isChecked=${!!(fill && fill !== "none" && fill !== "currentColor")}`,
            "color:#E91E63",
          );
        }, 100);
      } else {
        console.warn(
          `%c[CLICK_CB] SVG-toggle: no svg found inside div`,
          "color:#dc2626",
        );
      }
      return;
    }
    // Standard MUI input checkbox: find wrapper and click its svg
    const muiWrapper = element.closest(
      ".PrivateSwitchBase-root, .MuiButtonBase-root, label",
    );
    if (muiWrapper) {
      const svg = muiWrapper.querySelector("svg");
      console.log(
        `%c[CLICK_CB] MUI input: wrapper found, svg=${!!svg}`,
        "color:#E91E63; font-weight:bold",
      );
      if (svg)
        svg.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      else muiWrapper.click();
      return;
    }
    console.log(`%c[CLICK_CB] fallback: element.click()`, "color:#E91E63");
    element.click();
  }

  function clickPopupOption(textEl) {
    const textParent = textEl.parentElement;
    // Regular dropdowns: LI option rows — native click goes through React event delegation
    const liAncestor = textEl.closest('li, [role="option"]');
    if (liAncestor) {
      console.log(
        `%c[SIZE CLICK] LI option row click: <${liAncestor.tagName} class="${liAncestor.className.slice(0, 60)}">`,
        "color:#9C27B0",
      );
      liAncestor.click();
      return true;
    }
    // Size popup: DIV (MuiBox-root) option rows — click SVG checkbox inside it
    const svg = textParent ? textParent.querySelector("svg") : null;
    if (svg) {
      console.log(
        `%c[SIZE CLICK] SVG checkbox click (no LI ancestor — size popup)`,
        "color:#9C27B0",
      );
      svg.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
      return true;
    }
    // Final fallback
    const fallback = textParent
      ? textParent.parentElement || textParent
      : textEl;
    console.log(
      `%c[SIZE CLICK] fallback click: <${fallback.tagName} class="${fallback.className.slice(0, 60)}">`,
      "color:#9C27B0",
    );
    fallback.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    return true;
  }

  // Find a search/filter input inside the currently visible dropdown popup
  function findPopupSearchInput() {
    const popupSelectors = [
      ".MuiPopover-root",
      ".MuiMenu-root",
      ".MuiAutocomplete-popper",
      "[data-popper-placement]",
      '[role="presentation"]',
    ];
    for (const sel of popupSelectors) {
      for (const popup of document.querySelectorAll(sel)) {
        const r = popup.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const input = popup.querySelector(
          'input:not([type="hidden"]):not([readonly])',
        );
        if (input) return input;
      }
    }
    return null;
  }

  // Type a value into a search input using React's synthetic event system
  function typeIntoInput(input, val) {
    try {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      ).set;
      if (setter) setter.call(input, val);
      else input.value = val;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (_) {}
  }

  // Find Apply/Done/Confirm button inside a popup
  function findApplyInPopup(popup) {
    const root = popup.closest('[role="presentation"]') || popup;
    const buttons = Array.from(root.querySelectorAll("button"));
    for (const btn of buttons) {
      const txt = (btn.innerText || btn.textContent || "").trim().toLowerCase();
      if (["apply", "done", "confirm", "ok"].includes(txt)) return btn;
    }
    // Global fallback
    const allBtns = Array.from(
      document.querySelectorAll('button, [role="button"]'),
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

  // Helper: set value on a text/textarea/select element
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

  // Classify whether an element is a custom dropdown
  function isCustomDropdown(element) {
    // SVG-toggle divs (SVG + text label) are checkboxes, not dropdowns
    if (
      (element.tagName === "DIV" || element.tagName === "SPAN") &&
      element.firstElementChild &&
      element.firstElementChild.tagName.toLowerCase() === "svg"
    ) {
      return false;
    }
    return (
      element.tagName === "DIV" ||
      element.tagName === "SPAN" ||
      (element.tagName === "INPUT" &&
        (element.hasAttribute("readonly") ||
          element.getAttribute("aria-haspopup") === "listbox" ||
          element.getAttribute("role") === "combobox"))
    );
  }

  async function fillForm(templateData, { resolvedCategory } = {}) {
    _listifyAbortFill = false;
    if (!templateData || !templateData.fields)
      return { filledCount: 0, notFoundCount: 0, optionNotFoundCount: 0 };

    // ── Category guard ──
    // If resolvedCategory is provided, background already verified the match — skip guard.
    // Only check when fillForm is called without a pre-verified category.
    if (!resolvedCategory) {
      const templateCategory = (templateData.category || "")
        .trim()
        .toLowerCase();
      if (templateCategory) {
        const currentCategory = (
          detectCurrentCategory() ||
          sessionStorage.getItem("listify_tab_category") ||
          ""
        )
          .trim()
          .toLowerCase();
        if (!currentCategory) {
          showToast(
            "Category not detected on this page — please select a category first",
            "warning",
          );
          console.warn(
            "[LISTIFY] Category guard: could not detect current page category",
          );
          return { filledCount: 0, notFoundCount: 0, optionNotFoundCount: 0 };
        }
        if (currentCategory !== templateCategory) {
          showToast(`No template saved for "${currentCategory}"`, "warning");
          console.warn(
            `[LISTIFY] Category guard: template="${templateCategory}" vs page="${currentCategory}"`,
          );
          return { filledCount: 0, notFoundCount: 0, optionNotFoundCount: 0 };
        }
      }
    }

    let allInputs = getAllElementsDeep();
    let filledCount = 0,
      notFoundCount = 0,
      optionNotFoundCount = 0;
    const notFoundLabels = [],
      optionNotFoundLabels = [];
    const filledElements = new Set();

    // Separate fields into simple (parallel) and dropdown (sequential)
    const simpleFields = [];
    const dropdownFields = [];
    const deferredFields = [];

    console.log(
      `%c[LISTIFY FILL] ═══ Filling ${templateData.fields.length} fields (⚡ parallel mode) ═══`,
      "color: #2196F3; font-weight: bold; font-size: 13px",
    );

    for (let i = 0; i < templateData.fields.length; i++) {
      const field = templateData.fields[i];
      const fieldLabel =
        field.label ||
        field.name ||
        field.placeholder ||
        field.id ||
        "(unknown)";

      // Skip the "Form" dropdown — clicking it navigates/changes category on Meesho.
      // Use word-boundary test so "Form", "Form *", "Dosage Form", name="form" all match
      // without catching unrelated fields like "platform" or "information".
      const _fieldTokens = [
        field.label,
        field.name,
        field.placeholder,
        field.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (/\bform\b/.test(_fieldTokens)) {
        console.log(
          `%c[LISTIFY FILL]   ⏭ Skipping "form" dropdown (category-sensitive field, label="${fieldLabel}")`,
          "color:#888",
        );
        continue;
      }

      // Skip file/image fields — handled separately via sl_upload_images; touching
      // them here triggers Meesho's own upload validation and shows a popup error.
      if (field.type === "file" || field.type === "image") {
        console.log(`%c[LISTIFY FILL]   ⏭ Skipping file/image field "${fieldLabel}"`, "color:#888");
        continue;
      }

      const element = findElement(field, allInputs);

      if (!element) {
        deferredFields.push({ field, fieldLabel, fieldNum: i + 1 });
        continue;
      }

      // Never interact with file inputs — they trigger Meesho's upload validation popup.
      // Image uploads are dispatched separately via sl_upload_images after the fill.
      if (element.type === "file") {
        console.log(`%c[LISTIFY FILL]   ⏭ Skipping file input (DOM) "${fieldLabel}"`, "color:#888");
        continue;
      }

      // Never fill Flipkart nav menu inputs (Log Out, Switch Account, etc.)
      if (element.id && element.id.startsWith("checkMarkOption_")) {
        console.log(`%c[LISTIFY FILL]   ⏭ Skipping nav menu input "${fieldLabel}"`, "color:#888");
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

    // ── PHASE 1: Fill all simple fields in parallel (instant) ──
    if (simpleFields.length > 0) {
      console.log(
        `%c[LISTIFY FILL] ⚡ Phase 1: Filling ${simpleFields.length} simple fields in parallel`,
        "color: #9C27B0; font-weight: bold",
      );
      const t0 = performance.now();

      for (const { field, fieldLabel, element } of simpleFields) {
        if (_listifyAbortFill) break;
        try {
          if (
            element.type === "checkbox" ||
            element.type === "radio" ||
            (element.tagName === "DIV" && element.querySelector("svg"))
          ) {
            const valStr = String(field.value).toLowerCase();
            const shouldCheck =
              valStr === "true" || valStr === "on" || field.value === true;
            if (isCheckboxChecked(element) !== shouldCheck) {
              console.log(
                `[DEBUG SVG] fillForm (Phase 1): element needs to be checked (${shouldCheck}). Proceeding to clickCheckboxElement...`,
              );
              clickCheckboxElement(element);
            } else {
              console.log(
                `[DEBUG SVG] fillForm (Phase 1): element check state matches shouldCheck (${shouldCheck}). Skipping click.`,
              );
            }
            filledCount++;
            console.log(
              `%c[LISTIFY FILL]   ✓ "${fieldLabel}" → ${shouldCheck ? "CHECKED" : "UNCHECKED"}`,
              "color: #1a9e5a",
            );
          } else if (element.type === "file") {
            // Safety-net skip — file inputs should have been caught before Phase 1.
            // Interacting with them triggers Meesho's upload validation popup.
            console.log(`%c[LISTIFY FILL]   ⏭ Phase 1 skip file input "${fieldLabel}"`, "color:#888");
          } else {
            const val = String(field.value);
            setElementValue(element, val);
            filledCount++;
            console.log(
              `%c[LISTIFY FILL]   ✓ "${fieldLabel}" → "${val.slice(0, 40)}"`,
              "color: #1a9e5a",
            );
          }
        } catch (e) {
          console.warn(
            `%c[LISTIFY FILL]   ✗ "${fieldLabel}" ERROR: ${e.message}`,
            "color: #dc2626",
          );
        }
      }

      const t1 = performance.now();
      console.log(
        `%c[LISTIFY FILL] ⚡ Phase 1 done in ${Math.round(t1 - t0)}ms`,
        "color: #9C27B0; font-weight: bold",
      );

      // Brief pause for React/frameworks to process state changes
      await new Promise((r) => setTimeout(r, 100));
      allInputs = getAllElementsDeep();
    }

    // ── PHASE 2: Fill dropdowns sequentially (popups are singletons) ──
    // Sort size fields last — subsequent dropdowns trigger React re-renders that wipe size.
    // Filling size last means nothing runs after it to reset the value.
    dropdownFields.sort((a, b) => {
      const aIsSize = /\bsize\b/i.test(a.fieldLabel);
      const bIsSize = /\bsize\b/i.test(b.fieldLabel);
      if (aIsSize && !bIsSize) return 1;
      if (!aIsSize && bIsSize) return -1;
      return 0;
    });
    if (dropdownFields.length > 0) {
      console.log(
        `%c[LISTIFY FILL] ⏳ Phase 2: Filling ${dropdownFields.length} dropdowns sequentially (size fields last)`,
        "color: #FF9800; font-weight: bold",
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
          const multiVals =
            isSize && (val.includes(",") || val.includes("\n"))
              ? val
                  .split(/[\n,]+/)
                  .map((v) => v.trim())
                  .filter((v) => v.length > 0 && /[a-zA-Z0-9]/.test(v))
              : null;

          if (isSize) {
            const sizeVals = multiVals || [val];
            console.log(
              `%c[SIZE] ── "${fieldLabel}" ──────────────────────────────`,
              "color:#9C27B0; font-weight:bold",
            );
            console.log(
              `%c[SIZE]   target value(s): ${JSON.stringify(sizeVals)}`,
              "color:#9C27B0",
            );
            console.log(
              `%c[SIZE]   element tag="${element.tagName}" type="${element.type}" readonly=${element.readOnly} value="${element.value}"`,
              "color:#9C27B0",
            );
            console.log(
              `%c[SIZE]   element visible: offsetParent=${!!element.offsetParent} rect=${JSON.stringify(element.getBoundingClientRect())}`,
              "color:#9C27B0",
            );
            element.click();
            console.log(
              `%c[SIZE]   element.click() fired — waiting 300ms for popup...`,
              "color:#9C27B0",
            );
            await new Promise((r) => setTimeout(r, 300));
            const popup = await waitForAnyPopup(4000);
            if (popup) {
              console.log(
                `%c[SIZE]   popup found: <${popup.tagName} class="${popup.className}"> children=${popup.children.length}`,
                "color:#9C27B0",
              );
              const allTexts = Array.from(
                popup.querySelectorAll("span,li,label,button,p,h6"),
              )
                .map((e) => (e.textContent || "").trim())
                .filter((t) => t.length > 0 && t.length < 80);
              console.log(
                `%c[SIZE]   popup visible text options (first 20): ${JSON.stringify(allTexts.slice(0, 20))}`,
                "color:#9C27B0",
              );
              let anyFound = false;
              for (const singleVal of sizeVals) {
                await new Promise((r) => setTimeout(r, 100));
                const optEl = findOptionInPopup(popup, singleVal);
                if (optEl) {
                  console.log(
                    `%c[SIZE]   option found for "${singleVal}": <${optEl.tagName} class="${optEl.className}"> text="${(optEl.textContent || "").trim()}"`,
                    "color:#9C27B0",
                  );
                  clickPopupOption(optEl);
                  await new Promise((r) => setTimeout(r, 300));
                  anyFound = true;
                  console.log(
                    `%c[SIZE]   ✓ selected "${singleVal}" — element.value now="${element.value}"`,
                    "color:#1a9e5a; font-weight:bold",
                  );
                } else {
                  console.warn(
                    `%c[SIZE]   ✗ "${singleVal}" NOT FOUND in popup — check the text list above`,
                    "color:#dc2626",
                  );
                }
              }
              await new Promise((r) => setTimeout(r, 200));
              const applyBtn = findApplyInPopup(popup);
              console.log(
                `%c[SIZE]   applyBtn found: ${!!applyBtn}${applyBtn ? ` text="${(applyBtn.textContent || "").trim()}"` : ""}`,
                "color:#9C27B0",
              );
              if (applyBtn) {
                applyBtn.click();
                // Poll until the input reflects the selected value (up to 3s)
                const expectedVal = sizeVals[0];
                await new Promise((resolve) => {
                  if (element.value === expectedVal) {
                    resolve();
                    return;
                  }
                  const start = Date.now();
                  const iv = setInterval(() => {
                    if (
                      element.value === expectedVal ||
                      Date.now() - start > 3000
                    ) {
                      clearInterval(iv);
                      resolve();
                    }
                  }, 50);
                });
                console.log(
                  `%c[SIZE]   after applyBtn.click() — element.value="${element.value}"`,
                  "color:#9C27B0",
                );
              } else {
                console.warn(
                  `%c[SIZE]   ✗ no Apply/Done button found in popup — popup will stay open or selection lost`,
                  "color:#dc2626",
                );
              }
              if (anyFound) {
                filledCount++;
                console.log(
                  `%c[SIZE]   ✓ DONE "${fieldLabel}" → final element.value="${element.value}"`,
                  "color:#1a9e5a; font-weight:bold",
                );
                // Scroll the filled element into view and highlight it so the user
                // can visually confirm this is the correct size field on the page.
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                const prevOutline = element.style.outline;
                element.style.outline = "3px solid #4CAF50";
                setTimeout(() => {
                  element.style.outline = prevOutline;
                }, 3000);
              } else {
                optionNotFoundCount++;
                optionNotFoundLabels.push(fieldLabel);
                console.warn(
                  `%c[SIZE]   ✗ no options matched — field will remain empty`,
                  "color:#dc2626",
                );
              }
            } else {
              optionNotFoundCount++;
              optionNotFoundLabels.push(fieldLabel);
              console.warn(
                `%c[SIZE]   ✗ popup did NOT open after 4s — element.value="${element.value}"`,
                "color:#dc2626",
              );
              console.warn(
                `%c[SIZE]   Possible causes: element not clickable, wrong element found, popup uses different selector`,
                "color:#dc2626",
              );
              console.warn(
                `%c[SIZE]   All popups in DOM right now:`,
                "color:#dc2626",
              );
              [
                '[role="presentation"]',
                ".MuiPaper-root",
                ".MuiPopover-root",
                '[role="listbox"]',
              ].forEach((sel) => {
                const els = document.querySelectorAll(sel);
                if (els.length)
                  console.warn(
                    `%c[SIZE]     ${sel}: ${els.length} element(s)`,
                    "color:#dc2626",
                  );
              });
            }
          } else {
            // Multi-value dropdown: split on comma and select each item one by one.
            // Single-value fields (no comma) go through the same path with a 1-item array.
            const singleVals = val.includes(",")
              ? val.split(",").map((v) => v.trim()).filter(Boolean)
              : [val];

            // Open the dropdown once
            fireMouseEvents(element);
            await new Promise((r) => setTimeout(r, 200));

            let anyFound = false;
            let lastPopup = null;

            for (let vi = 0; vi < singleVals.length; vi++) {
              const singleVal = singleVals[vi];

              // Type this value into the search box
              const searchInput = findPopupSearchInput();
              if (searchInput) {
                typeIntoInput(searchInput, singleVal);
                await new Promise((r) => setTimeout(r, 100));
              }

              const popupResult = await waitForPopup(singleVal, 3000);
              if (popupResult) {
                const { textEl, popup } = popupResult;
                lastPopup = popup;
                clickPopupOption(textEl);
                await new Promise((r) => setTimeout(r, 200));
                anyFound = true;
                console.log(
                  `%c[LISTIFY FILL]   ✓ "${fieldLabel}" → "${singleVal}"${singleVals.length > 1 ? ` (${vi + 1}/${singleVals.length})` : ""} (dropdown)`,
                  "color: #1a9e5a",
                );

                // Clear search box for next value (popup stays open for multi-select)
                if (vi < singleVals.length - 1) {
                  const si = findPopupSearchInput();
                  if (si) {
                    typeIntoInput(si, "");
                    await new Promise((r) => setTimeout(r, 100));
                  }
                }
              } else {
                // Fallback: scan visible option elements
                const candidates = Array.from(
                  document.querySelectorAll(
                    'li, div[role="option"], span[role="option"], .MuiMenuItem-root, [role="listbox"] > *',
                  ),
                );
                let option = candidates.find((o) => (o.innerText || "").trim() === singleVal);
                if (!option) option = candidates.find((o) => (o.innerText || "").includes(singleVal));
                if (option) {
                  fireMouseEvents(option);
                  await new Promise((r) => setTimeout(r, 150));
                  lastPopup = option.closest('[role="presentation"]') || null;
                  anyFound = true;
                  console.log(
                    `%c[LISTIFY FILL]   ✓ "${fieldLabel}" → "${singleVal}" (fallback dropdown)`,
                    "color: #1a9e5a",
                  );
                } else {
                  optionNotFoundCount++;
                  optionNotFoundLabels.push(singleVals.length > 1 ? `${fieldLabel}:${singleVal}` : fieldLabel);
                  console.warn(
                    `%c[LISTIFY FILL]   ✗ "${fieldLabel}" → option "${singleVal}" NOT FOUND`,
                    "color: #dc2626",
                  );
                }
              }
            }

            // Click Apply / Done if the popup has one, then close
            if (lastPopup) {
              const applyBtn = findApplyInPopup(lastPopup);
              if (applyBtn) applyBtn.click();
            }
            if (anyFound) {
              filledCount++;
            }
          }

          // Close popup, then smart wait: only long wait if DOM changed
          await closeAllPopups();
          await new Promise((r) => setTimeout(r, 300));
          const newInputs = getAllElementsDeep();
          if (newInputs.length !== prevCount) {
            // DOM changed (new fields appeared), wait a bit longer
            await new Promise((r) => setTimeout(r, 500));
            allInputs = getAllElementsDeep();
          } else {
            allInputs = newInputs;
          }
        } catch (e) {
          console.warn(
            `%c[LISTIFY FILL]   ✗ "${fieldLabel}" ERROR: ${e.message}`,
            "color: #dc2626",
          );
        }
      }

      const t1 = performance.now();
      console.log(
        `%c[LISTIFY FILL] ⏳ Phase 2 done in ${Math.round(t1 - t0)}ms`,
        "color: #FF9800; font-weight: bold",
      );
    }

    // ── PHASE 3: Retry deferred fields (may have appeared after dropdown selections) ──
    if (deferredFields.length > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      allInputs = getAllElementsDeep();
      console.log(
        `%c[LISTIFY FILL] ── Retrying ${deferredFields.length} deferred fields (${allInputs.length} elements now) ──`,
        "color: #FF9800; font-weight: bold",
      );

      for (const { field, fieldLabel } of deferredFields) {
        if (_listifyAbortFill) break;
        const element = findElement(field, allInputs);
        if (!element) {
          notFoundCount++;
          notFoundLabels.push(fieldLabel);
          console.warn(
            `%c[LISTIFY FILL]   ✗ "${fieldLabel}" still NOT FOUND`,
            "color: #dc2626",
          );
          continue;
        }

        // Never interact with file inputs — they trigger Meesho's upload validation popup.
        if (element.type === "file") {
          console.log(`%c[LISTIFY FILL]   ⏭ Phase 3 skip file input "${fieldLabel}"`, "color:#888");
          continue;
        }

        // Never fill Flipkart nav menu inputs (Log Out, Switch Account, etc.)
        if (element.id && element.id.startsWith("checkMarkOption_")) {
          console.log(`%c[LISTIFY FILL]   ⏭ Skipping nav menu input "${fieldLabel}"`, "color:#888");
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
            const multiVals =
              isSize && (val.includes(",") || val.includes("\n"))
                ? val
                    .split(/[\n,]+/)
                    .map((v) => v.trim())
                    .filter((v) => v.length > 0 && /[a-zA-Z0-9]/.test(v))
                : null;

            if (isSize) {
              const sizeVals = multiVals || [val];
              console.log(
                `%c[SIZE RETRY] ── "${fieldLabel}" ──────────────────────────────`,
                "color:#FF9800; font-weight:bold",
              );
              console.log(
                `%c[SIZE RETRY]   target value(s): ${JSON.stringify(sizeVals)}`,
                "color:#FF9800",
              );
              console.log(
                `%c[SIZE RETRY]   element tag="${element.tagName}" type="${element.type}" readonly=${element.readOnly} value="${element.value}"`,
                "color:#FF9800",
              );
              element.click();
              console.log(
                `%c[SIZE RETRY]   element.click() fired — waiting 300ms for popup...`,
                "color:#FF9800",
              );
              await new Promise((r) => setTimeout(r, 300));
              const popup = await waitForAnyPopup(4000);
              if (popup) {
                console.log(
                  `%c[SIZE RETRY]   popup found: <${popup.tagName} class="${popup.className}"> children=${popup.children.length}`,
                  "color:#FF9800",
                );
                const allTexts = Array.from(
                  popup.querySelectorAll("span,li,label,button,p,h6"),
                )
                  .map((e) => (e.textContent || "").trim())
                  .filter((t) => t.length > 0 && t.length < 80);
                console.log(
                  `%c[SIZE RETRY]   popup options (first 20): ${JSON.stringify(allTexts.slice(0, 20))}`,
                  "color:#FF9800",
                );
                let anyFound = false;
                for (const singleVal of sizeVals) {
                  await new Promise((r) => setTimeout(r, 100));
                  const optEl = findOptionInPopup(popup, singleVal);
                  if (optEl) {
                    console.log(
                      `%c[SIZE RETRY]   option found for "${singleVal}": <${optEl.tagName}> text="${(optEl.textContent || "").trim()}"`,
                      "color:#FF9800",
                    );
                    clickPopupOption(optEl);
                    anyFound = true;
                    console.log(
                      `%c[SIZE RETRY]   ✓ selected "${singleVal}" — element.value now="${element.value}"`,
                      "color:#1a9e5a; font-weight:bold",
                    );
                  } else {
                    console.warn(
                      `%c[SIZE RETRY]   ✗ "${singleVal}" NOT FOUND — check options list above`,
                      "color:#dc2626",
                    );
                  }
                }
                await new Promise((r) => setTimeout(r, 200));
                const applyBtn = findApplyInPopup(popup);
                console.log(
                  `%c[SIZE RETRY]   applyBtn found: ${!!applyBtn}${applyBtn ? ` text="${(applyBtn.textContent || "").trim()}"` : ""}`,
                  "color:#FF9800",
                );
                if (applyBtn) {
                  applyBtn.click();
                  // Poll until the input reflects the selected value (up to 3s)
                  const expectedVal = sizeVals[0];
                  await new Promise((resolve) => {
                    if (element.value === expectedVal) {
                      resolve();
                      return;
                    }
                    const start = Date.now();
                    const iv = setInterval(() => {
                      if (
                        element.value === expectedVal ||
                        Date.now() - start > 3000
                      ) {
                        clearInterval(iv);
                        resolve();
                      }
                    }, 50);
                  });
                  console.log(
                    `%c[SIZE RETRY]   after applyBtn.click() — element.value="${element.value}"`,
                    "color:#FF9800",
                  );
                } else {
                  console.warn(
                    `%c[SIZE RETRY]   ✗ no Apply/Done button found`,
                    "color:#dc2626",
                  );
                }
                if (anyFound) {
                  filledCount++;
                  console.log(
                    `%c[SIZE RETRY]   ✓ DONE "${fieldLabel}" → final element.value="${element.value}"`,
                    "color:#1a9e5a; font-weight:bold",
                  );
                } else {
                  optionNotFoundCount++;
                  optionNotFoundLabels.push(fieldLabel);
                  console.warn(
                    `%c[SIZE RETRY]   ✗ no options matched — field will remain empty`,
                    "color:#dc2626",
                  );
                }
              } else {
                optionNotFoundCount++;
                optionNotFoundLabels.push(fieldLabel);
                console.warn(
                  `%c[SIZE RETRY]   ✗ popup did NOT open after 4s — element.value="${element.value}"`,
                  "color:#dc2626",
                );
                console.warn(
                  `%c[SIZE RETRY]   All popups in DOM:`,
                  "color:#dc2626",
                );
                [
                  '[role="presentation"]',
                  ".MuiPaper-root",
                  ".MuiPopover-root",
                  '[role="listbox"]',
                ].forEach((sel) => {
                  const els = document.querySelectorAll(sel);
                  if (els.length)
                    console.warn(
                      `%c[SIZE RETRY]     ${sel}: ${els.length} element(s)`,
                      "color:#dc2626",
                    );
                });
              }
            } else {
              const popupPromise = waitForPopup(val, 5000);
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
                  `%c[LISTIFY FILL]   ✓ "${fieldLabel}" → "${val}" (retry dropdown)`,
                  "color: #1a9e5a",
                );
              } else {
                optionNotFoundCount++;
                optionNotFoundLabels.push(fieldLabel);
                console.warn(
                  `%c[LISTIFY FILL]   ✗ "${fieldLabel}" → option "${val}" NOT FOUND (retry)`,
                  "color: #dc2626",
                );
              }
            }
            await closeAllPopups();
            await new Promise((r) => setTimeout(r, 300));
          } else {
            element.focus();
            if (
              element.type === "checkbox" ||
              element.type === "radio" ||
              (element.tagName === "DIV" && element.querySelector("svg"))
            ) {
              const valStr = String(field.value).toLowerCase();
              const shouldCheck =
                valStr === "true" || valStr === "on" || field.value === true;
              if (isCheckboxChecked(element) !== shouldCheck) {
                clickCheckboxElement(element);
              }
            } else {
              const val = String(field.value);
              setElementValue(element, val);
            }
            filledCount++;
            console.log(
              `%c[LISTIFY FILL]   ✓ "${fieldLabel}" → "${String(field.value).slice(0, 40)}" (retry)`,
              "color: #1a9e5a",
            );
          }
        } catch (e) {
          notFoundCount++;
          notFoundLabels.push(fieldLabel);
          console.warn(
            `%c[LISTIFY FILL]   ✗ "${fieldLabel}" retry ERROR: ${e.message}`,
            "color: #dc2626",
          );
        }
      }
    }

    // ── PHASE 4: Re-fill text fields after dropdowns ──
    // Phase 2 dropdown selections trigger React re-renders that wipe Phase 1 text values.
    // Re-filling them now (after all dropdowns are done) ensures they stick.
    if (simpleFields.length > 0) {
      await new Promise((r) => setTimeout(r, 300));
      allInputs = getAllElementsDeep();
      console.log(
        `%c[LISTIFY FILL] ♻ Phase 4: Re-filling ${simpleFields.length} simple fields after dropdowns`,
        "color: #9C27B0; font-weight: bold",
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
            `%c[LISTIFY FILL]   ♻ "${fieldLabel}" → "${val.slice(0, 40)}"`,
            "color: #9C27B0",
          );
        } catch (e) {
          /* silent */
        }
      }
    }

    // ── Final: Re-fill size fields only if wiped by React re-renders ──
    // Guard: skip if element.value already matches — avoids toggle-uncheck bug.
    const sizeFields = dropdownFields.filter(({ fieldLabel }) =>
      /\bsize\b/i.test(fieldLabel),
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
              `%c[SIZE FINAL]   ✓ "${fieldLabel}" already "${val}" — skipping`,
              "color:#1a9e5a",
            );
            continue;
          }
          console.log(
            `%c[SIZE FINAL]   "${fieldLabel}" wiped (current="${element.value}") — re-filling "${val}"`,
            "color:#FF9800; font-weight:bold",
          );
          const sizeVals =
            val.includes(",") || val.includes("\n")
              ? val
                  .split(/[\n,]+/)
                  .map((v) => v.trim())
                  .filter((v) => v.length > 0 && /[a-zA-Z0-9]/.test(v))
              : [val];
          element.click();
          await new Promise((r) => setTimeout(r, 300));
          const popup = await waitForAnyPopup(4000);
          if (popup) {
            for (const singleVal of sizeVals) {
              await new Promise((r) => setTimeout(r, 100));
              const optEl = findOptionInPopup(popup, singleVal);
              if (optEl) {
                clickPopupOption(optEl);
                await new Promise((r) => setTimeout(r, 300));
                console.log(
                  `%c[SIZE FINAL]   ✓ selected "${singleVal}"`,
                  "color:#1a9e5a",
                );
              } else {
                console.warn(
                  `%c[SIZE FINAL]   ✗ "${singleVal}" not found in popup`,
                  "color:#dc2626",
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
                  if (
                    element.value === sizeVals[0] ||
                    Date.now() - start > 3000
                  ) {
                    clearInterval(iv);
                    resolve();
                  }
                }, 50);
              });
              console.log(
                `%c[SIZE FINAL]   ✓ DONE "${fieldLabel}" → "${element.value}"`,
                "color:#1a9e5a; font-weight:bold",
              );
            }
          } else {
            console.warn(
              `%c[SIZE FINAL]   ✗ popup did not open for "${fieldLabel}"`,
              "color:#dc2626",
            );
          }
        } catch (e) {
          /* silent */
        }
      }
    }

    // ── PHASE 5: Fill any newly revealed fields (appeared after size selection) ──
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
        if (el.value === val) continue; // already correct
        const fieldLabel =
          field.label ||
          field.name ||
          field.placeholder ||
          field.id ||
          "(unknown)";
        try {
          setElementValue(el, val);
          phase5Count++;
          console.log(
            `%c[PHASE 5]   ✓ "${fieldLabel}" → "${val.slice(0, 40)}"`,
            "color: #00BCD4",
          );
        } catch (e) {
          console.warn(
            `%c[PHASE 5]   ✗ "${fieldLabel}" ERROR: ${e.message}`,
            "color: #dc2626",
          );
        }
      }
      if (phase5Count > 0)
        console.log(
          `%c[PHASE 5] Filled ${phase5Count} newly revealed fields`,
          "color: #00BCD4; font-weight:bold",
        );
    }

    // ── PHASE 6: Per-row dropdown fields (Chest Size [L], Length Size [M], etc.) ──
    // These are deferred custom dropdowns inside the per-size table.
    // Phase 3's regular handler may fail because MUI binds click on the wrapper div,
    // not the readonly <input>. We click the MuiInputBase-root wrapper, type into the
    // popup search, then pick the matching menu item.
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
          "color: #E91E63; font-weight:bold",
        );
        for (const field of rowDropdowns) {
          const val = String(field.value).trim();
          const fieldLabel = field.label || field.id || "(unknown)";
          const el = findElement(field, liveInputs);
          if (!el || !isCustomDropdown(el)) continue;
          if (el.value === val) {
            console.log(
              `%c[PHASE 6]   ✓ "${fieldLabel}" already "${val}" — skipping`,
              "color:#1a9e5a",
            );
            continue;
          }

          try {
            await closeAllPopups();
            await new Promise((r) => setTimeout(r, 200));

            // Click the MUI wrapper div (not the readonly input) to open dropdown
            const clickTarget =
              el.closest(".MuiInputBase-root") ||
              el.closest(".MuiFormControl-root") ||
              el;
            fireMouseEvents(clickTarget);
            await new Promise((r) => setTimeout(r, 500));

            // Wait for popup/menu to appear
            const popup = await waitForAnyPopup(4000);
            if (!popup) {
              console.warn(
                `%c[PHASE 6]   ✗ "${fieldLabel}" — popup did not open`,
                "color:#dc2626",
              );
              continue;
            }

            // Type into the search input inside the popup
            const searchInput = findPopupSearchInput();
            if (searchInput) {
              typeIntoInput(searchInput, val);
              await new Promise((r) => setTimeout(r, 500));
            }

            // Re-query popup contents after search filtering
            const optEl = findOptionInPopup(popup, val);
            if (optEl) {
              clickPopupOption(optEl);
              await new Promise((r) => setTimeout(r, 300));
              filledCount++;
              console.log(
                `%c[PHASE 6]   ✓ "${fieldLabel}" → "${val}"`,
                "color:#1a9e5a; font-weight:bold",
              );
            } else {
              // Fallback: search all visible menu items globally
              const menuItems = document.querySelectorAll(
                '[role="menuitem"] p, [role="option"] p, .MuiMenuItem-root p',
              );
              let found = false;
              for (const mi of menuItems) {
                if ((mi.textContent || "").trim() === val) {
                  clickPopupOption(mi);
                  await new Promise((r) => setTimeout(r, 300));
                  filledCount++;
                  found = true;
                  console.log(
                    `%c[PHASE 6]   ✓ "${fieldLabel}" → "${val}" (menuitem fallback)`,
                    "color:#1a9e5a; font-weight:bold",
                  );
                  break;
                }
              }
              if (!found) {
                console.warn(
                  `%c[PHASE 6]   ✗ "${fieldLabel}" — option "${val}" not found`,
                  "color:#dc2626",
                );
              }
            }

            await closeAllPopups();
            await new Promise((r) => setTimeout(r, 200));
          } catch (e) {
            console.warn(
              `%c[PHASE 6]   ✗ "${fieldLabel}" ERROR: ${e.message}`,
              "color:#dc2626",
            );
          }
        }
      }
    }

    // ── CHECKBOX FINAL: Re-check any checkboxes wiped by React re-renders ──
    {
      await new Promise((r) => setTimeout(r, 200));
      const liveInputs = getAllElementsDeep();
      const checkboxFields = templateData.fields.filter(
        (f) => f.type === "checkbox" || f.type === "radio",
      );
      console.log(
        `%c[CHECKBOX FINAL] Scanning ${checkboxFields.length} checkbox/radio fields`,
        "color:#FF9800; font-weight:bold",
      );
      for (const field of checkboxFields) {
        const fieldLabel =
          field.label ||
          field.name ||
          field.placeholder ||
          field.id ||
          "(unknown)";
        const valStr = String(field.value).toLowerCase();
        const shouldCheck =
          valStr === "true" || valStr === "on" || field.value === true;
        const el = findElement(field, liveInputs);
        if (!el) {
          console.warn(
            `%c[CHECKBOX FINAL] "${fieldLabel}" — element not found`,
            "color:#dc2626",
          );
          continue;
        }
        if (el.id && el.id.startsWith("checkMarkOption_")) continue;
        if (isCheckboxChecked(el) === shouldCheck) continue;
        console.log(
          `%c[CHECKBOX FINAL] "${fieldLabel}" — re-clicking`,
          "color:#FF9800; font-weight:bold",
        );
        clickCheckboxElement(el);
      }
      // Watchdog: verify checkbox state persisted after React may re-render
      if (checkboxFields.length > 0) {
        [500, 1000].forEach((delay) => {
          setTimeout(() => {
            const watchInputs = getAllElementsDeep();
            checkboxFields.forEach((field) => {
              const fieldLabel =
                field.label ||
                field.name ||
                field.placeholder ||
                field.id ||
                "(unknown)";
              const valStr = String(field.value).toLowerCase();
              const shouldCheck =
                valStr === "true" || valStr === "on" || field.value === true;
              const liveEl = findElement(field, watchInputs);
              if (!liveEl) {
                console.warn(
                  `%c[CB WATCH +${delay}ms] "${fieldLabel}" — NOT FOUND`,
                  "color:#dc2626",
                );
              } else if (liveEl.id && liveEl.id.startsWith("checkMarkOption_")) {
              } else if (liveEl.checked === shouldCheck) {
                console.log(
                  `%c[CB WATCH +${delay}ms] "${fieldLabel}" checked=${liveEl.checked} ✓ PERSISTED`,
                  "color:#1a9e5a",
                );
              } else {
                console.warn(
                  `%c[CB WATCH +${delay}ms] "${fieldLabel}" checked=${liveEl.checked} expected=${shouldCheck} ✗ WIPED`,
                  "color:#dc2626; font-weight:bold",
                );
              }
            });
          }, delay);
        });
      }
    }

    console.log(
      `%c[LISTIFY FILL] ═══ Done: ${filledCount} filled, ${notFoundCount} not found, ${optionNotFoundCount} options missed ═══`,
      "color: #2196F3; font-weight: bold; font-size: 13px",
    );
    if (notFoundLabels.length)
      console.log(
        `%c[LISTIFY FILL]   Missing: ${notFoundLabels.join(", ")}`,
        "color: #dc2626",
      );
    if (optionNotFoundLabels.length)
      console.log(
        `%c[LISTIFY FILL]   Options missed: ${optionNotFoundLabels.join(", ")}`,
        "color: #dc2626",
      );

    // Delayed size watchdog — re-queries live DOM each time to catch stale element references
    if (sizeFields.length > 0) {
      [500, 1000, 2000].forEach((delay) => {
        setTimeout(() => {
          const liveInputs = getAllElementsDeep();
          sizeFields.forEach(({ field, fieldLabel }) => {
            const expectedVal = String(field.value).trim();
            const liveEl = findElement(field, liveInputs);
            const liveVal = liveEl ? liveEl.value : "NOT FOUND";
            const connected = liveEl ? liveEl.isConnected : false;
            if (liveVal === expectedVal) {
              console.log(
                `%c[SIZE WATCH +${delay}ms]   "${fieldLabel}" live="${liveVal}" connected=${connected} ✓`,
                "color:#1a9e5a",
              );
            } else {
              console.warn(
                `%c[SIZE WATCH +${delay}ms]   "${fieldLabel}" WIPED live="${liveVal}" expected="${expectedVal}" connected=${connected} ✗`,
                "color:#dc2626; font-weight:bold",
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
      optionNotFoundLabels,
    };
  }

  // ── Category Auto-Detect ──
  // Runs on Meesho only. Captures category text from any click — no picker-context
  // restriction because Meesho's category selector uses custom DOM structures that
  // don't reliably carry standard ARIA roles or MUI class names.
  (function initCategoryDetector() {
    if (window !== window.top) return; // only run in the main frame, not iframes
    if (!window.location.hostname.includes("meesho")) return;

    // Note: We intentionally do NOT clear the stored category on page load.
    // The user selects the top-level category first, then navigates into
    // subcategory pages (causing new page loads + URL changes). Clearing here
    // would destroy the top-level category before the template is saved.

    // Text directly inside el — ignores child element text to stay precise
    function directText(el) {
      let t = "";
      el.childNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) t += n.textContent;
      });
      return t.replace(/\s+/g, " ").trim();
    }

    // Returns true only if the text looks like a real category name.
    function isValidCategoryText(text) {
      if (!text) return false;
      const t = text.trim();
      // 3–60 chars
      if (t.length < 3 || t.length > 60) return false;
      // Must contain at least one letter
      if (!/[a-zA-Z\u0900-\u097F]/.test(t)) return false;
      // No price/percent symbols
      if (/[₹$€£%]/.test(t)) return false;
      // Max 5 words — category names are short ("Home & Living", "Kids & Toys")
      if (t.split(/\s+/).length > 5) return false;

      const lower = t.toLowerCase();
      const words = lower.split(/\s+/);

      // ── Rule 1: exact phrase exclusions ──
      const excludedPhrases = new Set([
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
        "form field",
      ]);
      if (excludedPhrases.has(lower)) return false;

      // ── Rule 2: first word is an action verb → it's a button / link ──
      // Catches "Add Product Image", "Continue →", "Add Single Catalogue", etc.
      const actionVerbs = new Set([
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
        "scroll",
      ]);
      if (words.length > 0 && actionVerbs.has(words[0])) return false;

      return true;
    }

    // Short debounce: prevents a double-fire of the same click event from
    // writing the category twice. Does NOT permanently block other clicks.
    let _lastSaveTs = 0;

    // Category selection state — persisted in sessionStorage so the flags
    // survive SPA navigation and content-script re-injection on the same tab.
    // _catArmed: true after "Add Single Catalog" is clicked, cleared on first save.
    // _catLocked: true after the FIRST category click is saved; blocks all further
    //   category writes until the user clicks "Add Single Catalog" again.

    // --- PAGE REFRESH RESET LOGIC ---
    // If the user fully reloads the page (e.g. F5), we want to unlock the category
    // so they can fix a mistake without having to click "Add Single Catalog" again.
    const isPageReload = performance
      .getEntriesByType("navigation")
      .some((nav) => nav.type === "reload");
    if (isPageReload) {
      sessionStorage.removeItem("listify_cat_locked");
      sessionStorage.setItem("listify_cat_armed", "1");
    }

    let _catArmed = sessionStorage.getItem("listify_cat_armed") === "1";
    let _catLocked = sessionStorage.getItem("listify_cat_locked") === "1";

    // Returns true only when the clicked element is inside a specific category
    // selection container (using exact selectors) so that no other click on the
    // tab will accidentally save as a category limit.
    function isInCategoryList(target) {
      return !!target.closest('[data-testid="categoryTree"]');
    }

    // Walk up from clicked element and return category text.
    function detectCategory(target) {
      // On the dedicated /select-category page the category list IS the page
      // body — no modal wrapper exists. When armed, allow any click on that page
      // through (isValidCategoryText still filters action verbs and junk).
      const onCategoryPage =
        window.location.pathname.includes("select-category");
      if (!onCategoryPage && !isInCategoryList(target)) return null;
      if (onCategoryPage && !_catArmed) return null; // only capture when armed

      let el = target;
      for (
        let depth = 0;
        depth < 6 && el && el.tagName !== "BODY";
        depth++, el = el.parentElement
      ) {
        // 1. data-value attribute — most reliable (MUI sets this explicitly)
        const dv = (el.getAttribute("data-value") || "").trim();
        if (dv && isValidCategoryText(dv)) return dv;

        // 2. Direct text nodes only — no child element bleed
        const dt = directText(el);
        if (dt && isValidCategoryText(dt)) return dt;

        // 3. innerText fallback
        const it = (el.innerText || "")
          .replace(/[\n\r]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        // Filter out the outer container text which combines all options together
        if (it && isValidCategoryText(it) && it.length < 50) return it;
      }
      return null;
    }

    function saveStep(category) {
      if (!chrome.runtime?.id) return;

      // Debounce: prevents double-fire from the same click event
      const now = Date.now();
      if (now - _lastSaveTs < 300) return;
      _lastSaveTs = now;

      // Only save after "Add Single Catalog" has been clicked
      if (!_catArmed) {
        console.log(
          `%c[LISTIFY] Skipped (not armed): "${category}"`,
          "color:#aaa",
        );
        return;
      }

      // Once locked (by image upload), subsequent clicks in any lingering pickers are ignored
      if (_catLocked) {
        console.log(
          `%c[LISTIFY] Skipped (locked — category finalized on image upload): "${category}"`,
          "color:#aaa",
        );
        return;
      }

      sessionStorage.setItem("listify_tab_category", category);

      // Save per-tab — background keys it by tab ID so multiple tabs don't interfere
      try {
        chrome.runtime.sendMessage(
          { action: "save_tab_category", category },
          () => {
            if (chrome.runtime.lastError) return;
            console.log(
              `%c[LISTIFY] Category updated (unlocked): "${category}"`,
              "color:#4caf50;font-weight:bold",
            );
          },
        );
      } catch (_) {}
    }

    document.addEventListener(
      "click",
      (e) => {
        if (!chrome.runtime?.id) return;

        // Don't intercept clicks that are part of the autofill process —
        // programmatic dropdown clicks would otherwise re-arm the category
        // saver and overwrite the real category with dropdown option values.
        if (window.__listify_is_filling) return;

        // Ignore clicks directly on the Listify floating UI to prevent them
        // from accidentally clearing or interfering with the captured category
        if (e.target.closest('[id^="__listify"]')) return;

        const txt = (e.target.innerText || e.target.textContent || "")
          .trim()
          .toLowerCase();
        const aria = (e.target.getAttribute("aria-label") || "").toLowerCase();

        // "Add Single Catalog" click — ALWAYS re-arms the saver and resets the lock.
        if (
          txt.includes("add single") ||
          txt.includes("single catalog") ||
          txt.includes("single catalogue")
        ) {
          // If the user didn't explicitly click a category (i.e. it was auto-selected by Meesho),
          // scrape that blue auto-selected default right off the screen before leaving!
          // The blue active categories have `css-17tijmj` or `css-2kcxef` or an svg with color="#3C29B7"
          if (!sessionStorage.getItem("listify_tab_category")) {
            const activeEls = document.querySelectorAll(
              '[class*="css-17tijmj"] > div, [class*="css-2kcxef"] > div, div:has(> svg[color="#3C29B7"])',
            );

            if (activeEls.length > 0) {
              // The last one found in the DOM is the deepest subcategory
              const deepestCat = (
                activeEls[activeEls.length - 1].innerText || ""
              ).trim();
              if (deepestCat && !isGenericText(deepestCat)) {
                console.log(
                  `[LISTIFY] Scraped auto-selected default category: "${deepestCat}"`,
                );
                sessionStorage.setItem("listify_tab_category", deepestCat);
                try {
                  chrome.runtime.sendMessage({
                    action: "save_tab_category",
                    category: deepestCat,
                  });
                } catch (_) {}
              }
            }
          }

          _catArmed = true;
          _catLocked = false;
          _lastSaveTs = 0;
          sessionStorage.setItem("listify_cat_armed", "1");
          sessionStorage.removeItem("listify_cat_locked");

          console.log(
            "%c[LISTIFY] Add Single Catalog detected — heading to form.",
            "color:#ff4f1f",
          );
          return; // don't also run detectCategory on this same click
        }

        // Explicit reset: user clicks "Change Category" on the form
        const isResetClick =
          txt === "change category" ||
          txt === "change" ||
          aria === "back" ||
          e.target.closest('[aria-label="back"]');

        if (isResetClick && !isInCategoryList(e.target)) {
          _lastSaveTs = 0;
          _catArmed = true; // Re-arm so the next category click is captured
          _catLocked = false;
          sessionStorage.setItem("listify_cat_armed", "1");
          sessionStorage.removeItem("listify_cat_locked");
          sessionStorage.removeItem("listify_tab_category");
          try {
            chrome.runtime.sendMessage({ action: "clear_tab_category" });
          } catch (_) {}
        }

        const cat = detectCategory(e.target);
        if (cat) {
          saveStep(cat);
          // After clicking a category, the last column may auto-populate with
          // a deeper subcategory (e.g. "Vitamins & Mineral Capsules").
          // Wait for React to render, then check the last column for a leaf.
          setTimeout(() => {
            const leaf = scrapeLastColumnCategory();
            if (leaf && leaf !== cat) {
              saveStep(leaf);
            }
          }, 400);
        }
      },
      true,
    );

    // Listen for "Add Product Images" button click — scrape breadcrumb and lock category
    document.addEventListener(
      "click",
      (e) => {
        if (!chrome.runtime?.id) return;
        // Match the "Add Product Images" button by its text content
        const btn = e.target.closest("button");
        if (!btn) return;
        const btnText = (btn.textContent || "").trim().toLowerCase();
        if (!btnText.includes("add product image")) return;

        const leaf = scrapeBreadcrumbCategory();
        if (leaf) {
          console.log(
            `%c[LISTIFY] "Add Product Images" clicked — breadcrumb category: "${leaf}"`,
            "color:#ff4f1f;font-weight:bold",
          );
          sessionStorage.setItem("listify_tab_category", leaf);
          try {
            chrome.runtime.sendMessage({
              action: "save_tab_category",
              category: leaf,
            });
          } catch (_) {}
          _catLocked = true;
          _catArmed = false;
          sessionStorage.setItem("listify_cat_locked", "1");
          sessionStorage.removeItem("listify_cat_armed");
        }
      },
      true,
    );

    // Listen for image uploads to lock the category
    document.addEventListener(
      "change",
      (e) => {
        if (!chrome.runtime?.id) return;
        if (
          e.target &&
          e.target.type === "file" &&
          e.target.files &&
          e.target.files.length > 0
        ) {
          if (_catArmed && !_catLocked) {
            _catLocked = true;
            _catArmed = false;
            sessionStorage.setItem("listify_cat_locked", "1");
            sessionStorage.removeItem("listify_cat_armed");
            console.log(
              `%c[LISTIFY] Image uploaded! Category is now LOCKED.`,
              "color:#ff4f1f;font-weight:bold;font-size:14px;",
            );
          }
        }
      },
      true,
    );

    // React SPAs (like Meesho) call history.pushState/replaceState for client-side routing —
    // native popstate only fires for back/forward, not programmatic navigation.
    // We patch pushState + replaceState so we know exactly when the URL changes,
    // with zero polling overhead. Category is only cleared when the user leaves the
    // /add form entirely — sub-step URL changes within /add preserve the category.
    let _lastUrl = window.location.href;

    // Reads the leaf category from the LAST column of the category tree.
    // When a user clicks a mid-level category, the rightmost column auto-populates
    // with the deepest subcategory (e.g. "Vitamins & Mineral Capsules") — users
    // never click on it, so we scrape it from the DOM.
    function scrapeLastColumnCategory() {
      const tree = document.querySelector('[data-testid="categoryTree"]');
      if (!tree) return null;

      // Each column is a .css-jex737 wrapper; the last one is the deepest level
      const columns = tree.querySelectorAll(".css-jex737");
      if (columns.length === 0) return null;

      const lastCol = columns[columns.length - 1];

      // Look for the active item in the last column (css-17tijmj = final selected)
      const active = lastCol.querySelector('[class*="css-17tijmj"] > div');
      if (active) {
        const txt = (active.innerText || "").trim();
        if (txt && isValidCategoryText(txt)) return txt;
      }

      // Fallback: if the last column has exactly one item, it's the auto-selected leaf
      const items = lastCol.querySelectorAll(".css-yeouz0 > p");
      if (items.length === 1) {
        const txt = (items[0].innerText || "").trim();
        if (txt && isValidCategoryText(txt)) return txt;
      }

      return null;
    }

    // Reads the deepest active (blue-highlighted) category from the category tree.
    // Uses stable selectors in priority order:
    //   1. svg[color="#3C29B7"] — Meesho's brand purple, part of design system
    //   2. [data-testid="categoryTree"] active children
    //   3. CSS class fallbacks (fragile — change on Meesho deploys)
    function scrapeDefaultCategory() {
      // Highest priority: last column leaf (most accurate — deepest auto-selected subcategory)
      const lastColCat = scrapeLastColumnCategory();
      if (lastColCat) return lastColCat;

      // Fix 4: Scope search to categoryTree first (stable container), fall back to full page
      const tree =
        document.querySelector('[data-testid="categoryTree"]') || document.body;

      // Primary: purple SVG inside the category tree (Meesho's active-state color)
      const bysvg = tree.querySelectorAll('div:has(> svg[color="#3C29B7"])');
      if (bysvg.length > 0) {
        const deepest = bysvg[bysvg.length - 1];
        const txt = (deepest.innerText || "").trim();
        if (txt && isValidCategoryText(txt)) return txt;
      }

      // Fallback: CSS class names (auto-generated, may change on Meesho deploys)
      const byCss = tree.querySelectorAll(
        '[class*="css-17tijmj"] > div, [class*="css-2kcxef"] > div',
      );
      if (byCss.length > 0) {
        const txt = (byCss[byCss.length - 1].innerText || "").trim();
        if (txt && isValidCategoryText(txt)) return txt;
      }

      return null;
    }

    // Watches the category tree for the default auto-selected subcategory to appear,
    // then stores it immediately — no manual click needed.
    let _defaultCatObserver = null;
    function watchDefaultCategory() {
      if (_defaultCatObserver) {
        _defaultCatObserver.disconnect();
        _defaultCatObserver = null;
      }

      // Don't overwrite a category the user explicitly clicked —
      // UNLESS it looks like a stale "In [Category]" subtitle (from Your Categories card)
      const existing = sessionStorage.getItem("listify_tab_category") || "";
      if (existing && !/^in\s/i.test(existing)) {
        return;
      }

      // Try immediately in case the DOM is already rendered
      const immediate = scrapeDefaultCategory();
      if (immediate) {
        sessionStorage.setItem("listify_tab_category", immediate);
        try {
          chrome.runtime.sendMessage({
            action: "save_tab_category",
            category: immediate,
          });
        } catch (_) {}
        return;
      }

      // Otherwise watch for the category tree to render
      const giveUpAt = Date.now() + 8000; // stop after 8s
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
            chrome.runtime.sendMessage({
              action: "save_tab_category",
              category: cat,
            });
          } catch (_) {}
          _defaultCatObserver.disconnect();
          _defaultCatObserver = null;
        } else if (Date.now() > giveUpAt) {
          _defaultCatObserver.disconnect();
          _defaultCatObserver = null;
        }
      });
      _defaultCatObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // Start watching immediately if already on the category page
    // Fix 3: broaden URL check — Meesho's category page may not use 'select-category'
    const _isCategoryPage = () =>
      window.location.pathname.includes("select-category") ||
      window.location.pathname.includes("category") ||
      !!document.querySelector('[data-testid="categoryTree"]');

    if (_isCategoryPage()) {
      // On page reload while on the category page, clear old category
      // so the tree can be re-scraped with the current selection
      if (isPageReload) {
        sessionStorage.removeItem("listify_tab_category");
        try {
          chrome.runtime.sendMessage({ action: "clear_tab_category" });
        } catch (_) {}
      }
      watchDefaultCategory();
    }

    function _onSpaNav() {
      const newUrl = window.location.href;
      if (newUrl === _lastUrl) return;

      const wasOnForm = _lastUrl.includes("/add");
      const isOnForm = newUrl.includes("/add");
      _lastUrl = newUrl;

      // Fix 1: clear category FIRST, then call watchDefaultCategory
      // so it always runs with a clean sessionStorage
      if (wasOnForm && !isOnForm) {
        // User navigated away from the form — clear everything
        _catArmed = false;
        _catLocked = false;
        _lastSaveTs = 0;
        sessionStorage.removeItem("listify_cat_armed");
        sessionStorage.removeItem("listify_cat_locked");
        sessionStorage.removeItem("listify_tab_category");
        try {
          chrome.runtime.sendMessage({ action: "clear_tab_category" });
        } catch (_) {}
      }

      // Fix 3: watch for default category on any URL that looks like the category page
      if (newUrl.includes("select-category") || newUrl.includes("category")) {
        // Clear old category so the tree scrape picks up the new selection
        sessionStorage.removeItem("listify_tab_category");
        try {
          chrome.runtime.sendMessage({ action: "clear_tab_category" });
        } catch (_) {}
        // Re-arm so category clicks are captured
        _catArmed = true;
        _catLocked = false;
        sessionStorage.setItem("listify_cat_armed", "1");
        sessionStorage.removeItem("listify_cat_locked");
        watchDefaultCategory();
      }
    }

    const _origPush = history.pushState.bind(history);
    const _origReplace = history.replaceState.bind(history);
    history.pushState = function (...args) {
      _origPush(...args);
      _onSpaNav();
    };
    history.replaceState = function (...args) {
      _origReplace(...args);
      _onSpaNav();
    };
    window.addEventListener("popstate", _onSpaNav);

    console.log("[LISTIFY] Category tracking Active.");
  })();

  // ── Floating Save Button ──
  // Injects a branded FAB on Meesho pages. Clicking it scans the current
  // form and saves it as a template without opening the extension popup.
  // All styles use setProperty(...,'important') so Meesho CSS cannot interfere.
  (function initFloatingSaveButton() {
    if (window !== window.top) return; // only inject toolbar in the main frame, not iframes
    if (!window.location.hostname.includes("meesho")) return;
    if (document.getElementById("__listify_toolbar__")) return;

    const FONT = "'Inter',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI Variable','Segoe UI',Roboto,sans-serif";

    // Inject Inter @font-face (web_accessible_resource) so our toolbar renders in Inter
    // regardless of host page CSP.
    (function injectInterFont() {
      try {
        if (document.getElementById("__listify_inter_font__")) return;
        const fontUrl = chrome.runtime.getURL("fonts/inter-latin.woff2");
        const style = document.createElement("style");
        style.id = "__listify_inter_font__";
        style.textContent =
          "@font-face{font-family:'Inter';font-style:normal;font-weight:400 700;font-display:swap;src:url('" +
          fontUrl +
          "') format('woff2');}";
        (document.head || document.documentElement).appendChild(style);
      } catch (e) {}
    })();

    function sp(el, prop, val) {
      el.style.setProperty(prop, val, "important");
    }

    function applyStyles(el, styles) {
      Object.entries(styles).forEach(([k, v]) => sp(el, k, v));
    }

    // ── Autofill button ──
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
      "line-height": "1",
    });
    autofillBtn.addEventListener("mouseenter", () =>
      sp(autofillBtn, "box-shadow", "0 6px 22px rgba(26,158,90,0.55)"),
    );
    autofillBtn.addEventListener("mouseleave", () =>
      sp(autofillBtn, "box-shadow", "0 4px 18px rgba(26,158,90,0.4)"),
    );
    autofillBtn.addEventListener("mousedown", () =>
      sp(autofillBtn, "opacity", "0.85"),
    );
    autofillBtn.addEventListener("mouseup", () =>
      sp(autofillBtn, "opacity", "1"),
    );

    let _autofillOrigHTML = autofillBtn.innerHTML;

    autofillBtn.addEventListener("click", async (e) => {
      e.stopPropagation();

      // ── Stop mode: user clicked while fill is running ──
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
      // Keep button enabled so user can click to stop
      try {
        const domCategory = detectCurrentCategory();
        const sessionCategory =
          sessionStorage.getItem("listify_tab_category") || "";
        let storedCategory = "";
        try {
          const bgCat = await chrome.runtime.sendMessage({
            action: "get_my_tab_category",
          });
          storedCategory = (bgCat?.category || "").trim();
        } catch (_) {}
        const domCategory_resolved =
          sessionCategory || storedCategory || domCategory;

        const result = await chrome.runtime.sendMessage({
          action: "trigger_autofill",
          domCategory: domCategory_resolved,
        });
        if (result && result.ok && result.template) {
          if (window.__listify_abort_fill) return;
          showToast(`Filling from ${result.category} template`, "success");
          autofillBtn.innerHTML = `Filling…`;

          await fillForm(result.template, {
            resolvedCategory: result.category,
          });

          if (window.__listify_abort_fill) return;

          window.__listify_page_filled = true; // prevent storage.onChanged from re-triggering auto-fill
          chrome.runtime.sendMessage({
            action: "record_template_usage",
            templateId: result.template._id,
          });

          autofillBtn.innerHTML = `Done!`;
          setTimeout(() => {
            autofillBtn.innerHTML = _autofillOrigHTML;
            autofillBtn.disabled = false;
          }, 2000);
        } else if (result && result.error === "fill_limit_exceeded") {
          showToast(
            `You've used all ${result.fillLimit} free form fills this month. Upgrade to continue — aplusstudio.iprixmedia.com/dashboard/subscription`,
            "warning",
          );
          autofillBtn.innerHTML = _autofillOrigHTML;
          autofillBtn.disabled = false;
        } else if (result && result.error === "no_category_match") {
          showToast(`No template saved for "${result.category}"`, "warning");
          autofillBtn.innerHTML = _autofillOrigHTML;
          autofillBtn.disabled = false;
        } else {
          showToast((result && result.error) || "Fill failed.", "error");
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

    // ── Save Template button ──
    const fab = document.createElement("button");
    fab.id = "__listify_save_btn__";
    fab.title = "Save current form as an A+ Studio template";
    fab.innerHTML = `Save Template`;
    applyStyles(fab, {
      padding: "7px 14px",
      "border-radius": "8px",
      background: "#ff4f1f",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      outline: "none",
      "box-shadow": "0 2px 8px rgba(255,79,31,0.3)",
      display: "flex",
      "align-items": "center",
      "justify-content": "center",
      "font-size": "12px",
      "font-weight": "600",
      "font-family": FONT,
      "letter-spacing": "0.01em",
      "white-space": "nowrap",
      transition: "opacity 0.15s, box-shadow 0.15s",
      "line-height": "1",
    });
    fab.addEventListener("mouseenter", () =>
      sp(fab, "box-shadow", "0 6px 22px rgba(255,79,31,0.55)"),
    );
    fab.addEventListener("mouseleave", () =>
      sp(fab, "box-shadow", "0 4px 18px rgba(255,79,31,0.4)"),
    );
    fab.addEventListener("mousedown", () => sp(fab, "opacity", "0.85"));
    fab.addEventListener("mouseup", () => sp(fab, "opacity", "1"));

    // Track whether this page has already been auto-filled — prevents re-filling on
    // every category storage change (e.g. duplicate tabs, repeated storage writes).
    // Reset whenever the URL changes so a new product page starts fresh.
    window.__listify_page_filled = false;
    let _lastPageUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== _lastPageUrl) {
        _lastPageUrl = window.location.href;
        window.__listify_page_filled = false;
      }

      // Only show the FAB toolbar if on the /add form page
      const toolbar = document.getElementById("__listify_toolbar__");
      if (toolbar) {
        if (window.location.href.endsWith("/add")) {
          toolbar.style.setProperty("display", "flex", "important");
        } else {
          toolbar.style.setProperty("display", "none", "important");
        }
      }
    }, 1000);

    // React to future changes (user clicks a category) to automatically trigger fill if `autoFill` is ON
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      const catKey = Object.keys(changes).find((k) =>
        k.startsWith("listify_cat_"),
      );
      if (!catKey) return;

      const newCat = changes[catKey].newValue;
      if (newCat) {
        setTimeout(async () => {
          // Only the visible (active) tab should auto-fill.
          // Duplicate tabs share the same storage, so without this check
          // every open Meesho tab would trigger autofill simultaneously.
          if (document.visibilityState !== "visible") return;
          if (window.__listify_is_filling) return;
          if (window.__listify_page_filled) return; // already filled this page
          window.__listify_is_filling = true; // block category saves during network call + fill
          try {
            const stored = await chrome.storage.local.get([
              "listify_autofill_enabled",
            ]);
            if (stored.listify_autofill_enabled === false) {
              window.__listify_is_filling = false;
              return;
            }

            const domCategory = newCat || detectCurrentCategory();

            const result = await chrome.runtime.sendMessage({
              action: "trigger_autofill",
              domCategory,
              autoTriggered: true,
            });

            if (result && result.ok && result.template) {
              window.__listify_page_filled = true; // mark page as filled — no more auto-fills

              const origHTML = autofillBtn.innerHTML;
              autofillBtn.innerHTML = `Filling…`;
              autofillBtn.disabled = true;

              showToast(`Auto-filling ${result.category}…`, "info");

              const fillRes = await fillForm(result.template, {
                resolvedCategory: result.category,
              });
              chrome.runtime.sendMessage({
                action: "record_template_usage",
                templateId: result.template._id,
              });

              autofillBtn.innerHTML = `Done!`;
              setTimeout(() => {
                autofillBtn.innerHTML = origHTML;
                autofillBtn.disabled = false;
              }, 2000);

              const missed =
                (fillRes.optionNotFoundCount || 0) +
                (fillRes.notFoundCount || 0);
              const fillMsg =
                missed > 0
                  ? `Auto-filled ${fillRes.filledCount} field(s) · ${missed} missed`
                  : `Auto-filled ${fillRes.filledCount} field(s) ✓`;
              showToast(fillMsg, missed > 0 ? "warning" : "success");
            } else if (result && result.error === "fill_limit_exceeded") {
              showToast(
                `You've used all ${result.fillLimit} free form fills this month. Upgrade at aplusstudio.iprixmedia.com/dashboard/subscription`,
                "warning",
              );
            } else if (result && result.error === "no_category_match") {
              showToast(
                `No template saved for "${result.category}"`,
                "warning",
              );
            }
          } catch (e) {
            // Silent fail for network/runtime errors
          } finally {
            window.__listify_is_filling = false;
          }
        }, 2500); // Wait for React/MUI form to mount after clicking category
      }
    });

    // ── Backdrop ──
    const backdrop = document.createElement("div");
    backdrop.id = "__listify_save_modal__";
    applyStyles(backdrop, {
      display: "none",
      position: "fixed",
      inset: "0",
      "z-index": "2147483646",
      background: "rgba(0,0,0,0.38)",
      "align-items": "center",
      "justify-content": "center",
    });
    document.body.appendChild(backdrop);

    // ── Modal ──
    const modal = document.createElement("div");
    applyStyles(modal, {
      background: "#fff",
      "border-radius": "14px",
      padding: "22px",
      width: "300px",
      "box-shadow": "0 10px 40px rgba(0,0,0,0.22)",
      "font-family": FONT,
    });
    backdrop.appendChild(modal);

    function makeEl(tag, styles, text) {
      const el = document.createElement(tag);
      if (styles) applyStyles(el, styles);
      if (text !== undefined) el.textContent = text;
      return el;
    }

    // Modal header
    const head = makeEl("div", {
      display: "flex",
      "align-items": "center",
      "justify-content": "space-between",
      "margin-bottom": "16px",
    });
    head.appendChild(
      makeEl(
        "span",
        { "font-size": "15px", "font-weight": "700", color: "#111" },
        "Save Template",
      ),
    );
    head.appendChild(
      makeEl(
        "span",
        { "font-size": "12px", "font-weight": "600", color: "#ff4f1f" },
        "A+ Studio",
      ),
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
          "margin-top": "12px",
        },
        labelText,
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
        background: "#fff",
      });
      inp.id = inputId;
      inp.type = "text";
      inp.placeholder = placeholder;
      inp.addEventListener("focus", () =>
        sp(inp, "border", "1.5px solid #ff4f1f"),
      );
      inp.addEventListener("blur", () =>
        sp(inp, "border", "1.5px solid #e5e7eb"),
      );
      modal.appendChild(inp);
      return inp;
    }

    const nameInput = makeField(
      "Template name",
      "__lfy_name__",
      "e.g. Saree Listing",
    );
    nameInput.style.marginTop = "0";
    const catInput = makeField("Category", "__lfy_cat__", "e.g. Women Ethnic");
    catInput.readOnly = true;
    sp(catInput, "background", "#f9fafb");
    sp(catInput, "color", "#6b7280");
    sp(catInput, "cursor", "not-allowed");

    // Actions row
    const actions = makeEl("div", {
      display: "flex",
      gap: "8px",
      "margin-top": "16px",
    });
    modal.appendChild(actions);

    const saveBtn = makeEl(
      "button",
      {
        flex: "1",
        padding: "10px",
        background: "#ff4f1f",
        color: "#fff",
        border: "none",
        "border-radius": "8px",
        "font-size": "13px",
        "font-weight": "600",
        cursor: "pointer",
        "font-family": FONT,
      },
      "Save",
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
        "font-family": FONT,
      },
      "Cancel",
    );
    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    // Status line
    const statusMsg = makeEl("div", {
      "font-size": "12px",
      "margin-top": "10px",
      "min-height": "16px",
      color: "#888",
    });
    modal.appendChild(statusMsg);

    // ── Helpers ──
    function setStatus(msg, type) {
      statusMsg.textContent = msg;
      sp(
        statusMsg,
        "color",
        type === "ok" ? "#1a9e5a" : type === "err" ? "#dc2626" : "#888",
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

    // ── Events ──
    fab.addEventListener("click", async (e) => {
      e.stopPropagation();

      // 1. HIGHEST PRIORITY: breadcrumb on the form page (most reliable)
      const breadcrumbCat = scrapeBreadcrumbCategory();
      console.log(
        "[LISTIFY SAVE] Breadcrumb category:",
        breadcrumbCat || "(none)",
      );

      // 2. Try to read the genuine category from the live form page DOM
      const domCat = detectCurrentCategory();
      console.log("[LISTIFY SAVE] DOM detected category:", domCat || "(none)");

      // 3. Read from session storage (this tab's explicit state)
      const sessionCat = sessionStorage.getItem("listify_tab_category") || "";
      console.log("[LISTIFY SAVE] Session category:", sessionCat || "(none)");

      // Open modal immediately with synchronously available data so it appears
      // right on click — before any async background message (which can stall
      // while the service worker wakes up and cause the modal to appear only
      // when the user later clicks the extension icon, creating "cross-matching").
      const quickCat = breadcrumbCat || sessionCat || domCat;
      catInput.value = quickCat;
      nameInput.value =
        document.title.replace(/[-|–|:].*$/, "").trim() || "My Template";
      saveBtn.textContent = "Save";
      saveBtn.disabled = false;
      setStatus("");
      openModal();

      // 4. Update category from per-tab chrome.storage asynchronously (only if
      //    not already resolved above).
      if (!quickCat) {
        try {
          const bgRes = await chrome.runtime.sendMessage({
            action: "get_my_tab_category",
          });
          const storedCat = (bgRes?.category || "").trim();
          console.log(
            "[LISTIFY SAVE] Per-tab storage category:",
            storedCat || "(none)",
          );
          if (storedCat && !catInput.value) {
            catInput.value = storedCat;
            console.log("[LISTIFY SAVE] Using category:", storedCat);
          }
        } catch (_) {}
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
      saveBtn.textContent = "Scanning…";
      setStatus("");

      try {
        const formData = await scanForms();
        if (!formData.fields || formData.fields.length === 0) {
          setStatus("No form fields found on this page.", "err");
          saveBtn.disabled = false;
          saveBtn.textContent = "Save";
          return;
        }

        // ── Capture product image CDN URL ──
        const imgEl = findProductImageEl();
        let imageUrl = null;
        if (imgEl) {
          const src = imgEl.src || "";
          if (src.startsWith("http") && !src.startsWith("data:")) {
            imageUrl = src;
          }
          console.log(
            "[LISTIFY SAVE] Image URL captured:",
            imageUrl || "(none — blob or not found)",
          );
        }

        // Append image_url as a special field so it's stored in the template
        const fields = [...formData.fields];
        if (imageUrl) {
          fields.push({
            label: "image_url",
            value: imageUrl,
            type: "image",
            id: "",
            name: "image_url",
            placeholder: "",
            selector: 'input[type="file"]',
          });
        }

        saveBtn.textContent = "Saving…";
        const category = catInput.value.trim() || formData.category || "";
        console.log(
          "[LISTIFY SAVE] scanForms category:",
          formData.category || "(none)",
        );
        console.log(
          "[LISTIFY SAVE] catInput value:",
          catInput.value || "(none)",
        );
        console.log(
          "[LISTIFY SAVE] Final category sent to server:",
          category || "(none)",
        );
        console.log(
          "[LISTIFY SAVE] Total fields:",
          fields.length,
          imageUrl ? "(includes image_url)" : "(no image)",
        );

        // Send to background so the fetch bypasses Meesho's CSP
        const result = await chrome.runtime.sendMessage({
          action: "save_template",
          payload: { name, url: formData.domain, fields, category },
        });

        if (result && result.ok) {
          setStatus(`Saved! ${formData.fields.length} fields captured.`, "ok");
          saveBtn.textContent = "Saved ✓";
          setTimeout(closeModal, 1800);
        } else {
          setStatus((result && result.error) || "Save failed.", "err");
          saveBtn.disabled = false;
          saveBtn.textContent = "Save";
        }
      } catch (e) {
        setStatus(e.message || "Unexpected error.", "err");
        saveBtn.disabled = false;
        saveBtn.textContent = "Save";
      }
    });

    // ── AI Fill FAB ──
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
      "line-height": "1",
    });
    aiFab.addEventListener("mouseenter", () =>
      sp(aiFab, "box-shadow", "0 6px 22px rgba(124,58,237,0.55)"),
    );
    aiFab.addEventListener("mouseleave", () =>
      sp(aiFab, "box-shadow", "0 4px 18px rgba(124,58,237,0.4)"),
    );
    aiFab.addEventListener("mousedown", () => sp(aiFab, "opacity", "0.85"));
    aiFab.addEventListener("mouseup", () => sp(aiFab, "opacity", "1"));

    // ── AI Fill logic ──
    function findProductImageEl() {
      function isValidSrc(src) {
        return (
          src &&
          !src.startsWith("chrome-extension://") &&
          !src.startsWith("data:image/svg")
        );
      }
      function visibleEnough(img, minSize) {
        const r = img.getBoundingClientRect();
        return r.width >= minSize && r.height >= minSize;
      }

      // Priority 1: preview <img> near an image upload input — the actual uploaded product image
      for (const fi of document.querySelectorAll('input[type="file"]')) {
        let container = fi.parentElement;
        for (
          let d = 0;
          d < 6 && container;
          d++, container = container.parentElement
        ) {
          for (const img of container.querySelectorAll("img")) {
            const src = img.src || "";
            if (isValidSrc(src) && visibleEnough(img, 40)) return img;
          }
        }
      }

      // Priority 2: <img> inside a container whose class name suggests an upload/preview area
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
        '[class*="Thumbnail"] img',
      ];
      for (const sel of uploadSelectors) {
        for (const img of document.querySelectorAll(sel)) {
          const src = img.src || "";
          if (isValidSrc(src) && visibleEnough(img, 50)) return img;
        }
      }

      // Priority 3: any sufficiently large visible image (fallback)
      for (const img of document.querySelectorAll("img")) {
        const src = img.src || "";
        if (
          !src ||
          src.startsWith("chrome-extension://") ||
          img.closest('[id^="__listify"]')
        )
          continue;
        if (visibleEnough(img, 80)) return img;
      }

      return null;
    }

    // Convert any img element (including blob: URLs) to a base64 data URL
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
          canvas
            .getContext("2d")
            .drawImage(imgEl, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch (_) {
          resolve(null);
        }
      });
    }

    async function runAiFill() {
      const origHTML = aiFab.innerHTML;
      aiFab.innerHTML = `Scanning…`;
      aiFab.disabled = true;
      try {
        const category = detectCurrentCategory();

        // Collect filled form fields for context
        const formData = await scanForms();
        const fields = formData.fields
          .filter(
            (f) =>
              f.label &&
              f.value &&
              typeof f.value === "string" &&
              f.value.trim(),
          )
          .map((f) => ({ label: f.label, value: String(f.value).trim() }));

        // Find the product image and convert to base64 (handles blob: URLs)
        const imgEl = findProductImageEl();
        let imageUrl = null;
        if (imgEl) {
          const src = imgEl.src || "";
          // blob: URLs can't be sent to external APIs — convert to base64
          if (src.startsWith("blob:") || src.startsWith("data:")) {
            imageUrl = await imgToBase64(imgEl);
          } else {
            imageUrl = src;
          }
        }

        aiFab.innerHTML = `Generating…`;

        const result = await chrome.runtime.sendMessage({
          action: "ai_fill",
          category,
          fields,
          imageUrl,
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
            (k) =>
              label.includes(k) ||
              ph.includes(k) ||
              nm.includes(k) ||
              id.includes(k),
          );
        };
        if (title) {
          const el = allInputs.find(
            (el) =>
              (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
              matchesKw(el, ["title", "product name"]),
          );
          if (el) {
            setElementValue(el, title);
            filled++;
          }
        }
        if (description) {
          const el = allInputs.find(
            (el) =>
              (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
              matchesKw(el, ["description", "desc", "about", "detail"]),
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
          }, 2000);
        } else {
          showToast(
            "Title/description fields not found on this page.",
            "warning",
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

    // ── AI Icon buttons — sparkle icons injected inside field wrappers ──
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
            transition: "opacity 0.15s",
          },
          posOverrides,
        ),
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
        const category =
          detectCurrentCategory() ||
          sessionStorage.getItem("listify_tab_category") ||
          "";
        const formData = await scanForms();
        const fields = formData.fields
          .filter(
            (f) =>
              f.label &&
              f.value &&
              typeof f.value === "string" &&
              f.value.trim(),
          )
          .map((f) => ({ label: f.label, value: String(f.value).trim() }));
        const imgEl = findProductImageEl();
        let imageUrl = null;
        if (imgEl) {
          const src = imgEl.src || "";
          imageUrl =
            src.startsWith("blob:") || src.startsWith("data:")
              ? await imgToBase64(imgEl)
              : src;
        }
        const result = await chrome.runtime.sendMessage({
          action: "ai_fill",
          category,
          fields,
          imageUrl,
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
          const t = (
            getSurroundingText(el) +
            " " +
            (el.placeholder || "") +
            " " +
            (el.name || "") +
            " " +
            (el.id || "")
          ).toLowerCase();
          return kws.some((k) => t.includes(k));
        };
        let filled = 0;
        if (fillTitle && title) {
          const el = allLive.find(
            (e) =>
              (e.tagName === "INPUT" || e.tagName === "TEXTAREA") &&
              _kw(e, ["title", "product name"]),
          );
          if (el) {
            setElementValue(el, title);
            filled++;
          }
        }
        if (fillDesc && description) {
          const el =
            document.querySelector('textarea[name="comment"]') ||
            allLive.find(
              (e) =>
                e.tagName === "TEXTAREA" &&
                _kw(e, ["description", "desc", "about", "detail"]),
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
          }, 2000);
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
      const inputRoot =
        descTextarea.closest(".MuiOutlinedInput-root") ||
        descTextarea.parentElement;
      if (!inputRoot) return;
      sp(inputRoot, "position", "relative");
      // bottom-right corner inside the textarea
      const btn = _makeAiIconBtn(
        "__listify_ai_desc_btn__",
        "AI Fill Description",
        { bottom: "8px", top: "auto" },
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
        const t = (
          getSurroundingText(el) +
          " " +
          (el.placeholder || "") +
          " " +
          (el.name || "") +
          " " +
          (el.id || "")
        ).toLowerCase();
        return ["title", "product name"].some((k) => t.includes(k));
      });
      if (!titleEl) return;
      const inputRoot =
        titleEl.closest(".MuiOutlinedInput-root") || titleEl.parentElement;
      if (!inputRoot) return;
      sp(inputRoot, "position", "relative");
      // vertically centred on the right side inside the single-line input
      const btn = _makeAiIconBtn("__listify_ai_title_btn__", "AI Fill Title", {
        top: "50%",
        transform: "translateY(-50%)",
      });
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        e.preventDefault();
        await _runAiIconFill(btn, { fillTitle: true, fillDesc: false });
      });
      inputRoot.appendChild(btn);
    }

    // ── Drag handle + draggable behavior ──
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
        display: "flex", "align-items": "center", "justify-content": "center",
        padding: "6px 4px",
        [side === "right" ? "margin-left" : "margin-right"]: "2px",
        cursor: "grab", color: "#9ca3af", "border-radius": "6px",
        transition: "background 0.15s, color 0.15s",
        "user-select": "none", "-webkit-user-select": "none", "touch-action": "none",
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
            Math.min(Math.max(0, saved.top), maxY),
          );
        }
      } catch (_) {}

      handleList.forEach((handle) => {
        handle.addEventListener("pointerdown", (e) => {
          dragging = true;
          activeHandle = handle;
          try { handle.setPointerCapture(e.pointerId); } catch (_) {}
          const rect = toolbar.getBoundingClientRect();
          startX = e.clientX; startY = e.clientY;
          initLeft = rect.left; initTop = rect.top;
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
          try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
          sp(handle, "cursor", "grab");
          sp(toolbar, "transition", "");
          const rect = toolbar.getBoundingClientRect();
          try {
            localStorage.setItem(storageKey, JSON.stringify({ left: rect.left, top: rect.top }));
          } catch (_) {}
        }
        handle.addEventListener("pointerup", endDrag);
        handle.addEventListener("pointercancel", endDrag);
      });
    }

    // ── Toolbar injection ──
    // Injects a sticky toolbar at the bottom of the form containing all 3 buttons.
    // Re-injects if React removes it on re-render.
    function injectToolbar() {
      if (document.getElementById("__listify_toolbar__")) return; // already present

      const toolbar = document.createElement("div");
      toolbar.id = "__listify_toolbar__";
      const onAdd = window.location.href.endsWith("/add");
      console.log(
        `[LISTIFY TOOLBAR] Injecting toolbar. URL: "${window.location.href}" onAdd=${onAdd}`,
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
        "backdrop-filter": "saturate(180%) blur(8px)",
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
        `[LISTIFY TOOLBAR] Injected. display=${toolbar.style.display}`,
      );
    }

    // Inject immediately and re-inject if removed
    injectToolbar();
    injectAiDescButton();
    injectAiTitleButton();
    const _toolbarObserver = new MutationObserver(() => {
      if (!document.getElementById("__listify_toolbar__")) injectToolbar();
      if (!document.getElementById("__listify_ai_desc_btn__"))
        injectAiDescButton();
      if (!document.getElementById("__listify_ai_title_btn__"))
        injectAiTitleButton();
    });
    _toolbarObserver.observe(document.body, { childList: true, subtree: true });
  })();
})();

