const apiBase = globalThis.APLUS_CONFIG?.apiBase || "http://localhost:3000";
const $ = (selector) => document.querySelector(selector);

let captured = null;
let templates = [];

function setStatus(message, error = false) {
  const el = $("#status");
  el.textContent = message || "";
  el.classList.toggle("error", error);
}

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, { credentials: "include", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || "Request failed"), { data });
  return data;
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToTab(message) {
  const tab = await activeTab();
  return chrome.tabs.sendMessage(tab.id, message);
}

function renderUsage(usage, keywordUsage) {
  if (!usage) return;
  $("#plan").textContent = `${usage.plan} plan`;
  $("#usageText").textContent = `${usage.used} of ${usage.limit === -1 ? "∞" : usage.limit}`;
  const width = usage.limit === -1 ? 15 : Math.min(100, Math.round((usage.used / usage.limit) * 100));
  $("#usageBar").style.width = `${width}%`;

  if (keywordUsage) {
    $("#keywordUsageText").textContent = `${keywordUsage.used} of ${keywordUsage.limit === -1 ? "∞" : keywordUsage.limit}`;
    const kwWidth = keywordUsage.limit === -1 ? 15 : Math.min(100, Math.round((keywordUsage.used / keywordUsage.limit) * 100));
    const kwBar = $("#keywordUsageBar");
    if (kwBar) kwBar.style.width = `${kwWidth}%`;
  }
}

function showWorkspace(show) {
  $("#workspace").classList.toggle("hidden", !show);
  $("#login").classList.toggle("hidden", show);
}

function renderCapturedFields(fields) {
  const preview = $("#fieldPreview");
  preview.innerHTML = "";
  if (!fields || fields.length === 0) {
    preview.innerHTML = `
      <div class="empty-state">
        <p>No fields captured yet.</p>
        <small>Go to "Autofill" tab and click "Scan Form" to fetch marketplace inputs.</small>
      </div>
    `;
    return;
  }
  fields.slice(0, 40).forEach((field, index) => {
    const label = document.createElement("label");
    label.textContent = field.label || field.key || `Field ${index + 1}`;
    const input = document.createElement("input");
    input.value = field.value || "";
    input.dataset.index = String(index);
    input.addEventListener("input", () => {
      captured.fields[index].value = input.value;
    });
    label.appendChild(input);
    preview.appendChild(label);
  });
  $("#fieldCount").textContent = `Captured Fields (${fields.length})`;
}

async function detectPage() {
  try {
    const data = await sendToTab({ type: "APLUS_DETECT" });
    $("#marketplace").textContent = data?.marketplace || "unknown";
    return data;
  } catch {
    $("#marketplace").textContent = "unsupported page";
    return null;
  }
}

async function loadStatus() {
  try {
    const data = await api("/api/extension/status");
    $("#session").textContent = `Connected as ${data.user.name || data.user.email}`;
    renderUsage(data.usage, data.keywordUsage);
    showWorkspace(true);
    await detectPage();
    await loadTemplates();
  } catch {
    $("#session").textContent = "Login required";
    showWorkspace(false);
  }
}

async function loadTemplates() {
  try {
    const data = await api("/api/extension/templates");
    templates = data.items || [];
    const select = $("#templateSelect");
    select.innerHTML = "";
    templates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template._id;
      option.textContent = `${template.name} (${template.platform || "meesho"})`;
      select.appendChild(option);
    });
    $("#templateSelectWrap").classList.toggle("hidden", templates.length === 0);
    return templates;
  } catch (err) {
    console.error("Failed to load templates:", err);
  }
}

// Tab Switching Listener
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.add("hidden"));
    
    btn.classList.add("active");
    const tabId = btn.dataset.tab;
    $(`#${tabId}`).classList.remove("hidden");
  });
});

$("#login").addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Logging in...");
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    await api("/api/extension/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setStatus("Login successful.");
    await loadStatus();
  } catch (error) {
    setStatus(error.data?.error || "Login failed.", true);
  }
});

$("#capture").addEventListener("click", async () => {
  setStatus("Scanning listing form...");
  const data = await detectPage();
  if (!data?.fields?.length) {
    setStatus("No listing fields found on this page.", true);
    return;
  }
  captured = data;
  renderCapturedFields(data.fields);
  setStatus(`Form scanned successfully. Saved in templates tab.`);
  
  // Auto-switch to templates tab
  const templatesTabBtn = document.querySelector('[data-tab="tab-templates"]');
  if (templatesTabBtn) {
    templatesTabBtn.click();
  }
});

$("#saveTemplate").addEventListener("click", async () => {
  if (!captured?.fields?.length) {
    setStatus("No fields captured to save.", true);
    return;
  }
  setStatus("Saving template...");
  try {
    const data = await api("/api/extension/capture-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${captured.marketplace} saved listing template`,
        platform: captured.marketplace,
        capturedFromUrl: captured.url,
        fields: captured.fields,
        images: captured.images || [],
      }),
    });
    setStatus(`Template saved with ${data.fieldsSaved} fields.`);
    await loadTemplates();
    
    // Auto-switch back to Autofill tab
    const autofillTabBtn = document.querySelector('[data-tab="tab-autofill"]');
    if (autofillTabBtn) {
      autofillTabBtn.click();
    }
  } catch (error) {
    setStatus(error.data?.error || "Template save failed.", true);
  }
});

$("#autofill").addEventListener("click", async () => {
  setStatus("Checking allowance...");
  try {
    const page = await detectPage();
    const allowance = await api("/api/extension/detect-allowance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: page?.marketplace || "unknown", url: page?.url || location.href, action: "autofill" }),
    });
    renderUsage(allowance.usage);
    if (!allowance.canAutofill) {
      setStatus("Free listing limit reached. Upgrade to continue.", true);
      return;
    }
    if (!templates.length) await loadTemplates();
    if (!templates.length) {
      setStatus("No saved templates found. Capture one first.", true);
      return;
    }
    const selected = templates.find((template) => template._id === $("#templateSelect").value) || templates[0];
    const result = await sendToTab({ type: "APLUS_AUTOFILL_TEMPLATE", fields: selected.fields || [] });
    if (!result?.filledCount) {
      setStatus("No matching fields were autofilled.", true);
      return;
    }
    const saved = await api("/api/extension/autofill-success", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: result.marketplace,
        url: result.url,
        templateId: selected._id,
        title: selected.name,
        fields: result.filled.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {}),
      }),
    });
    renderUsage(saved.usage);
    setStatus(`Autofilled ${result.filledCount} fields.`);
  } catch (error) {
    setStatus(error.data?.error || error.message || "Autofill failed.", true);
  }
});

$("#generate").addEventListener("click", () => {
  chrome.tabs.create({ url: `${apiBase}/dashboard/listings/new` });
});

$("#aiTitle").addEventListener("click", () => {
  chrome.tabs.create({ url: `${apiBase}/dashboard/ai-content-studio` });
});

$("#aiDescription").addEventListener("click", () => {
  chrome.tabs.create({ url: `${apiBase}/dashboard/ai-content-studio` });
});

$("#aiKeywords").addEventListener("click", () => {
  chrome.tabs.create({ url: `${apiBase}/dashboard/keyword-research` });
});

$("#dashboard").addEventListener("click", () => {
  chrome.tabs.create({ url: `${apiBase}/dashboard/listings` });
});

$("#support").addEventListener("click", () => {
  chrome.tabs.create({ url: `${apiBase}/dashboard/support` });
});

$("#upgrade").addEventListener("click", () => {
  chrome.tabs.create({ url: `${apiBase}/dashboard/subscription` });
});

loadStatus();
