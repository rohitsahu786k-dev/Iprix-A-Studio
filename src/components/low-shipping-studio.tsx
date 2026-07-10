"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Download,
  FileArchive,
  HelpCircle,
  ImageIcon,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  UploadCloud,
  X,
} from "lucide-react";
import {
  DEFAULT_RATE_CARD,
  LOW_SHIPPING_CATEGORIES,
  LOW_SHIPPING_STRINGS,
  bulkScoreTone,
  estimateShipping,
  isValidRateCard,
  type EstimateResult,
  type RateCard,
} from "@/lib/low-shipping";
import {
  runLowShippingPipeline,
  validateInputFile,
  type PipelineProgress,
  type PipelineResult,
  type VariantResult,
} from "@/lib/low-shipping/pipeline";

const card = "rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 shadow-sm";
const label = "grid gap-1.5 text-xs font-bold text-zinc-300";
const input =
  "rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs font-semibold text-zinc-100 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-indigo-950/50 transition-colors placeholder:text-zinc-500";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-60 transition-all cursor-pointer";
const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-all cursor-pointer";

const RATE_CARD_KEY = "aplus_low_shipping_rate_card_v1";
const HISTORY_KEY = "aplus_low_shipping_history_v1";

type HistoryEntry = {
  date: string;
  sourceName: string;
  thumbnail: string;
  scores: Array<{ id: string; score: number }>;
  backgroundRemoved: boolean;
};

const stageLabels: Record<PipelineProgress["stage"], string> = {
  reading: "Reading image",
  model: "Downloading AI model (first run only, cached after)",
  removing: "Removing background",
  variants: "Building variants",
  encoding: "Encoding 1024×1024 JPEGs",
  done: "Done",
};

