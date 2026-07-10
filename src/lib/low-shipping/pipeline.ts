// Browser-only image pipeline. 100% client-side — images never leave the
// browser (privacy is a selling point). Import this ONLY from client
// components; the heavy background-removal model is lazy-loaded on first run.

import { computeBulkScore } from "./bulk-score";
import { LOW_SHIPPING_STRINGS } from "./strings";

export const CANVAS_SIZE = 1024;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const TARGET_BYTES = 300 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type PipelineStage =
  | "reading"
  | "model"
  | "removing"
  | "variants"
  | "encoding"
  | "done";

export type PipelineProgress = {
  stage: PipelineStage;
  /** 0..1 within the stage (model download progress etc.). */
  value: number;
  detail?: string;
};

export type VariantResult = {
  id: "v1" | "v2" | "v3" | "v4" | "v5";
  name: string;
  blob: Blob;
  /** Object URL for preview — caller must revoke when done. */
  url: string;
  bytes: number;
  quality: number;
  bulkScore: number;
  areaRatio: number;
};

export type PipelineResult = {
  variants: VariantResult[];
  backgroundRemoved: boolean;
  warning: string | null;
  sourceName: string;
};

type Bounds = { x: number; y: number; width: number; height: number };

export function validateInputFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Only JPG, PNG or WEBP images are supported.";
  if (file.size > MAX_FILE_BYTES) return "Image is larger than 25MB.";
  return null;
}

export async function runLowShippingPipeline(
  file: File,
  onProgress: (progress: PipelineProgress) => void = () => {},
): Promise<PipelineResult> {
  const invalid = validateInputFile(file);
  if (invalid) throw new Error(invalid);

  onProgress({ stage: "reading", value: 0 });
  const originalBitmap = await createImageBitmap(file);

  // Stage: background removal (WASM, in-browser). Falls back to a
  // center-weighted smart crop when the model cannot load (offline or
  // low-end device) — the UI shows a "background not removed" badge.
  let productBitmap = originalBitmap;
  let backgroundRemoved = false;
  let warning: string | null = null;
  try {
    const { removeBackground } = await import("@imgly/background-removal");
    onProgress({ stage: "model", value: 0 });
    const cutoutBlob = await removeBackground(file, {
      output: { format: "image/png" },
      progress: (key, current, total) => {
        if (key.startsWith("fetch")) {
          onProgress({ stage: "model", value: total ? current / total : 0, detail: "Downloading AI model (first run only)" });
        } else {
          onProgress({ stage: "removing", value: total ? current / total : 0 });
        }
      },
    });
    productBitmap = await createImageBitmap(cutoutBlob);
    backgroundRemoved = true;
  } catch {
    warning = LOW_SHIPPING_STRINGS.bgNotRemovedBadge.en;
  }

  onProgress({ stage: "variants", value: 0 });
  const bounds = backgroundRemoved
    ? alphaBounds(productBitmap)
    : centerCropBounds(productBitmap.width, productBitmap.height);

  const specs: Array<{ id: VariantResult["id"]; name: string; scale: number | "original"; shadow: boolean }> = [
    { id: "v1", name: LOW_SHIPPING_STRINGS.variantNames.v1, scale: 0.7, shadow: false },
    { id: "v2", name: LOW_SHIPPING_STRINGS.variantNames.v2, scale: 0.55, shadow: false },
    { id: "v3", name: LOW_SHIPPING_STRINGS.variantNames.v3, scale: 0.4, shadow: true },
    { id: "v4", name: LOW_SHIPPING_STRINGS.variantNames.v4, scale: 0.85, shadow: false },
    { id: "v5", name: LOW_SHIPPING_STRINGS.variantNames.v5, scale: "original", shadow: false },
  ];

  const variants: VariantResult[] = [];
  for (let index = 0; index < specs.length; index += 1) {
    const spec = specs[index];
    onProgress({ stage: "encoding", value: index / specs.length, detail: spec.name });
    variants.push(await renderVariant(spec, productBitmap, bounds, backgroundRemoved));
  }

  productBitmap.close?.();
  if (productBitmap !== originalBitmap) originalBitmap.close?.();
  onProgress({ stage: "done", value: 1 });
  return { variants, backgroundRemoved, warning, sourceName: file.name };
}

