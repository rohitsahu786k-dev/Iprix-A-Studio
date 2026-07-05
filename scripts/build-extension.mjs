/*
  Production extension build: copies extension/ to dist/extension, minifies +
  mangles every JS file with terser (drops comments, shortens identifiers) and
  zips it for the Chrome Web Store. The readable source in extension/ stays as
  the dev build; ship the dist zip so the published code is hard to copy.

  Usage: npm run extension:dist
*/
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { minify } from "terser";

const src = "extension";
const out = join("dist", "extension");

rmSync("dist", { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(src, out, { recursive: true, filter: (p) => !p.includes("_metadata") });

async function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      await walk(full);
      continue;
    }
    if (!name.endsWith(".js") || name.endsWith(".min.js")) continue;
    const code = readFileSync(full, "utf8");
    const result = await minify(code, {
      compress: { passes: 2, drop_debugger: true },
      mangle: true,
      format: { comments: false },
    });
    if (result.code) {
      writeFileSync(full, result.code);
      console.log("minified:", full);
    }
  }
}

await walk(out);

// manifest "key" is only for local dev identity — the Web Store strips it,
// but remove it from dist to avoid upload warnings.
const manifestPath = join(out, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
delete manifest.key;
delete manifest.update_url;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path dist/extension/* -DestinationPath dist/a-plus-studio-extension-${manifest.version}.zip -Force"`,
  { stdio: "inherit" },
);
console.log(`\nDone: dist/a-plus-studio-extension-${manifest.version}.zip`);
