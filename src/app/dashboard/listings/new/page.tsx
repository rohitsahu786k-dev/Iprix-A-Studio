"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Lock, Save, Sparkles } from "lucide-react";

const fields = [
  ["productName", "Product name", true],
  ["category", "Category", false],
  ["brand", "Brand", true],
  ["platform", "Target platform", false],
  ["sellingPrice", "Selling price", false],
  ["mrp", "MRP", false],
  ["color", "Color", false],
  ["size", "Size", false],
  ["material", "Material", false],
  ["gender", "Gender", false],
  ["occasion", "Occasion", false],
  ["targetAudience", "Target audience", false],
  ["keyFeatures", "Key features", false],
  ["keywords", "Existing keywords", false],
  ["tone", "Tone", false],
] as const;

export default function NewListingPage() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [usage, setUsage] = useState<Record<string, unknown> | null>(null);
  const [listingId, setListingId] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    setResult(null);
    setListingId("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/listings/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(data.error || "Generation failed.");
        setUsage(data.usage || null);
        return;
      }
      setResult(data.output || data.listing);
      setListingId(data.listing?._id || "");
      setUsage(data.usage || null);
      setStatus("AI listing generated as a draft. Usage will count when you save, export or send it.");
    } catch {
      setStatus("Generation failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAsTemplate() {
    if (!result) return;
    const response = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${String(result.generatedTitle || result.title || "AI listing")} template`,
        platform: "meesho",
        source: "ai_generated",
        fields: [
          { key: "title", label: "Product title", value: result.generatedTitle || result.title || "", selector: "", inputType: "text" },
          { key: "description", label: "Description", value: result.longDescription || "", selector: "", inputType: "textarea" },
          { key: "sku", label: "SKU", value: result.sku || "", selector: "", inputType: "text" },
          { key: "keywords", label: "Keywords", value: allKeywords(result).join(", "), selector: "", inputType: "text" },
        ],
      }),
    });
    const data = await response.json().catch(() => ({}));
    setStatus(response.ok ? "Saved as template for extension autofill." : data.error || "Could not save template.");
  }

  async function countUsage(action: "save" | "extension" | "export") {
    if (!listingId) {
      setStatus("Generate the listing first, then save or use it.");
      return false;
    }
    const response = await fetch("/api/ai/listing/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, fields: result || {}, action }),
    });
    const data = await response.json().catch(() => ({}));
    setUsage(data.usage || usage);
    setStatus(response.ok ? "Listing saved and usage updated." : data.error || "Could not save listing.");
    return response.ok;
  }

  async function createProduct() {
    if (!result) return;
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(result.generatedTitle || result.title || "AI product"),
        description: String(result.longDescription || ""),
        keywords: allKeywords(result),
        features: toTextList(result.bulletPoints),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setStatus(response.ok ? "Product created from listing." : data.error || "Could not create product.");
  }

  async function exportCsv() {
    if (usage?.plan === "free") {
      setStatus("CSV export is paid-only. Upgrade to continue.");
      return;
    }
    if (!result) return;
    const allowed = await countUsage("export");
    if (!allowed) return;
    const csv = `title,description,sku,keywords\n"${String(result.generatedTitle || result.title || "").replaceAll('"', '""')}","${String(result.longDescription || "").replaceAll('"', '""')}","${String(result.sku || "").replaceAll('"', '""')}","${allKeywords(result).join(", ").replaceAll('"', '""')}"`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "a-plus-studio-ai-listing.csv";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("CSV exported.");
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-950" href="/dashboard/listings">
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Link>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Create AI Listing</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-neutral-900">Product Basics</h1>
        </div>
        {usage ? (
            <span className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase text-neutral-700">
            {String(usage.label || "")}
          </span>
        ) : null}
      </div>

      {status ? (
        <div className={`rounded-xl border px-4 py-3 text-xs font-bold ${status.includes("Upgrade") || status.includes("used") ? "border-red-200 bg-red-50 text-red-800" : "border-neutral-200 bg-white text-neutral-700"}`}>
          {status}
        </div>
      ) : null}

      {usage?.upgradeRequired ? <UpgradeModal /> : null}

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:grid-cols-2">
          {fields.map(([name, label, required]) => (
            <label className={name === "keyFeatures" || name === "tone" ? "grid gap-1.5 text-xs font-bold text-neutral-700 md:col-span-2" : "grid gap-1.5 text-xs font-bold text-neutral-700"} key={name}>
              <span>{label}</span>
              {name === "keyFeatures" ? (
                <textarea className="min-h-24 rounded-xl border border-neutral-200 px-4 py-3 text-xs font-semibold outline-none focus:border-neutral-300 focus:ring-2 focus:ring-indigo-100" name={name} required={required} />
              ) : name === "platform" ? (
                <select className="rounded-xl border border-neutral-200 px-4 py-3 text-xs font-semibold outline-none focus:border-neutral-300 focus:ring-2 focus:ring-indigo-100" name={name} defaultValue="meesho">
                  <option value="meesho">Meesho</option>
                  <option value="flipkart">Flipkart beta</option>
                  <option value="amazon">Amazon beta</option>
                </select>
              ) : name === "tone" ? (
                <select className="rounded-xl border border-neutral-200 px-4 py-3 text-xs font-semibold outline-none focus:border-neutral-300 focus:ring-2 focus:ring-indigo-100" name={name} defaultValue="marketplace optimized">
                  <option value="simple">Simple</option>
                  <option value="premium">Premium</option>
                  <option value="seo">SEO</option>
                  <option value="marketplace optimized">Marketplace optimized</option>
                </select>
              ) : (
                <input className="rounded-xl border border-neutral-200 px-4 py-3 text-xs font-semibold outline-none focus:border-neutral-300 focus:ring-2 focus:ring-indigo-100" name={name} required={required} />
              )}
            </label>
          ))}
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3.5 text-xs font-bold text-zinc-100 disabled:opacity-60 md:col-span-2" disabled={busy}>
            <Sparkles className="h-4 w-4" />
            {busy ? "Generating..." : "Generate & Save AI Listing"}
          </button>
        </form>

        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-neutral-900">
            <Check className="h-4 w-4" />
            Review
          </div>
          {result ? (
            <div className="mt-5 space-y-4">
              <EditableBlock label="Optimized title" value={String(result.generatedTitle || result.title || "")} />
              <EditableBlock label="Short description" value={String(result.shortDescription || "")} />
              <EditableBlock label="Long description" value={String(result.longDescription || "")} tall />
              <EditableBlock label="Bullet points" value={toTextList(result.bulletPoints).join("\n")} tall />
              <EditableBlock label="Primary keywords" value={toTextList(result.primaryKeywords).join(", ")} />
              <EditableBlock label="Secondary keywords" value={toTextList(result.secondaryKeywords).join(", ")} />
              <EditableBlock label="Long-tail keywords" value={toTextList(result.longTailKeywords).join(", ")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Score label="Title score" value={scoreValue(result.listingScore, "title")} />
                <Score label="Keyword score" value={scoreValue(result.listingScore, "keywords")} />
                <Score label="Description score" value={scoreValue(result.listingScore, "description")} />
                <Score label="Readiness score" value={scoreValue(result.listingScore, "marketplaceReadiness")} />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-xs font-bold text-zinc-100" onClick={() => countUsage("save")}>
                  <Save className="h-4 w-4" />
                  Save Listing
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-800" onClick={saveAsTemplate}>Save as template</button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-800" onClick={createProduct}>Create product</button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-800" onClick={async () => { if (await countUsage("extension")) await saveAsTemplate(); }}>Send to extension</button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-500" title="CSV export is paid-only" onClick={exportCsv}>
                  <Lock className="h-4 w-4" />
                  Export CSV
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-xs font-semibold leading-6 text-neutral-500">
              Generated fields, listing quality score and save actions will appear here.
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

function toTextList(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function allKeywords(result: Record<string, unknown>) {
  const grouped = [
    ...toTextList(result.primaryKeywords),
    ...toTextList(result.secondaryKeywords),
    ...toTextList(result.longTailKeywords),
    ...toTextList(result.keywords),
  ];
  return Array.from(new Set(grouped.filter(Boolean)));
}

function scoreValue(score: unknown, key: string) {
  if (!score || typeof score !== "object") return undefined;
  const value = (score as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
}

function EditableBlock({ label, value, tall = false }: { label: string; value?: string; tall?: boolean }) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-neutral-700">
      <span>{label}</span>
      <textarea className={`rounded-xl border border-neutral-200 p-3 text-xs font-semibold leading-6 outline-none focus:border-neutral-300 focus:ring-2 focus:ring-indigo-100 ${tall ? "min-h-28" : "min-h-16"}`} defaultValue={value || ""} />
    </label>
  );
}

function Score({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">{label}</p>
      <p className="mt-1 font-mono text-2xl font-extrabold text-neutral-900">{value ?? "-"}</p>
    </div>
  );
}

function UpgradeModal() {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-xl font-extrabold text-neutral-900">You have used your 5 free AI listings</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-neutral-700">
        Your saved templates and listings are safe. Upgrade now to continue creating, optimizing and autofilling product listings without interruption.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link className="rounded-xl bg-neutral-950 px-4 py-3 text-xs font-bold text-zinc-100" href="/dashboard/subscription">Upgrade to Seller</Link>
        <Link className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-800" href="/pricing">View All Plans</Link>
      </div>
    </div>
  );
}
