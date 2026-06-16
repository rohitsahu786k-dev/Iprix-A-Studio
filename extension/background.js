chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ aplusInstalledAt: Date.now() });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "APLUS_LOG") {
    chrome.storage.local.get(["apiBase"], async ({ apiBase }) => {
      try {
        await fetch(`${apiBase || "http://localhost:3000"}/api/extension/logs`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message.payload || {})
        });
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: String(error) });
      }
    });
    return true;
  }
});