export function LowShippingStudio() {
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Estimator state (shared with each variant card).
  const [category, setCategory] = useState<string>("jewellery");
  const [dead, setDead] = useState(120);
  const [l, setL] = useState(15);
  const [b, setB] = useState(12);
  const [h, setH] = useState(4);
  const [estimatorTouched, setEstimatorTouched] = useState(false);
  const [rateCard, setRateCard] = useState<RateCard>(DEFAULT_RATE_CARD);
  const [rateCardText, setRateCardText] = useState("");
  const [rateCardError, setRateCardError] = useState("");
  const [showRateCard, setShowRateCard] = useState(false);

  useEffect(() => {
    // Deferred so the hydrated first paint matches the server HTML before
    // device-local rate card + history load in.
    const timer = window.setTimeout(() => {
      try {
        const savedCard = localStorage.getItem(RATE_CARD_KEY);
        if (savedCard) {
          const parsed = JSON.parse(savedCard);
          if (isValidRateCard(parsed)) setRateCard(parsed);
        }
        const savedHistory = localStorage.getItem(HISTORY_KEY);
        if (savedHistory) setHistory(JSON.parse(savedHistory).slice(0, 12));
      } catch {
        // Corrupt localStorage — fall back to defaults.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const estimate: EstimateResult | null = useMemo(() => {
    if (!estimatorTouched) return null;
    if (dead <= 0 || l <= 0 || b <= 0 || h <= 0) return null;
    return estimateShipping(
      { category, deadWeightGrams: dead, lengthCm: l, breadthCm: b, heightCm: h },
      rateCard,
    );
  }, [estimatorTouched, category, dead, l, b, h, rateCard]);

  const processFile = useCallback(
    async (file: File) => {
      const invalid = validateInputFile(file);
      if (invalid) {
        setError(invalid);
        return;
      }
      setError("");
      setResult((previous) => {
        previous?.variants.forEach((variant) => URL.revokeObjectURL(variant.url));
        return null;
      });
      setProgress({ stage: "reading", value: 0 });
      try {
        const pipelineResult = await runLowShippingPipeline(file, setProgress);
        setResult(pipelineResult);
        saveHistory(pipelineResult, setHistory);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Image processing failed. Please retry.");
      } finally {
        setProgress(null);
      }
    },
    [],
  );

  const downloadAll = useCallback(async () => {
    if (!result) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const variant of result.variants) {
      zip.file(`${variant.id}-${variant.name.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.jpg`, variant.blob);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(blob, `low-shipping-variants-${Date.now()}.zip`);
  }, [result]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6 min-w-0">
        {/* Honest-image + no-automation guardrails, always visible. */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs font-semibold leading-relaxed text-amber-200/90">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <span>{LOW_SHIPPING_STRINGS.honestImageWarning.en}</span>
        </div>

        {/* Upload zone */}
        <div
          className={`${card} border-dashed text-center transition-colors ${dragOver ? "border-indigo-500 bg-indigo-500/5" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const file = event.dataTransfer.files?.[0];
            if (file) void processFile(file);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void processFile(file);
              event.target.value = "";
            }}
          />
          <UploadCloud className="mx-auto h-10 w-10 text-indigo-400" />
          <h2 className="mt-3 text-sm font-extrabold text-zinc-100">
            Drop a product photo — get 5 low-bulk white-background variants
          </h2>
          <p className="mt-1.5 text-xs font-semibold text-zinc-400">
            JPG / PNG / WEBP up to 25MB. Processing is 100% in your browser — the image never leaves your device.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button type="button" className={primaryBtn} onClick={() => inputRef.current?.click()} disabled={!!progress}>
              {progress ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              {progress ? "Processing…" : "Choose image"}
            </button>
            <button type="button" className={ghostBtn} onClick={() => setShowWhy(true)}>
              <HelpCircle className="h-4 w-4" />
              {LOW_SHIPPING_STRINGS.whyTitle.en}
            </button>
          </div>
          {progress ? (
            <div className="mx-auto mt-5 max-w-md">
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                <span>{progress.detail || stageLabels[progress.stage]}</span>
                <span>{Math.round(progress.value * 100)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.max(4, Math.round(progress.value * 100))}%` }}
                />
              </div>
            </div>
          ) : null}
          {error ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs font-bold text-red-300">
              <AlertTriangle className="h-4 w-4" /> {error}
            </p>
          ) : null}
        </div>

        {/* Results grid */}
        {result ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-zinc-100">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                5 Variants · {result.sourceName}
              </h2>
              <button type="button" className={ghostBtn} onClick={() => void downloadAll()}>
                <FileArchive className="h-4 w-4" />
                Download all (ZIP)
              </button>
            </div>
            {result.warning ? (
              <p className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs font-bold text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {result.warning}
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {result.variants.map((variant) => (
                <VariantCard key={variant.id} variant={variant} estimate={estimate} />
              ))}
            </div>
            <p className="text-[10px] font-semibold text-zinc-500">
              {LOW_SHIPPING_STRINGS.bulkScoreHeuristicNote.en} All files are re-encoded 1024×1024 JPEGs with metadata stripped.
            </p>
          </section>
        ) : null}

        {/* A/B test instructions */}
        <details className={card}>
          <summary className="flex cursor-pointer items-center justify-between text-sm font-extrabold uppercase tracking-wider text-zinc-100">
            How to A/B test on Meesho (manual, safe)
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </summary>
          <ol className="mt-4 space-y-3">
            {LOW_SHIPPING_STRINGS.abTestSteps.en.map((step, index) => (
              <li className="flex gap-3 text-xs font-semibold leading-relaxed text-zinc-300" key={index}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-600 font-mono text-[10px] font-bold text-white">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-[11px] font-semibold leading-relaxed text-zinc-400">
            {LOW_SHIPPING_STRINGS.noAutomationNote.en}
          </p>
          <p className="mt-2 text-[10px] font-semibold text-zinc-500">{LOW_SHIPPING_STRINGS.disclaimer.en}</p>
        </details>

        {/* Local history */}
        {history.length ? (
          <section className={card}>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-100">Recent runs (saved on this device)</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((entry, index) => (
                <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3" key={index}>
                  {/* Tiny locally-stored data-URL thumbnail. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.thumbnail} alt="" className="h-12 w-12 rounded-lg border border-zinc-800 bg-white object-contain" />
                  <div className="min-w-0 text-[10px] font-semibold text-zinc-400">
                    <p className="truncate font-bold text-zinc-200">{entry.sourceName}</p>
                    <p>{new Date(entry.date).toLocaleString()}</p>
                    <p>Best score: {Math.min(...entry.scores.map((score) => score.score))}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* Estimator side panel */}
      <aside className="space-y-5">
        <div className={card}>
          <div className="mb-5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-zinc-100">
            <Truck className="h-4 w-4 text-indigo-500" />
            Shipping slab estimator
          </div>
          <div className="grid gap-4">
            <label className={label}>
              <span>Category</span>
              <select className={input} value={category} onChange={(event) => { setCategory(event.target.value); setEstimatorTouched(true); }}>
                {LOW_SHIPPING_CATEGORIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className={label}>
              <span>Dead weight (grams)</span>
              <input className={input} type="number" min={1} value={dead} onChange={(event) => { setDead(Number(event.target.value) || 0); setEstimatorTouched(true); }} />
            </label>
            <div className="grid grid-cols-3 gap-3">
              {([["Length", l, setL], ["Breadth", b, setB], ["Height", h, setH]] as const).map(([name, value, setter]) => (
                <label className={label} key={name}>
                  <span>{name} (cm)</span>
                  <input className={input} type="number" min={0.5} step={0.5} value={value} onChange={(event) => { setter(Number(event.target.value) || 0); setEstimatorTouched(true); }} />
                </label>
              ))}
            </div>
          </div>

          {estimate ? (
            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Volumetric" value={`${estimate.volumetricKg.toFixed(3)} kg`} highlight={estimate.volumetricDominates} />
                <Stat label="Chargeable" value={`${estimate.chargeableGrams} g`} />
              </div>
              <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">Current slab · {estimate.slabLabel}</p>
                <div className="mt-2 grid gap-1 text-xs font-bold text-zinc-200">
                  <span>Local ₹{estimate.zoneEstimates.local.min}–₹{estimate.zoneEstimates.local.max}</span>
                  <span>Zonal ₹{estimate.zoneEstimates.zonal.min}–₹{estimate.zoneEstimates.zonal.max}</span>
                  <span>National ₹{estimate.zoneEstimates.national.min}–₹{estimate.zoneEstimates.national.max}</span>
                </div>
                <p className="mt-2 text-[10px] font-semibold text-zinc-400">
                  + {estimate.gstPercent}% GST on shipping. Return exposure ≈ ₹{estimate.returnExposure.min}–₹{estimate.returnExposure.max}/order.
                </p>
              </div>
              <p className={`rounded-xl border p-4 text-xs font-bold leading-relaxed ${estimate.dropSuggestion.alreadyLowest ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300" : "border-amber-500/20 bg-amber-500/5 text-amber-200"}`}>
                {estimate.dropSuggestion.message}
              </p>
              <p className="text-[10px] font-semibold text-zinc-500">{LOW_SHIPPING_STRINGS.disclaimer.en}</p>
            </div>
          ) : (
            <p className="mt-5 text-[11px] font-semibold text-zinc-500">
              Fill weight + packed dimensions to see slab estimates on every variant card.
            </p>
          )}
        </div>

        {/* Editable rate card */}
        <div className={card}>
          <button
            type="button"
            className="flex w-full items-center justify-between text-xs font-extrabold uppercase tracking-wider text-zinc-100 cursor-pointer"
            onClick={() => {
              setShowRateCard((open) => !open);
              setRateCardText(JSON.stringify(rateCard, null, 2));
              setRateCardError("");
            }}
          >
            Edit rate card (JSON)
            <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${showRateCard ? "rotate-180" : ""}`} />
          </button>
          {showRateCard ? (
            <div className="mt-4 space-y-3">
              <p className="text-[10px] font-semibold leading-relaxed text-zinc-400">{rateCard.note}</p>
              <textarea
                className={`${input} min-h-56 w-full font-mono text-[10px]`}
                value={rateCardText}
                onChange={(event) => setRateCardText(event.target.value)}
                spellCheck={false}
              />
              {rateCardError ? <p className="text-[10px] font-bold text-red-400">{rateCardError}</p> : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  className={primaryBtn}
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(rateCardText);
                      if (!isValidRateCard(parsed)) throw new Error("Invalid shape");
                      setRateCard(parsed);
                      localStorage.setItem(RATE_CARD_KEY, JSON.stringify(parsed));
                      setRateCardError("");
                    } catch {
                      setRateCardError("Invalid rate card JSON — check slabs[].maxGrams and rates.local/zonal/national {min,max}.");
                    }
                  }}
                >
                  Save rate card
                </button>
                <button
                  type="button"
                  className={ghostBtn}
                  onClick={() => {
                    setRateCard(DEFAULT_RATE_CARD);
                    setRateCardText(JSON.stringify(DEFAULT_RATE_CARD, null, 2));
                    localStorage.removeItem(RATE_CARD_KEY);
                    setRateCardError("");
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Education modal */}
      {showWhy ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setShowWhy(false)}>
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-base font-extrabold text-zinc-100">{LOW_SHIPPING_STRINGS.whyTitle.en}</h2>
              <button type="button" className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:text-zinc-100 cursor-pointer" onClick={() => setShowWhy(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs font-bold text-indigo-300">{LOW_SHIPPING_STRINGS.whyTitle.hi}</p>
            <div className="mt-4 space-y-3">
              {LOW_SHIPPING_STRINGS.whyBody.hi.map((paragraph, index) => (
                <p className="text-xs font-semibold leading-relaxed text-zinc-300" key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs font-semibold leading-relaxed text-amber-200/90">
              {LOW_SHIPPING_STRINGS.honestImageWarning.hi}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VariantCard({ variant, estimate }: { variant: VariantResult; estimate: EstimateResult | null }) {
  const tone = bulkScoreTone(variant.bulkScore);
  const toneClass =
    tone === "green"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      : tone === "amber"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
        : "border-red-500/25 bg-red-500/10 text-red-300";

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-sm transition-all hover:border-zinc-700">
      <div className="relative bg-white">
        {/* Object-URL preview of a locally generated blob. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={variant.url} alt={variant.name} className="aspect-square w-full object-contain" />
        <span className={`absolute right-2 top-2 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${toneClass}`}>
          Bulk {variant.bulkScore}
        </span>
      </div>
      <div className="space-y-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-extrabold text-zinc-100">{variant.name}</h3>
          <span className="font-mono text-[10px] font-bold text-zinc-400">{(variant.bytes / 1024).toFixed(0)} KB</span>
        </div>
        {estimate ? (
          <p className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-[10px] font-semibold leading-relaxed text-zinc-400">
            Est. slab if system agrees with this bulk: <span className="font-bold text-zinc-200">₹{estimate.zoneEstimates.national.min}–₹{estimate.zoneEstimates.national.max} national</span>
            <span className="block text-zinc-500">Estimate only — confirm in Supplier Panel.</span>
          </p>
        ) : null}
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all cursor-pointer"
          onClick={() => triggerDownload(variant.blob, `${variant.id}-low-shipping.jpg`)}
        >
          <Download className="h-4 w-4" />
          Download
        </button>
      </div>
    </article>
  );
}

function Stat({ label: statLabel, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-amber-500/25 bg-amber-500/5" : "border-zinc-800 bg-zinc-950/50"}`}>
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">{statLabel}</p>
      <p className={`mt-1 font-mono text-sm font-extrabold ${highlight ? "text-amber-300" : "text-zinc-100"}`}>{value}</p>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function saveHistory(result: PipelineResult, setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>) {
  const preferred = result.variants.find((variant) => variant.id === "v1") || result.variants[0];
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 96, 96);
    ctx.drawImage(image, 0, 0, 96, 96);
    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      sourceName: result.sourceName,
      thumbnail: canvas.toDataURL("image/jpeg", 0.7),
      scores: result.variants.map((variant) => ({ id: variant.id, score: variant.bulkScore })),
      backgroundRemoved: result.backgroundRemoved,
    };
    setHistory((previous) => {
      const next = [entry, ...previous].slice(0, 12);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // Storage full — history is best-effort.
      }
      return next;
    });
  };
  image.src = preferred.url;
}
