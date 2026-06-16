importScripts('config.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ aplusInstalledAt: Date.now() });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const base = globalThis.APLUS_CONFIG?.apiBase || "http://localhost:3000";

  if (message?.type === "APLUS_LOG") {
    fetch(`${base}/api/extension/logs`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.payload || {})
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        sendResponse({ ok: response.ok, data });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: String(error) });
      });
    return true;
  }

  if (message?.type === "APLUS_API_CALL") {
    const { path, options = {} } = message;
    const url = `${base}${path}`;
    
    fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          sendResponse({ ok: false, error: data.error || "Request failed", data });
        } else {
          sendResponse({ ok: true, data });
        }
      })
      .catch((error) => {
        sendResponse({ ok: false, error: error.message || String(error) });
      });
    return true; // Keep message channel open for async response
  }
});

