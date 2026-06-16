function detectMarketplace() {
  const host = location.hostname.toLowerCase();
  if (host.includes("meesho")) return "meesho";
  if (host.includes("flipkart")) return "flipkart";
  if (host.includes("amazon")) return "amazon";
  return "unknown";
}

const blockedField = /(password|otp|cookie|token|payment|card|cvv|upi|bank|account|secret|private)/i;

function fieldSelector(field) {
  if (field.id) return `#${CSS.escape(field.id)}`;
  if (field.name) return `${field.tagName.toLowerCase()}[name="${CSS.escape(field.name)}"]`;
  const all = Array.from(document.querySelectorAll(field.tagName.toLowerCase()));
  const index = all.indexOf(field) + 1;
  return `${field.tagName.toLowerCase()}:nth-of-type(${Math.max(index, 1)})`;
}

function fieldLabel(field) {
  const explicit = field.id ? document.querySelector(`label[for="${CSS.escape(field.id)}"]`) : null;
  const wrapped = field.closest("label");
  const nearby = field.closest("[class], [data-testid], [role]")?.querySelector("label, span, p");
  return (
    explicit?.textContent ||
    wrapped?.textContent ||
    field.getAttribute("aria-label") ||
    field.getAttribute("placeholder") ||
    nearby?.textContent ||
    field.name ||
    field.id ||
    "Listing field"
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function fieldKey(label, field) {
  return (field.name || field.id || label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}

function collectFields() {
  return Array.from(document.querySelectorAll("input, textarea, select"))
    .filter((field) => {
      const type = (field.getAttribute("type") || field.tagName).toLowerCase();
      const label = fieldLabel(field);
      return !["hidden", "password", "submit", "button", "reset", "file"].includes(type) && !blockedField.test(`${label} ${field.name} ${field.id}`);
    })
    .map((field) => {
      const label = fieldLabel(field);
      return {
        key: fieldKey(label, field),
        label,
        value: field.value || "",
        selector: fieldSelector(field),
        inputType: (field.getAttribute("type") || field.tagName || "text").toLowerCase(),
        required: Boolean(field.required || field.getAttribute("aria-required") === "true"),
        confidence: field.name || field.id ? 0.9 : 0.7,
        groupName: "Listing fields",
      };
    });
}

function collectImages() {
  return Array.from(document.images)
    .map((image) => image.currentSrc || image.src)
    .filter((src) => src && !src.startsWith("data:"))
    .slice(0, 12)
    .map((url) => ({ url, source: "page" }));
}

function valuesFromTemplate(fields) {
  return (fields || []).reduce((acc, field) => {
    const key = String(field.key || field.label || "").toLowerCase();
    if (key) acc[key] = field.value || "";
    return acc;
  }, {});
}

function setNativeValue(element, value) {
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  if (descriptor?.set) descriptor.set.call(element, value);
  else element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function autofillTemplate(fields) {
  const pageFields = collectFields();
  const values = valuesFromTemplate(fields);
  const filled = [];
  for (const field of pageFields) {
    const haystack = `${field.key} ${field.label}`.toLowerCase();
    const match = Object.entries(values).find(([key, value]) => value && (haystack.includes(key) || key.includes(field.key)));
    if (match) {
      const element = document.querySelector(field.selector);
      if (element) {
        setNativeValue(element, String(match[1]));
        filled.push({ key: field.key, label: field.label, value: match[1] });
      }
    }
  }
  return { filledCount: filled.length, filled, marketplace: detectMarketplace(), url: location.href };
}

// PREMIUM FLOATING ACTION BAR LAYOUT & IN-PAGE MODALS

function getFloatingBarStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

    .floating-bar {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 16px;
      background-color: #ffffff;
      border: 1px solid #eaeaea;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      border-radius: 99px;
      padding: 10px 24px;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes slideUp {
      from { transform: translate(-50%, 100px); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-right: 12px;
      border-right: 1px solid #eeeeee;
    }

    .logo-icon {
      width: 24px;
      height: 24px;
      background-color: #121212;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 800;
      font-size: 13px;
    }

    .logo-text {
      font-size: 13px;
      font-weight: 700;
      color: #121212;
    }

    .btn-fill {
      background-color: #121212;
      color: #ffffff;
      border: none;
      border-radius: 99px;
      padding: 8px 18px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-fill:hover {
      background-color: #333333;
    }

    .btn-save {
      background-color: #ffffff;
      color: #121212;
      border: 1px solid #dcdfe4;
      border-radius: 99px;
      padding: 8px 18px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-save:hover {
      background-color: #f5f5f5;
      border-color: #cccccc;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 16px;
      font-weight: 700;
      color: #999999;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      transition: all 0.2s ease;
    }

    .btn-close:hover {
      background-color: #f0f0f0;
      color: #333333;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(2px);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', -apple-system, sans-serif;
    }

    .modal-card {
      background-color: #ffffff;
      border: 1px solid #eaeaea;
      border-radius: 20px;
      padding: 24px;
      width: 440px;
      max-width: 90%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fadeInScale {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .modal-title {
      font-size: 16px;
      font-weight: 700;
      color: #121212;
    }

    .modal-desc {
      font-size: 11px;
      color: #666666;
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 180px;
      overflow-y: auto;
      padding-right: 6px;
    }

    .field-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #333;
    }

    .field-item input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .input-text {
      width: 100%;
      font-family: inherit;
      font-size: 13px;
      padding: 10px 14px;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      outline: none;
      box-sizing: border-box;
    }

    .input-text:focus {
      border-color: #121212;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      border-top: 1px solid #f2f2f2;
      padding-top: 14px;
    }

    .btn-modal-primary {
      background-color: #121212;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 9px 16px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-modal-primary:hover {
      background-color: #333333;
    }

    .btn-modal-secondary {
      background-color: #ffffff;
      color: #666666;
      border: 1px solid #dcdfe4;
      border-radius: 8px;
      padding: 9px 16px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-modal-secondary:hover {
      background-color: #f5f5f5;
    }

    .modal-body::-webkit-scrollbar {
      width: 4px;
    }
    .modal-body::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 2px;
    }
    .modal-body::-webkit-scrollbar-thumb {
      background: #cccccc;
      border-radius: 2px;
    }
  `;
}

function openSaveTemplateModal(shadow) {
  const fields = collectFields();
  const marketplace = detectMarketplace();
  if (fields.length === 0) {
    alert("No form fields detected on this page to save.");
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <span class="modal-title">Save Form as Template</span>
        <span class="modal-desc">Type a name and choose the captured fields to save to your templates.</span>
      </div>
      <input type="text" class="input-text" id="modal-tpl-name" value="${marketplace.toUpperCase()} Template - ${new Date().toLocaleDateString()}" />
      <div class="modal-body" id="modal-fields-list">
        ${fields.map((field, idx) => `
          <div class="field-item">
            <input type="checkbox" id="chk-${idx}" checked data-idx="${idx}" />
            <label for="chk-${idx}"><strong>${field.label || field.key}</strong> (Value: "${field.value || 'empty'}")</label>
          </div>
        `).join("")}
      </div>
      <div class="modal-footer">
        <button class="btn-modal-secondary" id="modal-cancel">Cancel</button>
        <button class="btn-modal-primary" id="modal-save">Save Template</button>
      </div>
    </div>
  `;
  shadow.appendChild(overlay);

  overlay.querySelector("#modal-cancel").addEventListener("click", () => {
    overlay.remove();
  });

  overlay.querySelector("#modal-save").addEventListener("click", async () => {
    const tplName = overlay.querySelector("#modal-tpl-name").value.trim();
    if (!tplName) {
      alert("Please enter a template name.");
      return;
    }

    const selectedFields = [];
    overlay.querySelectorAll('#modal-fields-list input[type="checkbox"]:checked').forEach((chk) => {
      const idx = parseInt(chk.dataset.idx);
      selectedFields.push(fields[idx]);
    });

    if (selectedFields.length === 0) {
      alert("Please select at least one field to save.");
      return;
    }

    overlay.querySelector("#modal-save").textContent = "Saving...";
    overlay.querySelector("#modal-save").disabled = true;

    chrome.runtime.sendMessage({
      type: "APLUS_API_CALL",
      path: "/api/extension/capture-template",
      options: {
        method: "POST",
        body: JSON.stringify({
          name: tplName,
          platform: marketplace,
          capturedFromUrl: location.href,
          fields: selectedFields,
          images: collectImages()
        })
      }
    }, (res) => {
      overlay.remove();
      if (res?.ok) {
        alert(`Successfully saved template "${tplName}" with ${selectedFields.length} fields.`);
      } else {
        alert(res?.error || "Failed to save template.");
      }
    });
  });
}

function openFillPreviewModal(shadow) {
  chrome.runtime.sendMessage({
    type: "APLUS_API_CALL",
    path: "/api/extension/templates"
  }, (res) => {
    if (!res?.ok || !res?.data?.items?.length) {
      alert("No templates found. Capture a template first before autofilling.");
      return;
    }

    const templatesList = res.data.items;
    
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Autofill Listing Form</span>
          <span class="modal-desc">Select a saved template to preview and fill the form.</span>
        </div>
        <select class="input-text" id="modal-tpl-select" style="margin-bottom: 8px;">
          ${templatesList.map((tpl) => `
            <option value="${tpl._id}">${tpl.name} (${tpl.platform})</option>
          `).join("")}
        </select>
        <div class="modal-header" style="margin-top: 4px;">
          <span class="modal-title" style="font-size: 13px;">Preview Matching Fields</span>
        </div>
        <div class="modal-body" id="modal-fill-preview" style="max-height: 140px;">
          <!-- Populated dynamically -->
        </div>
        <div class="modal-footer">
          <button class="btn-modal-secondary" id="modal-cancel">Cancel</button>
          <button class="btn-modal-primary" id="modal-fill">Confirm Fill</button>
        </div>
      </div>
    `;
    shadow.appendChild(overlay);

    overlay.querySelector("#modal-cancel").addEventListener("click", () => {
      overlay.remove();
    });

    const select = overlay.querySelector("#modal-tpl-select");
    const previewContainer = overlay.querySelector("#modal-fill-preview");

    function updatePreview() {
      const tplId = select.value;
      const tpl = templatesList.find(t => t._id === tplId);
      if (!tpl) return;

      const pageFields = collectFields();
      const templateValues = valuesFromTemplate(tpl.fields);
      
      let html = "";
      let matchCount = 0;
      
      for (const field of pageFields) {
        const haystack = `${field.key} ${field.label}`.toLowerCase();
        const match = Object.entries(templateValues).find(([key, value]) => value && (haystack.includes(key) || key.includes(field.key)));
        
        if (match) {
          matchCount++;
          html += `
            <div style="font-size: 11px; display: flex; flex-direction: column; gap: 2px; border-bottom: 1px solid #f9f9f9; padding-bottom: 4px; text-align: left;">
              <span style="font-weight: 700; color: #121212;">${field.label || field.key}</span>
              <span style="color: #666;">Value: "${match[1]}"</span>
            </div>
          `;
        }
      }

      if (matchCount === 0) {
        previewContainer.innerHTML = `<div style="font-size: 12px; color: #999; text-align: center; padding: 12px 0;">No matching fields found for this template.</div>`;
      } else {
        previewContainer.innerHTML = `<div style="display: flex; flex-direction: column; gap: 6px;">${html}</div>`;
      }
    }

    select.addEventListener("change", updatePreview);
    updatePreview();

    overlay.querySelector("#modal-fill").addEventListener("click", () => {
      const tplId = select.value;
      const selectedTpl = templatesList.find(t => t._id === tplId);
      if (!selectedTpl) return;

      overlay.querySelector("#modal-fill").textContent = "Checking limit...";
      overlay.querySelector("#modal-fill").disabled = true;

      // Check allowance
      chrome.runtime.sendMessage({
        type: "APLUS_API_CALL",
        path: "/api/extension/detect-allowance",
        options: {
          method: "POST",
          body: JSON.stringify({
            platform: detectMarketplace(),
            url: location.href,
            action: "autofill"
          })
        }
      }, (allowanceRes) => {
        if (!allowanceRes?.ok || !allowanceRes?.data?.canAutofill) {
          overlay.remove();
          alert("Free listing limit reached. Upgrade to continue autofilling.");
          return;
        }

        // Run autofill
        const result = autofillTemplate(selectedTpl.fields);
        
        if (result.filledCount === 0) {
          overlay.remove();
          alert("No matching fields could be autofilled.");
          return;
        }

        // Log success metric to consume quota & trigger limits emails
        chrome.runtime.sendMessage({
          type: "APLUS_API_CALL",
          path: "/api/extension/autofill-success",
          options: {
            method: "POST",
            body: JSON.stringify({
              platform: result.marketplace,
              url: result.url,
              templateId: selectedTpl._id,
              title: selectedTpl.name,
              fields: result.filled.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {})
            })
          }
        }, (successRes) => {
          overlay.remove();
          if (successRes?.ok) {
            alert(`Autofilled ${result.filledCount} fields successfully and consumed 1 listing credit.`);
          } else {
            alert(`Filled form fields, but quota update failed: ${successRes?.error || "Unknown error"}`);
          }
        });
      });
    });
  });
}

function injectFloatingBar() {
  if (document.getElementById("aplus-floating-root")) return;

  const container = document.createElement("div");
  container.id = "aplus-floating-root";
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: "open" });
  
  const style = document.createElement("style");
  style.textContent = getFloatingBarStyles();
  shadow.appendChild(style);

  const bar = document.createElement("div");
  bar.className = "floating-bar";
  bar.innerHTML = `
    <div class="brand-section">
      <div class="logo-icon">A+</div>
      <span class="logo-text">A+ Studio</span>
    </div>
    <button class="btn-fill" id="action-fill">Fill Listing</button>
    <button class="btn-save" id="action-save">Save Template</button>
    <button class="btn-close" id="action-close">×</button>
  `;
  shadow.appendChild(bar);

  shadow.getElementById("action-close").addEventListener("click", () => {
    container.remove();
  });

  shadow.getElementById("action-save").addEventListener("click", () => {
    openSaveTemplateModal(shadow);
  });

  shadow.getElementById("action-fill").addEventListener("click", () => {
    openFillPreviewModal(shadow);
  });
}

function injectLoginPromptBar() {
  if (document.getElementById("aplus-floating-root")) return;

  const container = document.createElement("div");
  container.id = "aplus-floating-root";
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: "open" });
  
  const style = document.createElement("style");
  style.textContent = getFloatingBarStyles();
  shadow.appendChild(style);

  const bar = document.createElement("div");
  bar.className = "floating-bar";
  bar.innerHTML = `
    <div class="brand-section">
      <div class="logo-icon">A+</div>
      <span class="logo-text">A+ Studio</span>
    </div>
    <span style="font-size: 12px; color: #666; font-weight: 600;">Log in to extension to enable Autofill & Templates.</span>
    <button class="btn-close" id="action-close">×</button>
  `;
  shadow.appendChild(bar);

  shadow.getElementById("action-close").addEventListener("click", () => {
    container.remove();
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "APLUS_DETECT") {
    sendResponse({
      marketplace: detectMarketplace(),
      url: location.href,
      fields: collectFields(),
      images: collectImages(),
    });
    return true;
  }
  if (message?.type === "APLUS_AUTOFILL_TEMPLATE") {
    sendResponse(autofillTemplate(message.fields || []));
    return true;
  }
  return false;
});

// Automatically trigger floating bar injection on target marketplaces
const marketplace = detectMarketplace();
if (marketplace !== "unknown") {
  setTimeout(() => {
    chrome.runtime.sendMessage({ type: "APLUS_API_CALL", path: "/api/extension/status" }, (response) => {
      if (response?.ok && response?.data?.connected) {
        injectFloatingBar();
      } else {
        injectLoginPromptBar();
      }
    });
  }, 1200);
}
