const isDev = !chrome.runtime.getManifest()?.update_url && !chrome.runtime.getManifest()?.options_page?.includes('production');
globalThis.APLUS_CONFIG = {
  apiBase: isDev ? "http://localhost:3000" : "https://iprixmedia.com",
  productionApiBase: "https://iprixmedia.com"
};

