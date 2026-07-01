;(function () {
  if (window.__aplusAmazonCore) return;
  window.__aplusAmazonCore = true;

  if (!location.hostname.includes("sellercentral.amazon.in")) return;

  const IS_TOP = window === window.top;
  const FONT = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif";
  const SAFE_DELAY = 180;
  const MAX_FIELDS = 260;

  const BLOCKED_FIELD_RE = /(password|passwd|otp|one.?time|2fa|captcha|token|csrf|cookie|card|credit|debit|cvv|cvc|bank|upi|ifsc|account|routing|secret|private|session|login|signin|sign.in)/i;
  const SKIP_BUTTON_RE = /(submit|save|publish|delete|remove|confirm|continue|next|buy|pay|logout|sign out)/i;

  function log(...args) {
    console.log("[A+ AMZ]", ...args);
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\*/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function clean(value) {
    return String(value || "")
      .replace(/\*/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isEditable(el) {
    if (!el || !isVisible(el)) return false;
    const tag = el.tagName;
    const type = String(el.type || "").toLowerCase();
    if (el.disabled || el.readOnly) return false;
    if (["hidden", "password", "submit", "button", "reset", "file", "image"].includes(type)) return false;
    if (BLOCKED_FIELD_RE.test([el.name, el.id, el.placeholder, el.getAttribute("aria-label"), el.autocomplete].join(" "))) return false;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function textOf(el) {
    return clean(el ? el.textContent || "" : "");
  }

  function getLabel(el) {
    const aria = clean(el.getAttribute("aria-label"));
    if (aria) return aria;

    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const label = labelledBy
        .split(/\s+/)
        .map((id) => textOf(document.getElementById(id)))
        .filter(Boolean)
        .join(" ");
      if (label) return label;
    }

    if (el.id) {
      try {
        const exact = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        const label = textOf(exact);
        if (label) return label;
      } catch (_) {}
    }

    const wrappingLabel = el.closest("label");
    const wrapText = textOf(wrappingLabel);
    if (wrapText && wrapText.length < 140) return wrapText;

    const amazonContainer = el.closest(".a-form-group, .a-row, .celwidget, [data-csa-c-content-id], [data-testid], [class*='form'], [class*='attribute'], [class*='field']");
    if (amazonContainer) {
      const selectors = [
        "label",
        ".a-form-label",
        ".attribute-label",
        "[data-test-id*='label']",
        "[class*='label']",
        "h1,h2,h3,h4,h5,h6",
        "span"
      ];
      for (const selector of selectors) {
        for (const node of amazonContainer.querySelectorAll(selector)) {
          if (node === el || node.contains(el)) continue;
          const t = textOf(node);
          if (t && t.length > 1 && t.length < 120 && !SKIP_BUTTON_RE.test(t)) return t;
        }
      }
    }

    const placeholder = clean(el.getAttribute("placeholder"));
    if (placeholder) return placeholder;

    const name = clean(el.name || el.id);
    if (name) return name.replace(/[_-]+/g, " ");

    return "Unlabelled field";
  }

  function getSection(el) {
    let p = el.parentElement;
    for (let i = 0; i < 12 && p && p !== document.body; i++, p = p.parentElement) {
      const heading = p.querySelector("h1,h2,h3,h4,h5,h6,.a-section-title,.section-title,[class*='sectionTitle'],[class*='heading']");
      const t = textOf(heading);
      if (t && t.length < 120) return t;
    }
    const title = clean(document.title).replace(/Amazon Seller Central/ig, "").replace(/[|\-–]+$/g, "").trim();
    return title || "Amazon Listing";
  }

  function fieldKey(field) {
    return norm([field.label, field.name, field.id, field.placeholder, field.section].filter(Boolean).join(" ")).slice(0, 140);
  }

  function allEditableFields() {
    const nodes = [...document.querySelectorAll("input, textarea, select, [contenteditable='true']")].filter(isEditable);
    const out = [];
    const seen = new Set();
    for (const el of nodes) {
      const field = {
        label: getLabel(el),
        value: el.isContentEditable ? clean(el.textContent) : el.type === "checkbox" || el.type === "radio" ? String(!!el.checked) : String(el.value || ""),
        type: el.tagName === "SELECT" ? "select" : el.isContentEditable ? "contenteditable" : String(el.type || el.tagName).toLowerCase(),
        name: el.name || "",
        id: el.id || "",
        placeholder: el.getAttribute("placeholder") || "",
        selector: buildSelector(el),
        section: getSection(el),
        required: !!el.required || el.getAttribute("aria-required") === "true",
      };
      const key = fieldKey(field);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(field);
      if (out.length >= MAX_FIELDS) break;
    }
    return out;
  }

  function buildSelector(el) {
    if (el.id) return `#${CSS.escape(el.id)}`;
    if (el.name) return `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]`;
    const aria = el.getAttribute("aria-label");
    if (aria) return `${el.tagName.toLowerCase()}[aria-label="${CSS.escape(aria)}"]`;
    const ph = el.getAttribute("placeholder");
    if (ph) return `${el.tagName.toLowerCase()}[placeholder="${CSS.escape(ph)}"]`;
    return "";
  }

  function setNativeValue(el, value) {
    const tag = el.tagName;
    const stringValue = String(value ?? "");
    if (el.isContentEditable) {
      el.focus();
      el.textContent = stringValue;
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: stringValue }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    if (tag === "SELECT") {
      const target = norm(stringValue);
      let matched = false;
      for (const opt of el.options || []) {
        if (norm(opt.value) === target || norm(opt.textContent) === target || norm(opt.textContent).includes(target)) {
          el.value = opt.value;
          matched = true;
          break;
        }
      }
      if (!matched) return false;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    if (el.type === "checkbox" || el.type === "radio") {
      const shouldCheck = /^(true|yes|1|checked|on)$/i.test(stringValue);
      if (el.checked !== shouldCheck) el.click();
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, stringValue);
    else el.value = stringValue;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    return true;
  }

  function scoreCandidate(el, saved) {
    if (!isEditable(el)) return -1;
    const current = {
      label: getLabel(el),
      name: el.name || "",
      id: el.id || "",
      placeholder: el.getAttribute("placeholder") || "",
      section: getSection(el),
    };
    let score = 0;
    const pairs = [
      [current.label, saved.label, 100],
      [current.name, saved.name, 80],
      [current.id, saved.id, 80],
      [current.placeholder, saved.placeholder, 65],
      [current.section, saved.section, 25],
    ];
    for (const [a, b, weight] of pairs) {
      const na = norm(a);
      const nb = norm(b);
      if (!na || !nb) continue;
      if (na === nb) score += weight;
      else if (na.includes(nb) || nb.includes(na)) score += Math.round(weight * 0.55);
    }
    return score;
  }

  function findTarget(saved, used) {
    if (saved.selector) {
      try {
        const exact = document.querySelector(saved.selector);
        if (exact && isEditable(exact) && !used.has(exact)) return exact;
      } catch (_) {}
    }
    const candidates = allEditableFields()
      .map((f) => ({ el: resolveFieldElement(f), score: scoreCandidate(resolveFieldElement(f), saved) }))
      .filter((x) => x.el && !used.has(x.el) && x.score > 0)
      .sort((a, b) => b.score - a.score);
    return candidates[0]?.score >= 60 ? candidates[0].el : null;
  }

  function resolveFieldElement(field) {
    if (field.selector) {
      try {
        const el = document.querySelector(field.selector);
        if (el) return el;
      } catch (_) {}
    }
    for (const el of document.querySelectorAll("input, textarea, select, [contenteditable='true']")) {
      if (!isEditable(el)) continue;
      if (norm(getLabel(el)) === norm(field.label) && norm(getSection(el)) === norm(field.section)) return el;
      if (field.name && el.name === field.name) return el;
      if (field.id && el.id === field.id) return el;
    }
    return null;
  }

  async function fillTemplate(template) {
    const fields = Array.isArray(template?.fields) ? template.fields : [];
    if (!fields.length) return { success: false, filledCount: 0, notFoundCount: 0, error: "No fields in template" };

    let filledCount = 0;
    let notFoundCount = 0;
    const used = new WeakSet();
    const misses = [];

    for (const field of fields) {
      if (field.value === undefined || field.value === null || String(field.value).trim() === "") continue;
      if (BLOCKED_FIELD_RE.test([field.label, field.name, field.id, field.placeholder].join(" "))) continue;
      const el = findTarget(field, used);
      if (!el) {
        notFoundCount++;
        misses.push(field.label || field.name || field.id || "unknown");
        continue;
      }
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
      await wait(SAFE_DELAY);
      if (setNativeValue(el, field.value)) {
        used.add(el);
        filledCount++;
      } else {
        notFoundCount++;
        misses.push(field.label || field.name || field.id || "unknown");
      }
    }

    showToast(
      notFoundCount ? `Amazon autofill: ${filledCount} filled, ${notFoundCount} missed` : `Amazon autofill complete: ${filledCount} fields`,
      notFoundCount ? "warning" : "success"
    );

    if (filledCount && template._id) {
      chrome.runtime.sendMessage({ action: "record_template_usage", templateId: template._id }).catch(() => {});
    }

    log("fill result", { filledCount, notFoundCount, misses: misses.slice(0, 20) });
    return { success: filledCount > 0, filledCount, notFoundCount, missed: misses };
  }

  async function saveCurrentForm() {
    const fields = allEditableFields();
    if (!fields.length) {
      showToast("No Amazon listing fields detected on this page.", "warning");
      return;
    }
    const category = inferCategory(fields);
    const defaultName = `${category || "Amazon"} Template`;
    const name = prompt("Template name", defaultName);
    if (!name) return;

    const payload = {
      name: clean(name),
      platform: "amazon",
      url: location.hostname,
      capturedFromUrl: location.href,
      category: category || "Amazon Listing",
      source: "amazon_extension_capture",
      autoFill: false,
      fieldCount: fields.length,
      fields,
    };

    showToast("Saving Amazon template...", "info");
    chrome.runtime.sendMessage({ action: "save_template", payload }, (res) => {
      if (chrome.runtime.lastError) {
        showToast(chrome.runtime.lastError.message || "Save failed", "error");
        return;
      }
      if (res?.ok) showToast(`Saved ${fields.length} Amazon fields`, "success");
      else showToast(res?.error || "Template save failed", "error");
    });
  }

  function inferCategory(fields) {
    const titleField = fields.find((f) => /product.?type|category|item.?type|product.?category/i.test([f.label, f.name, f.id].join(" ")) && f.value);
    if (titleField?.value) return clean(titleField.value).slice(0, 80);
    const heading = textOf(document.querySelector("h1,h2,.a-size-large,.a-size-extra-large"));
    return heading || "Amazon Listing";
  }

  function showToast(msg, type = "success") {
    if (!IS_TOP) return;
    const old = document.getElementById("__aplus_amz_toast__");
    if (old) old.remove();
    const colors = { success: "#15803d", warning: "#b45309", error: "#dc2626", info: "#2563eb" };
    const div = document.createElement("div");
    div.id = "__aplus_amz_toast__";
    div.textContent = msg;
    Object.assign(div.style, {
      position: "fixed",
      left: "50%",
      bottom: "92px",
      transform: "translateX(-50%)",
      zIndex: "2147483647",
      background: colors[type] || colors.success,
      color: "#fff",
      padding: "10px 16px",
      borderRadius: "10px",
      boxShadow: "0 8px 30px rgba(0,0,0,.25)",
      font: `600 13px ${FONT}`,
      maxWidth: "calc(100vw - 32px)",
      textAlign: "center",
    });
    document.documentElement.appendChild(div);
    setTimeout(() => { div.style.opacity = "0"; setTimeout(() => div.remove(), 300); }, 3200);
  }

  async function runAutofill() {
    showToast("Finding Amazon template...", "info");
    const domCategory = inferCategory(allEditableFields());
    chrome.runtime.sendMessage({ action: "trigger_autofill", domCategory }, async (res) => {
      if (chrome.runtime.lastError) {
        showToast(chrome.runtime.lastError.message || "Autofill failed", "error");
        return;
      }
      if (!res?.ok || !res.template) {
        showToast(res?.error === "no_category_match" ? "No matching Amazon template found." : (res?.error || "No Amazon template found."), "warning");
        return;
      }
      await fillTemplate(res.template);
    });
  }

  function injectButtons() {
    if (!IS_TOP || document.getElementById("__aplus_amz_bar__")) return;
    const bar = document.createElement("div");
    bar.id = "__aplus_amz_bar__";
    Object.assign(bar.style, {
      position: "fixed",
      right: "18px",
      bottom: "18px",
      display: "flex",
      gap: "8px",
      zIndex: "2147483646",
      fontFamily: FONT,
    });

    const saveBtn = makeBtn("Save Template", "#111827", saveCurrentForm);
    const fillBtn = makeBtn("Autofill", "#4f46e5", runAutofill);
    bar.appendChild(saveBtn);
    bar.appendChild(fillBtn);
    document.documentElement.appendChild(bar);
  }

  function makeBtn(label, bg, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    Object.assign(btn.style, {
      border: "0",
      borderRadius: "999px",
      background: bg,
      color: "#fff",
      padding: "10px 14px",
      font: `700 12px ${FONT}`,
      boxShadow: "0 8px 24px rgba(0,0,0,.22)",
      cursor: "pointer",
    });
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    (async () => {
      try {
        if (request.action === "amz_scan_form") {
          sendResponse({ success: true, data: { url: location.href, domain: location.hostname, title: document.title, fields: allEditableFields() } });
        } else if (request.action === "amz_fill_form") {
          sendResponse(await fillTemplate(request.template || request.data));
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message || String(err) });
      }
    })();
    return true;
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectButtons, { once: true });
  } else {
    injectButtons();
  }

  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(injectButtons, 800);
    }
  }, 1000);

  log("Amazon support loaded", location.href);
})();
