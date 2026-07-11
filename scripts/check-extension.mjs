import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("extension/manifest.json", "utf8"));
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(manifest.name === "A+ Studio", "manifest.name must be A+ Studio");
assert(manifest.action?.default_title === "A+ Studio", "extension action title must be A+ Studio");
assert(!("key" in manifest), "manifest must not contain a copied extension key");
assert(!("update_url" in manifest), "unpacked manifest must not contain a Web Store update_url");
assert(
  manifest.host_permissions?.includes("*://*.flixcart.com/*"),
  "Flipkart CDN host permission is missing",
);

for (const file of ["extension/manifest.json", "extension/popup/popup.html", "extension/README.md"]) {
  const contents = readFileSync(file, "utf8");
  assert(!/lisstify|listify/i.test(contents), `${file} contains visible competitor branding`);
}

const flipkartCapture = readFileSync("extension/platforms/flipkart/fk-fill.js", "utf8");
assert(
  (flipkartCapture.match(/captureTextInputsIn\(/g) || []).length >= 2,
  "Flipkart full-section capture must include prefilled text inputs",
);

const syntaxFiles = [
  "extension/background.js",
  "extension/config.js",
  "extension/content-script.js",
  "extension/logger.js",
  "extension/meesho-guard.js",
  "extension/popup/popup.js",
  "extension/popup/flipkart/fk-tab.js",
  "extension/platforms/flipkart/fk-autofill.js",
  "extension/platforms/flipkart/fk-buttons.js",
  "extension/platforms/flipkart/fk-category.js",
  "extension/platforms/flipkart/fk-fill.js",
  "extension/platforms/meesho/low-shipping.js",
];

for (const file of syntaxFiles) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    failures.push(`${file} failed JavaScript syntax validation: ${error.stderr?.toString().trim() || error.message}`);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Extension identity, branding, Flipkart capture, and JavaScript syntax checks passed.");
