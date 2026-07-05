/*
  Brand asset generator — builds the A+ Studio app icon from one SVG:
  an indigo→violet rounded-square tile (Flipkart-style), a bold white "A+"
  mark, and a subtle white smile-arrow (Amazon-style) underneath.
  Background is transparent outside the tile. Matches the app accent
  (#4f46e5 indigo → #a855f7 violet).

  Usage: node scripts/generate-brand.mjs
*/
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366f1"/>
      <stop offset="0.5" stop-color="#4f46e5"/>
      <stop offset="1" stop-color="#7c3aed"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.24"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- tile -->
  <rect x="16" y="16" width="480" height="480" rx="116" fill="url(#tile)"/>
  <rect x="16" y="16" width="480" height="236" rx="116" fill="url(#shine)"/>

  <!-- A+ mark -->
  <g fill="#ffffff">
    <!-- A -->
    <path d="M186 348 L242 148 L286 148 L342 348 L294 348 L283 305 L245 305 L234 348 Z M254 266 L274 266 L264 219 Z"
          transform="translate(-40,0)"/>
    <!-- plus -->
    <rect x="316" y="214" width="90" height="34" rx="11"/>
    <rect x="344" y="186" width="34" height="90" rx="11"/>
  </g>

  <!-- subtle smile arrow (white, low opacity) -->
  <path d="M150 392 Q 256 452 352 398" fill="none" stroke="#ffffff" stroke-opacity="0.92" stroke-width="26" stroke-linecap="round"/>
  <path d="M352 398 l 10 -30 l -38 10 Z" fill="#ffffff" fill-opacity="0.92" stroke="#ffffff" stroke-opacity="0.92" stroke-width="10" stroke-linejoin="round"/>
</svg>
`;

const master = Buffer.from(svg);

async function png(size, path) {
  await sharp(master).resize(size, size).png().toFile(path);
  console.log("written:", path, `${size}x${size}`);
}

await png(512, "public/aplus-logo.png");
await png(512, "public/aplus-studio-logo.png");
await png(512, "public/android-chrome-512x512.png");
await png(192, "public/android-chrome-192x192.png");
await png(180, "public/apple-touch-icon.png");
await png(32, "public/favicon-32x32.png");
await png(16, "public/favicon-16x16.png");

// Extension icons — a couple of sizes so Chrome renders crisply everywhere.
await png(128, "extension/aplus-studio-logo.png");

const ico = await pngToIco(["public/favicon-32x32.png", "public/favicon-16x16.png"]);
writeFileSync("src/app/favicon.ico", ico);
writeFileSync("public/favicon.ico", ico);
console.log("written: favicon.ico (16+32)");
