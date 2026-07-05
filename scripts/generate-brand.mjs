/*
  Brand asset generator — builds the A+ Studio app icon (Flipkart-style rounded
  square + Amazon-style smile arrow), favicons and extension icon from one SVG.
  All PNGs keep a transparent background.

  Usage: node scripts/generate-brand.mjs
*/
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import pngToIco from "png-to-ico";

// 512x512 master. Rounded red square (Flipkart-style tile), bold "A+" mark,
// amber smile-arrow underneath (Amazon-style), transparent outside the tile.
const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff3852"/>
      <stop offset="0.55" stop-color="#e60023"/>
      <stop offset="1" stop-color="#b0001c"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- tile -->
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#tile)"/>
  <rect x="16" y="16" width="480" height="240" rx="112" fill="url(#shine)"/>

  <!-- A+ mark -->
  <g fill="#ffffff">
    <!-- A -->
    <path d="M186 348 L242 148 L286 148 L342 348 L294 348 L283 305 L245 305 L234 348 Z M254 266 L274 266 L264 219 Z"
          transform="translate(-42,0)"/>
    <!-- plus -->
    <rect x="316" y="216" width="88" height="34" rx="10"/>
    <rect x="343" y="189" width="34" height="88" rx="10"/>
  </g>

  <!-- amazon-style smile arrow -->
  <path d="M150 388 Q 256 452 352 396" fill="none" stroke="#FFB300" stroke-width="30" stroke-linecap="round"/>
  <path d="M352 396 l 8 -34 l -40 12 Z" fill="#FFB300" stroke="#FFB300" stroke-width="12" stroke-linejoin="round"/>
</svg>
`;

const master = Buffer.from(svg);

async function png(size, path) {
  await sharp(master).resize(size, size).png().toFile(path);
  console.log("written:", path, `${size}x${size}`);
}

await png(512, "public/aplus-logo.png");
await png(512, "public/android-chrome-512x512.png");
await png(192, "public/android-chrome-192x192.png");
await png(180, "public/apple-touch-icon.png");
await png(32, "public/favicon-32x32.png");
await png(16, "public/favicon-16x16.png");
await png(128, "extension/aplus-studio-logo.png");
await png(512, "public/aplus-studio-logo.png");

const ico = await pngToIco(["public/favicon-32x32.png", "public/favicon-16x16.png"]);
writeFileSync("src/app/favicon.ico", ico);
writeFileSync("public/favicon.ico", ico);
console.log("written: favicon.ico (16+32)");
