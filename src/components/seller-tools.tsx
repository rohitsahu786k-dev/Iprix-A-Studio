"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  Camera,
  Check,
  Copy,
  Download,
  IndianRupee,
  Info,
  Tag,
  Truck,
  Type,
  Upload,
} from "lucide-react";

/*
  Free seller tools — everything here runs fully client-side.
  No AI credits, no external APIs, no cost to the seller or to us.
*/

const card = "rounded-3xl border border-zinc-800 bg-white shadow-pin p-6";
const label = "grid gap-1.5 text-xs font-bold text-zinc-300";
const input =
  "rounded-xl border border-zinc-800 px-4 py-3 text-xs font-semibold outline-none transition-colors bg-white";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-indigo-500 px-6 py-3.5 text-xs font-bold text-white hover:bg-indigo-600 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60";
const softBtn =
  "inline-flex items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-5 py-3 text-xs font-bold text-zinc-300 hover:bg-zinc-850 active:scale-[0.98] transition-all cursor-pointer";

function StatTile({ label: statLabel, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const tones = {
    neutral: "bg-zinc-900 text-zinc-100",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-indigo-50 text-indigo-600",
  } as const;
  return (
    <div className={`rounded-2xl p-4 ${tones[tone]}`}>
      <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">{statLabel}</p>
      <p className="mt-1.5 text-xl font-extrabold tracking-tight break-words">{value}</p>
    </div>
  );
}

function TipBox({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  return (
    <div
      className={`flex gap-3 rounded-2xl p-4 text-xs font-semibold leading-relaxed ${
        tone === "warn" ? "bg-amber-50 text-amber-800" : "bg-indigo-50 text-indigo-700"
      }`}
    >
      {tone === "warn" ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> : <Info className="h-4 w-4 shrink-0 mt-0.5" />}
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Meesho shipping & weight calculator                              */
/* ------------------------------------------------------------------ */

export function ShippingCalculator() {
  const [dead, setDead] = useState(300);
  const [l, setL] = useState(30);
  const [b, setB] = useState(25);
  const [h, setH] = useState(5);
  const [price, setPrice] = useState(299);

  const volumetricKg = (l * b * h) / 5000;
  const deadKg = dead / 1000;
  const chargeableKg = Math.max(volumetricKg, deadKg);
  // Courier slabs round UP to the next 0.5 kg after the first 500 g.
  const slabKg = chargeableKg <= 0.5 ? 0.5 : Math.ceil(chargeableKg * 2) / 2;

  // Indicative Meesho-side forward shipping estimates per slab (₹). These vary
  // by courier/zone/category — shown as a planning estimate only.
  const base = 42;
  const perExtraHalfKg = 26;
  const extraSlabs = Math.max(0, (slabKg - 0.5) / 0.5);
  const localEst = Math.round(base + extraSlabs * perExtraHalfKg);
  const nationalEst = Math.round(localEst * 1.75);

  const volumetricWins = volumetricKg > deadKg;
  const shipShare = price > 0 ? Math.round((nationalEst / price) * 100) : 0;

  return (
    <div className="grid gap-5">
      <div className={card}>
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-zinc-100 mb-5">
          <Truck className="h-4 w-4 text-indigo-500" />
          Meesho shipping &amp; weight calculator
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className={label}>
            <span>Dead weight (grams)</span>
            <input className={input} type="number" min={1} value={dead} onChange={(e) => setDead(Number(e.target.value) || 0)} />
          </label>
          <label className={label}>
            <span>Length (cm)</span>
            <input className={input} type="number" min={1} value={l} onChange={(e) => setL(Number(e.target.value) || 0)} />
          </label>
          <label className={label}>
            <span>Breadth (cm)</span>
            <input className={input} type="number" min={1} value={b} onChange={(e) => setB(Number(e.target.value) || 0)} />
          </label>
          <label className={label}>
            <span>Height (cm)</span>
            <input className={input} type="number" min={1} value={h} onChange={(e) => setH(Number(e.target.value) || 0)} />
          </label>
          <label className={label}>
            <span>Selling price (₹)</span>
            <input className={input} type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} />
          </label>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Volumetric weight" value={`${volumetricKg.toFixed(2)} kg`} tone={volumetricWins ? "warn" : "neutral"} />
          <StatTile label="Chargeable slab" value={`${slabKg.toFixed(1)} kg`} tone="neutral" />
          <StatTile label="Est. shipping (local)" value={`₹${localEst}`} tone="good" />
          <StatTile label="Est. shipping (national)" value={`₹${nationalEst}`} tone={shipShare > 30 ? "bad" : "neutral"} />
        </div>

        <div className="mt-5 grid gap-3">
          {volumetricWins ? (
            <TipBox tone="warn">
              Volumetric weight ({volumetricKg.toFixed(2)} kg) aapke dead weight ({deadKg.toFixed(2)} kg) se zyada hai — courier isi par charge karega.
              Packaging chhota karke (L×B×H kam) aap seedha shipping bacha sakte hain.
            </TipBox>
          ) : null}
          {shipShare > 30 && price > 0 ? (
            <TipBox tone="warn">
              National shipping aapke price ka ~{shipShare}% hai. Is weight class me price kam se kam ₹{Math.round(nationalEst / 0.25)} rakhen ya lighter
              packaging use karen, warna margin negative ja sakta hai.
            </TipBox>
          ) : null}
          <TipBox>
            <b>First image ka dhyan rakhen:</b> Meesho weight/category verification me aapki pehli image bhi dekhi jati hai. Agar first image me
            combo/multi-pack ya bada product dikh raha hai lekin aapne single unit ka weight bhara hai, to weight discrepancy me shipping charge
            badh sakta hai ya claim reject ho sakta hai. First image me wahi single unit dikhayen jiska weight declare kiya hai — combo images ko
            2nd/3rd position par rakhen. Iske liye <b>Image Checker</b> tool use karen.
          </TipBox>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Profit / settlement calculator                                   */
/* ------------------------------------------------------------------ */

export function ProfitCalculator() {
  const [price, setPrice] = useState(399);
  const [cost, setCost] = useState(180);
  const [packaging, setPackaging] = useState(15);
  const [commissionPct, setCommissionPct] = useState(0);
  const [gstPct, setGstPct] = useState(5);
  const [shipping, setShipping] = useState(0);
  const [adsPerOrder, setAdsPerOrder] = useState(10);
  const [rtoPct, setRtoPct] = useState(10);
  const [rtoLoss, setRtoLoss] = useState(80);

  const commission = (price * commissionPct) / 100;
  // GST is charged on the commission + shipping fees (seller side), while the
  // product GST is collected from the buyer. Simplified planning view:
  const feeGst = ((commission + shipping) * 18) / 100;
  const settlement = price - commission - shipping - feeGst;
  const taxOnProduct = price - price / (1 + gstPct / 100);
  const profitDelivered = settlement - cost - packaging - adsPerOrder - taxOnProduct;
  const delivered = 1 - rtoPct / 100;
  const expectedProfit = profitDelivered * delivered - (rtoPct / 100) * rtoLoss;
  const margin = price > 0 ? (profitDelivered / price) * 100 : 0;

  const breakeven = cost + packaging + adsPerOrder + shipping;

  return (
    <div className="grid gap-5">
      <div className={card}>
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-zinc-100 mb-5">
          <Calculator className="h-4 w-4 text-indigo-500" />
          Profit &amp; settlement calculator
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Selling price (₹)", price, setPrice],
            ["Product cost (₹)", cost, setCost],
            ["Packaging cost (₹)", packaging, setPackaging],
            ["Commission %", commissionPct, setCommissionPct],
            ["Product GST %", gstPct, setGstPct],
            ["Shipping charged to you (₹)", shipping, setShipping],
            ["Ads cost per order (₹)", adsPerOrder, setAdsPerOrder],
            ["RTO / return rate %", rtoPct, setRtoPct],
            ["Loss per RTO order (₹)", rtoLoss, setRtoLoss],
          ].map(([fieldLabel, value, setter]) => (
            <label className={label} key={String(fieldLabel)}>
              <span>{String(fieldLabel)}</span>
              <input
                className={input}
                type="number"
                value={Number(value)}
                onChange={(e) => (setter as (n: number) => void)(Number(e.target.value) || 0)}
              />
            </label>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Bank settlement" value={`₹${settlement.toFixed(0)}`} tone="neutral" />
          <StatTile label="Profit / delivered order" value={`₹${profitDelivered.toFixed(0)}`} tone={profitDelivered > 0 ? "good" : "bad"} />
          <StatTile label="Margin" value={`${margin.toFixed(1)}%`} tone={margin >= 15 ? "good" : margin > 0 ? "warn" : "bad"} />
          <StatTile
            label={`Real profit @ ${rtoPct}% RTO`}
            value={`₹${expectedProfit.toFixed(0)}`}
            tone={expectedProfit > 0 ? "good" : "bad"}
          />
        </div>

        <div className="mt-5 grid gap-3">
          {expectedProfit <= 0 ? (
            <TipBox tone="warn">
              RTO ke baad ye product loss me hai. Ya to price badhayen (breakeven: ₹{Math.ceil(breakeven)}+), packaging weight kam karen, ya is
              product ko list karne se pehle RTO-heavy pin codes ke liye COD limit check karen.
            </TipBox>
          ) : (
            <TipBox>
              Har delivered order par aapko approx <b>₹{profitDelivered.toFixed(0)}</b> milega. RTO ka asar milakar realistic profit{" "}
              <b>₹{expectedProfit.toFixed(0)}</b>/order hai. Price ke A/B test ke liye alag price par dobara calculate karen.
            </TipBox>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. First image checker (Meesho image guard)                         */
/* ------------------------------------------------------------------ */

type ImageReport = {
  width: number;
  height: number;
  sizeKb: number;
  whiteBgPct: number;
  brightness: number;
  square: boolean;
};

export function ImageChecker() {
  const [report, setReport] = useState<ImageReport | null>(null);
  const [preview, setPreview] = useState("");
  const [isCombo, setIsCombo] = useState(false);
  const [hasText, setHasText] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function analyse(file: File) {
    setBusy(true);
    try {
      const url = URL.createObjectURL(file);
      setPreview(url);
      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("load"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 400 / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Sample the border (outer 8%) to estimate background whiteness.
      const bw = Math.max(2, Math.round(canvas.width * 0.08));
      const bh = Math.max(2, Math.round(canvas.height * 0.08));
      let borderCount = 0;
      let whiteCount = 0;
      let lumSum = 0;
      let totalCount = 0;
      for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const bch = data[i + 2];
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * bch;
          lumSum += lum;
          totalCount += 1;
          const isBorder = x < bw || x > canvas.width - bw || y < bh || y > canvas.height - bh;
          if (isBorder) {
            borderCount += 1;
            const maxC = Math.max(r, g, bch);
            const minC = Math.min(r, g, bch);
            if (lum > 232 && maxC - minC < 18) whiteCount += 1;
          }
        }
      }

      setReport({
        width: img.width,
        height: img.height,
        sizeKb: Math.round(file.size / 1024),
        whiteBgPct: borderCount ? Math.round((whiteCount / borderCount) * 100) : 0,
        brightness: Math.round(lumSum / Math.max(1, totalCount)),
        square: Math.abs(img.width / img.height - 1) < 0.06,
      });
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  const checks = useMemo(() => {
    if (!report) return [];
    return [
      {
        ok: report.width >= 1000 && report.height >= 1000,
        warn: report.width >= 512,
        text: `Resolution ${report.width}×${report.height}px — Meesho minimum 512px, recommended 1000px+`,
      },
      { ok: report.square, warn: false, text: report.square ? "Square (1:1) ratio — perfect for catalog grid" : "Image square (1:1) nahi hai — crop karke 1:1 banayen" },
      {
        ok: report.whiteBgPct >= 80,
        warn: report.whiteBgPct >= 55,
        text: `Background whiteness ${report.whiteBgPct}% — first image ke liye plain white/light background best rehta hai`,
      },
      { ok: report.sizeKb <= 2048, warn: false, text: `File size ${report.sizeKb} KB ${report.sizeKb > 2048 ? "— 2MB se kam karen" : "— OK"}` },
      { ok: report.brightness >= 120, warn: report.brightness >= 90, text: `Brightness ${report.brightness}/255 ${report.brightness < 120 ? "— photo thodi dark hai, lighting improve karen" : "— OK"}` },
    ];
  }, [report]);

  const score = useMemo(() => {
    if (!report) return 0;
    let s = 0;
    for (const c of checks) s += c.ok ? 20 : c.warn ? 10 : 0;
    if (isCombo) s = Math.max(0, s - 25);
    if (hasText) s = Math.max(0, s - 10);
    return s;
  }, [checks, report, isCombo, hasText]);

  return (
    <div className="grid gap-5">
      <div className={card}>
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-zinc-100 mb-2">
          <Camera className="h-4 w-4 text-indigo-500" />
          First image checker (Meesho image guard)
        </div>
        <p className="text-xs font-semibold text-zinc-400 leading-relaxed mb-5 max-w-2xl">
          Meesho par shipping/weight verification me <b>first image</b> ka bada role hai — combo ya oversized dikhne wali first image par zyada
          shipping charge ya weight-claim reject hone ka risk rehta hai. Upload karke turant check karen.
        </p>

        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="grid gap-4">
            <label className={label}>
              <span>First image</span>
              <input
                ref={fileRef}
                className={input}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void analyse(file);
                }}
              />
            </label>
            {preview ? (
              // Local object-URL preview of the uploaded file.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="rounded-2xl border border-zinc-800 max-h-72 object-contain bg-zinc-900" />
            ) : (
              <button className={softBtn} type="button" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" />
                {busy ? "Analysing..." : "Choose product image"}
              </button>
            )}
            <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 accent-[#4f46e5]" checked={isCombo} onChange={(e) => setIsCombo(e.target.checked)} />
              Image me combo / multi-pack dikh raha hai
            </label>
            <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 accent-[#4f46e5]" checked={hasText} onChange={(e) => setHasText(e.target.checked)} />
              Image par text / watermark / offer sticker hai
            </label>
          </div>

          <div className="grid gap-3 content-start">
            {report ? (
              <>
                <div className="flex items-center gap-4">
                  <div
                    className={`grid h-20 w-20 shrink-0 place-items-center rounded-full text-xl font-extrabold text-white ${
                      score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-indigo-500"
                    }`}
                  >
                    {score}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-zinc-100">
                      {score >= 80 ? "First image ready hai" : score >= 50 ? "Thoda improvement chahiye" : "Is image ko first position par mat lagayen"}
                    </p>
                    <p className="text-xs font-semibold text-zinc-400 mt-1">Score / 100 — resolution, ratio, background, size, brightness</p>
                  </div>
                </div>
                <div className="grid gap-2">
                  {checks.map((c) => (
                    <div
                      key={c.text}
                      className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs font-semibold ${
                        c.ok ? "bg-emerald-50 text-emerald-700" : c.warn ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-600"
                      }`}
                    >
                      {c.ok ? <Check className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
                      {c.text}
                    </div>
                  ))}
                  {isCombo ? (
                    <TipBox tone="warn">
                      Combo first image + single-unit weight = <b>shipping overcharge ka sabse common reason.</b> Combo listing hai to combo ka total
                      weight declare karen; single listing hai to first image me sirf ek unit dikhayen.
                    </TipBox>
                  ) : null}
                  {hasText ? (
                    <TipBox tone="warn">Meesho first image par text/watermark allow nahi karta — image reject ho sakti hai. Clean photo use karen.</TipBox>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-750 p-10 text-center text-xs font-semibold text-zinc-500">
                Image upload karte hi yahan full compliance report aa jayegi — sab kuch aapke browser me hi hota hai, image kahin upload nahi hoti.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Bulk SKU generator                                               */
/* ------------------------------------------------------------------ */

export function SkuGenerator() {
  const [brand, setBrand] = useState("APS");
  const [category, setCategory] = useState("KRT");
  const [colors, setColors] = useState("Red, Blue, Black");
  const [sizes, setSizes] = useState("S, M, L, XL");
  const [start, setStart] = useState(1);
  const [copied, setCopied] = useState("");

  const skus = useMemo(() => {
    const clean = (v: string) =>
      v
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    const colorList = clean(colors).length ? clean(colors) : [""];
    const sizeList = clean(sizes).length ? clean(sizes) : [""];
    const list: string[] = [];
    let n = start;
    for (const c of colorList) {
      for (const s of sizeList) {
        const parts = [brand, category, c.slice(0, 3), s].map((p) => p.replace(/\s+/g, "").toUpperCase()).filter(Boolean);
        list.push(`${parts.join("-")}-${String(n).padStart(3, "0")}`);
        n += 1;
      }
    }
    return list;
  }, [brand, category, colors, sizes, start]);

  async function copyAll() {
    await navigator.clipboard.writeText(skus.join("\n"));
    setCopied("all");
    setTimeout(() => setCopied(""), 1500);
  }

  function downloadCsv() {
    const blob = new Blob([`sku\n${skus.join("\n")}`], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "skus.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className={card}>
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-zinc-100 mb-5">
        <Tag className="h-4 w-4 text-indigo-500" />
        Bulk SKU generator
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className={label}>
          <span>Brand code</span>
          <input className={input} value={brand} onChange={(e) => setBrand(e.target.value)} />
        </label>
        <label className={label}>
          <span>Category code</span>
          <input className={input} value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <label className={label}>
          <span>Colors (comma separated)</span>
          <input className={input} value={colors} onChange={(e) => setColors(e.target.value)} />
        </label>
        <label className={label}>
          <span>Sizes (comma separated)</span>
          <input className={input} value={sizes} onChange={(e) => setSizes(e.target.value)} />
        </label>
        <label className={label}>
          <span>Start number</span>
          <input className={input} type="number" min={1} value={start} onChange={(e) => setStart(Number(e.target.value) || 1)} />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className={primaryBtn} type="button" onClick={copyAll}>
          <Copy className="h-4 w-4" />
          {copied === "all" ? "Copied!" : `Copy ${skus.length} SKUs`}
        </button>
        <button className={softBtn} type="button" onClick={downloadCsv}>
          <Download className="h-4 w-4" />
          Download CSV
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {skus.slice(0, 60).map((sku) => (
          <span key={sku} className="rounded-full bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 font-mono text-[10px] font-bold text-zinc-300">
            {sku}
          </span>
        ))}
        {skus.length > 60 ? <span className="text-xs font-bold text-zinc-500 self-center">+{skus.length - 60} more</span> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Title compliance checker                                         */
/* ------------------------------------------------------------------ */

const riskyWords = [
  "guarantee", "guaranteed", "100%", "best", "cheapest", "free delivery", "free shipping",
  "cod available", "cash on delivery", "original", "branded", "replica", "first copy",
  "copy", "fake", "no.1", "number 1", "sale", "offer", "discount", "lowest price",
];

export function TitleChecker() {
  const [title, setTitle] = useState("");

  const found = useMemo(() => riskyWords.filter((w) => title.toLowerCase().includes(w)), [title]);
  const words = useMemo(() => (title.trim() ? title.trim().split(/\s+/) : []), [title]);
  const repeated = useMemo(() => {
    const seen = new Map<string, number>();
    for (const w of words) {
      const key = w.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (key.length > 2) seen.set(key, (seen.get(key) || 0) + 1);
    }
    return [...seen.entries()].filter(([, n]) => n > 2).map(([w]) => w);
  }, [words]);
  const capsRatio = title.length ? title.replace(/[^A-Z]/g, "").length / Math.max(1, title.replace(/[^A-Za-z]/g, "").length) : 0;
  const specials = (title.match(/[!@#$%^*_=+~<>{}[\]|\\]/g) || []).length;

  const checks = title.trim()
    ? [
        { ok: title.length >= 40 && title.length <= 100, text: `Length ${title.length} chars — 40-100 best hai (keywords + readability)` },
        { ok: found.length === 0, text: found.length ? `Risky words: ${found.join(", ")} — Meesho/Flipkart in par listing reject kar sakte hain` : "Koi banned/risky word nahi mila" },
        { ok: repeated.length === 0, text: repeated.length ? `Keyword stuffing: "${repeated.join('", "')}" 3+ baar repeat hua hai` : "Koi keyword stuffing nahi" },
        { ok: capsRatio < 0.5, text: capsRatio >= 0.5 ? "Title mostly CAPITAL letters me hai — Title Case use karen" : "Letter casing thik hai" },
        { ok: specials === 0, text: specials ? `${specials} special characters mile — title me sirf letters/numbers/()- use karen` : "Koi invalid special character nahi" },
        { ok: words.length >= 6, text: `${words.length} words — 6+ words me product type, material, color, size, use-case cover karen` },
      ]
    : [];

  const score = checks.length ? Math.round((checks.filter((c) => c.ok).length / checks.length) * 100) : 0;

  return (
    <div className={card}>
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-zinc-100 mb-5">
        <Type className="h-4 w-4 text-indigo-500" />
        Title compliance checker
      </div>
      <label className={label}>
        <span>Listing title</span>
        <textarea
          className={`${input} min-h-24`}
          placeholder="e.g. Women Rayon Anarkali Kurti with Dupatta | Festive Wear | Full Sleeve | Yellow"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      {checks.length ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[auto_1fr] items-start">
          <div
            className={`grid h-20 w-20 place-items-center rounded-full text-xl font-extrabold text-white ${
              score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-indigo-500"
            }`}
          >
            {score}
          </div>
          <div className="grid gap-2">
            {checks.map((c) => (
              <div
                key={c.text}
                className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs font-semibold ${
                  c.ok ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-600"
                }`}
              >
                {c.ok ? <Check className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
                {c.text}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs font-semibold text-zinc-500">
          Title paste karte hi length, banned words, keyword stuffing, casing aur special characters ka live audit milega.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Combined free-tools hub                                             */
/* ------------------------------------------------------------------ */

export function FreeToolsHub() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 w-fit">
        <IndianRupee className="h-4 w-4" />
        Ye sab tools hamesha free hain — koi AI credit use nahi hota
      </div>
      <ShippingCalculator />
      <ProfitCalculator />
      <ImageChecker />
      <SkuGenerator />
      <TitleChecker />
    </div>
  );
}
