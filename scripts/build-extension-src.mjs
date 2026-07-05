/*
  Bundles the modular extension source (extension/src/**) back into the exact
  runtime files Chrome loads (extension/content-script.js, etc). Only files
  that have been split into extension/src/ go through this step — everything
  else in extension/ is still hand-edited directly and untouched by this script.

  Run this after editing anything under extension/src/, before loading the
  unpacked extension or running `npm run extension:dist`.

  Usage: npm run extension:build
*/
import { build } from "esbuild";

const root = "extension";

await build({
  entryPoints: [`${root}/src/content/main.js`],
  outfile: `${root}/content-script.js`,
  bundle: true,
  format: "iife",
  target: "chrome100",
  minify: false,
  legalComments: "none",
});

console.log("built: extension/content-script.js (from extension/src/content/main.js)");