async function renderVariant(
  spec: { id: VariantResult["id"]; name: string; scale: number | "original"; shadow: boolean },
  bitmap: ImageBitmap,
  bounds: Bounds,
  backgroundRemoved: boolean,
): Promise<VariantResult> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  let drawn: Bounds;
  if (spec.scale === "original") {
    // Original composition ratio preserved, background replaced with white.
    const fit = Math.min(CANVAS_SIZE / bitmap.width, CANVAS_SIZE / bitmap.height);
    const w = Math.round(bitmap.width * fit);
    const h = Math.round(bitmap.height * fit);
    drawn = { x: Math.round((CANVAS_SIZE - w) / 2), y: Math.round((CANVAS_SIZE - h) / 2), width: w, height: h };
    ctx.drawImage(bitmap, drawn.x, drawn.y, w, h);
  } else {
    const limit = CANVAS_SIZE * spec.scale;
    const fit = Math.min(limit / bounds.width, limit / bounds.height);
    const w = Math.round(bounds.width * fit);
    const h = Math.round(bounds.height * fit);
    drawn = { x: Math.round((CANVAS_SIZE - w) / 2), y: Math.round((CANVAS_SIZE - h) / 2), width: w, height: h };
    if (spec.shadow && backgroundRemoved) {
      // Subtle soft drop shadow so a small cutout doesn't look pasted.
      ctx.save();
      ctx.shadowColor = "rgba(15, 15, 20, 0.18)";
      ctx.shadowBlur = 26;
      ctx.shadowOffsetY = 14;
      ctx.drawImage(bitmap, bounds.x, bounds.y, bounds.width, bounds.height, drawn.x, drawn.y, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(bitmap, bounds.x, bounds.y, bounds.width, bounds.height, drawn.x, drawn.y, w, h);
    }
  }

  const areaRatio = (drawn.width * drawn.height) / (CANVAS_SIZE * CANVAS_SIZE);
  const edges =
    Number(drawn.x <= 2) + Number(drawn.y <= 2) +
    Number(drawn.x + drawn.width >= CANVAS_SIZE - 2) + Number(drawn.y + drawn.height >= CANVAS_SIZE - 2);
  const clutterRatio = measureClutter(ctx, drawn);
  const bulkScore = computeBulkScore({ areaRatio, edgeTouchRatio: edges / 4, clutterRatio });

  // Re-encoding through canvas strips all EXIF/metadata by construction.
  let quality = 0.82;
  let blob = await encodeJpeg(canvas, quality);
  while (blob.size > TARGET_BYTES && quality > 0.7) {
    quality = Math.max(0.7, quality - 0.04);
    blob = await encodeJpeg(canvas, quality);
  }

  return {
    id: spec.id,
    name: spec.name,
    blob,
    url: URL.createObjectURL(blob),
    bytes: blob.size,
    quality,
    bulkScore,
    areaRatio,
  };
}

function encodeJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("JPEG encoding failed"))),
      "image/jpeg",
      quality,
    );
  });
}

/** Residual non-white pixel ratio outside the product box (sampled). */
function measureClutter(ctx: CanvasRenderingContext2D, product: Bounds): number {
  const data = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
  let outside = 0;
  let dirty = 0;
  const step = 8;
  for (let y = 0; y < CANVAS_SIZE; y += step) {
    for (let x = 0; x < CANVAS_SIZE; x += step) {
      const insideProduct =
        x >= product.x && x < product.x + product.width && y >= product.y && y < product.y + product.height;
      if (insideProduct) continue;
      outside += 1;
      const offset = (y * CANVAS_SIZE + x) * 4;
      if (data[offset] < 245 || data[offset + 1] < 245 || data[offset + 2] < 245) dirty += 1;
    }
  }
  return outside ? dirty / outside : 0;
}

/** Tight bounding box of non-transparent pixels (downscaled scan for speed). */
function alphaBounds(bitmap: ImageBitmap): Bounds {
  const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (data[(y * w + x) * 4 + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return { x: 0, y: 0, width: bitmap.width, height: bitmap.height };

  const inv = 1 / scale;
  const x = Math.max(0, Math.floor(minX * inv));
  const y = Math.max(0, Math.floor(minY * inv));
  return {
    x,
    y,
    width: Math.min(bitmap.width, Math.ceil((maxX + 1) * inv)) - x,
    height: Math.min(bitmap.height, Math.ceil((maxY + 1) * inv)) - y,
  };
}

/** Fallback when background removal is unavailable: center-weighted crop. */
function centerCropBounds(width: number, height: number): Bounds {
  const marginX = Math.round(width * 0.08);
  const marginY = Math.round(height * 0.08);
  return { x: marginX, y: marginY, width: width - marginX * 2, height: height - marginY * 2 };
}
