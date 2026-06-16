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
    if (!match) continue;
    const element = document.querySelector(field.selector);
    if (!element) continue;
    setNativeValue(element, String(match[1]));
    filled.push({ key: field.key, label: field.label, value: match[1] });
  }
  return { filledCount: filled.length, filled, marketplace: detectMarketplace(), url: location.href };
}

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
