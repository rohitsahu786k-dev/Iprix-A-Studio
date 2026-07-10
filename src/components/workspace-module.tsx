"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Check,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Layers3,
  Package,
  Search,
  Sparkles,
  Timer,
  Upload,
  Zap,
} from "lucide-react";
import { pricingPlans } from "@/lib/plans";
import { PricingCard } from "@/components/pricing-card";
import {
  ImageChecker,
  PriceCalculator,
  ProfitCalculator,
  ShippingCalculator,
  SkuGenerator,
  TitleChecker,
} from "@/components/seller-tools";
import { KeywordExplorer } from "@/components/keyword-explorer";
import { LowShippingStudio } from "@/components/low-shipping-studio";

type RazorpayInstance = {
  open: () => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const resourceMap: Record<string, string> = {
  templates: "templates",
  products: "products",
  "smart-listings": "listings",
  notifications: "notifications",
  team: "team",
  support: "support-tickets",
};

const titles: Record<string, string> = {
  templates: "Templates",
  products: "Products",
  "smart-listings": "Smart Listings",
  "image-maker": "Image Maker",
  "low-shipping-images": "Low Shipping Images",
  "label-analyser": "Label Analyser",
  "keyword-research": "Keyword Research",
  "keyword-explorer": "Keyword Explorer",
  "shipping-calculator": "Shipping Calculator",
  "profit-calculator": "Profit Calculator",
  "price-calculator": "Price Calculator",
  "image-checker": "Image Checker",
  "sku-generator": "SKU Generator",
  "title-checker": "Title Checker",
  "ai-content-studio": "AI Content Studio",
  "bulk-csv-upload": "Bulk CSV Upload",
  subscription: "Subscription",
  tutorial: "Tutorial",
  notifications: "Notifications",
  support: "Support",
  settings: "Settings",
  team: "Team",
};

export function WorkspaceModule({ module }: { module: string }) {
  const title = titles[module] || "Overview";
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState("");
  const resource = resourceMap[module];

  useEffect(() => {
    if (!resource) return;
    fetch(`/api/${resource}`)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setStatus("Could not load records."));
  }, [resource]);

  const form = useMemo(() => {
    if (module === "products") return <ProductForm onDone={setStatus} />;
    if (module === "templates") return <TemplateForm onDone={setStatus} />;
    if (module === "keyword-research") return <KeywordForm onDone={setStatus} />;
    if (module === "keyword-explorer") return <KeywordExplorer />;
    if (module === "shipping-calculator") return <ShippingCalculator />;
    if (module === "profit-calculator") return <ProfitCalculator />;
    if (module === "price-calculator") return <PriceCalculator />;
    if (module === "image-checker") return <ImageChecker />;
    if (module === "sku-generator") return <SkuGenerator />;
    if (module === "title-checker") return <TitleChecker />;
    if (module === "ai-content-studio") return <AIForm onDone={setStatus} />;
    if (module === "image-maker") return <ImageForm onDone={setStatus} />;
    if (module === "low-shipping-images") return <LowShippingStudio />;
    if (module === "label-analyser") return <LabelForm onDone={setStatus} />;
    if (module === "subscription") return <SubscriptionForm onDone={setStatus} />;
    if (module === "team") return <TeamForm onDone={setStatus} />;
    if (module === "notifications") return <NotificationForm onDone={setStatus} />;
    if (module === "support") return <SupportForm onDone={setStatus} />;
    if (module === "tutorial") return <Tutorial />;
    if (module === "bulk-csv-upload") return <BulkCsvForm onDone={setStatus} />;
    if (module === "settings") return <SettingsForm onDone={setStatus} />;
    if (module === "smart-listings") return <SmartListingForm onDone={setStatus} />;
    return null;
  }, [module]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end mb-8">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Seller Workspace</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-zinc-100">{title}</h1>
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-zinc-300 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-zinc-100" />
          Meesho live | Flipkart/Amazon beta
        </span>
      </div>
      
      {status ? (
        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-xs font-bold text-zinc-200 shadow-sm transition-all">
          {status}
        </div>
      ) : null}

      {form ? <section className="mt-6">{form}</section> : <Overview />}
      {resource ? <Records items={items} resource={resource} /> : null}
    </div>
  );
}

function Overview() {
  const [summary, setSummary] = useState<{
    user?: { plan?: string };
    counts?: { templates?: number; products?: number; listings?: number; keywordReports?: number; extensionLogs?: number };
    usage?: { listings?: { label?: string; used?: number; limit?: number }; keywords?: { label?: string; used?: number; limit?: number } };
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/dashboard/summary")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setSummary(data);
      })
      .catch(() => {
        if (mounted) setSummary({});
      });
    return () => {
      mounted = false;
    };
  }, []);

  const counts = summary?.counts || {};
  const stats = [
    ["Current plan", summary?.user?.plan || "-", CreditCard],
    ["Templates", String(counts.templates ?? 0), Layers3],
    ["Products", String(counts.products ?? 0), Package],
    ["Listings created", String(counts.listings ?? 0), Sparkles],
    ["Keyword reports", String(counts.keywordReports ?? 0), Search],
    ["Extension actions", String(counts.extensionLogs ?? 0), Upload],
    ["Listing quota", summary?.usage?.listings?.label || "-", Zap],
    ["Keyword quota", summary?.usage?.keywords?.label || "-", Timer],
  ] as const;

  return (
    <div className="mt-8 space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-5 shadow-sm flex items-center justify-between hover:border-zinc-700 transition-all group" key={label}>
            <div className="min-w-0 pr-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">{label}</p>
              <p className={`mt-2 break-words font-extrabold tracking-tight text-zinc-100 ${String(label).includes("quota") ? "text-sm leading-5" : "text-3xl font-mono"}`}>{value}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-850 bg-zinc-950/50 text-zinc-200 group-hover:bg-zinc-800 group-hover:text-zinc-100 transition-all">
              <Icon className="h-5 w-5" />
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 shadow-sm">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-100 mb-5">Quick Actions</h2>
          <div className="grid gap-3">
            {[
              ["Create product", Package, "/dashboard/products"],
              ["Save template", Layers3, "/dashboard/templates"],
              ["Generate listing", Sparkles, "/dashboard/listings/new"],
              ["Research keywords", Search, "/dashboard/keyword-research"],
            ].map(([item, Icon, href]) => (
              <a 
                className="flex items-center justify-between rounded-xl border border-zinc-800 px-4 py-3.5 text-xs font-bold text-zinc-300 hover:bg-zinc-950/50 hover:text-indigo-400 transition-all group" 
                href={String(href)} 
                key={String(item)}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                  {String(item)}
                </span>
                <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </a>
            ))}
          </div>
        </article>

        {/* Onboarding Checklist */}
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 shadow-sm">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-100 mb-5">Workspace Checklist</h2>
          <div className="space-y-4">
            {[
              { title: "Add product data", desc: "Save product name, brand, category, price and features." },
              { title: "Generate AI listing", desc: "Create final title, descriptions, keywords, SKU and score." },
              { title: "Run keyword research", desc: "Save product-specific keyword reports before publishing." },
              { title: "Connect Chrome extension", desc: "Use saved templates and autofill after checking quota." },
            ].map((step, idx) => (
              <div className="flex gap-4 items-start" key={idx}>
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  0{idx + 1}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                    {step.title}
                    <Check className="h-3.5 w-3.5 text-zinc-500" />
                  </h4>
                  <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function ProductForm({ onDone }: { onDone: (message: string) => void }) {
  return <JsonForm endpoint="/api/products" fields={["title", "brand", "category", "sellingPrice", "mrp", "description", "keywords"]} onDone={onDone} />;
}

function TemplateForm({ onDone }: { onDone: (message: string) => void }) {
  return <JsonForm endpoint="/api/templates" fields={["name", "platform", "titleSelector", "priceSelector", "descriptionSelector"]} onDone={onDone} />;
}

function TeamForm({ onDone }: { onDone: (message: string) => void }) {
  return <JsonForm endpoint="/api/team" fields={["email", "role"]} onDone={onDone} />;
}

function NotificationForm({ onDone }: { onDone: (message: string) => void }) {
  return <JsonForm endpoint="/api/notifications" fields={["title", "message", "type"]} onDone={onDone} />;
}

function SupportForm({ onDone }: { onDone: (message: string) => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.7fr]">
      <JsonForm
        endpoint="/api/support-tickets"
        fields={["subject", "category", "priority", "message", "attachmentUrl"]}
        button="Create support ticket"
        onDone={onDone}
      />
      <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-100">Support promise</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Share the issue, marketplace page, screenshot link and what you expected. Admin can track status, reply, and keep your full ticket history here.
        </p>
        <a className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-medium text-white" href="https://wa.me/916394423902">
          WhatsApp support
          <ArrowRight className="h-4 w-4" />
        </a>
      </article>
    </div>
  );
}

function SettingsForm({ onDone }: { onDone: (message: string) => void }) {
  return <JsonForm endpoint="/api/products" fields={["title", "internalNotes"]} button="Save profile note" onDone={onDone} />;
}

function SmartListingForm({ onDone }: { onDone: (message: string) => void }) {
  return <JsonForm endpoint="/api/listings" fields={["title", "platform", "description", "sku", "keywords"]} button="Save draft listing" onDone={onDone} />;
}

function JsonForm({ endpoint, fields, button = "Save", onDone }: { endpoint: string; fields: string[]; button?: string; onDone: (message: string) => void }) {
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const raw = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      payload[key] = String(value).includes(",") ? String(value).split(",").map((part) => part.trim()).filter(Boolean) : value;
    }
    if (endpoint.includes("templates")) {
      payload.selectors = {
        title: payload.titleSelector,
        price: payload.priceSelector,
        description: payload.descriptionSelector,
      };
      delete payload.titleSelector;
      delete payload.priceSelector;
      delete payload.descriptionSelector;
    }
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      onDone(response.ok ? "Saved successfully." : data.error || "Could not save.");
      if (response.ok) event.currentTarget.reset();
    } catch {
      onDone("An error occurred while saving.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 shadow-sm md:grid-cols-2">
      {fields.map((field) => (
        <label className="grid gap-1.5 text-xs font-bold text-zinc-300" key={field}>
          <span>{label(field)}</span>
          <input 
            className="rounded-xl border border-zinc-800 px-4 py-3 outline-none text-zinc-100 font-semibold focus:border-zinc-700 focus:ring-2 focus:ring-indigo-100 transition-colors bg-zinc-900/50 backdrop-blur-md placeholder:text-zinc-500" 
            name={field} 
            required={field === "title" || field === "name" || field === "email"} 
          />
        </label>
      ))}
      <button 
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-60 transition-all cursor-pointer md:col-span-2 shadow-sm"
        disabled={busy}
      >
        <Check className="h-4 w-4" />
        {busy ? "Saving..." : button}
      </button>
    </form>
  );
}

function AIForm({ onDone }: { onDone: (message: string) => void }) {
  return (
    <AIJsonForm
      endpoint="/api/ai/listing/generate"
      fields={[
        ["productName", "Product name"],
        ["brand", "Brand"],
        ["category", "Category"],
        ["platform", "Platform"],
        ["targetAudience", "Target audience"],
        ["inputFeatures", "Product features"],
        ["keywords", "Existing keywords"],
      ]}
      button="Generate final listing content"
      onDone={onDone}
    />
  );
}

function KeywordForm({ onDone }: { onDone: (message: string) => void }) {
  return (
    <AIJsonForm
      endpoint="/api/ai/keyword-research"
      fields={[
        ["productName", "Product name"],
        ["brand", "Brand"],
        ["seedKeyword", "Seed keyword"],
        ["category", "Category"],
        ["platform", "Platform"],
        ["targetAudience", "Target audience"],
        ["season", "Season or festival"],
        ["competitorTitle", "Competitor title"],
      ]}
      button="Generate keyword report"
      onDone={onDone}
    />
  );
}

function AIJsonForm({
  endpoint,
  fields,
  button,
  onDone,
}: {
  endpoint: string;
  fields: [string, string][];
  button: string;
  onDone: (message: string) => void;
}) {
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setOutput("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      const generated = data.output || data.report || data.listing || data.error || {};
      setOutput(typeof generated === "string" ? generated : JSON.stringify(generated, null, 2));
      onDone(response.ok ? "Final AI output generated and saved." : data.error || "Generation failed.");
    } catch {
      onDone("An error occurred during generation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([name, fieldLabel]) => (
          <label className={name === "inputFeatures" || name === "competitorTitle" ? "grid gap-1.5 text-xs font-bold text-zinc-300 md:col-span-2" : "grid gap-1.5 text-xs font-bold text-zinc-300"} key={name}>
            <span>{fieldLabel}</span>
            {name === "inputFeatures" || name === "competitorTitle" ? (
              <textarea className="min-h-24 rounded-xl border border-zinc-800 px-4 py-3 text-xs font-semibold outline-none focus:border-zinc-700 focus:ring-2 focus:ring-indigo-100" name={name} required={["inputFeatures"].includes(name)} />
            ) : (
              <input className="rounded-xl border border-zinc-800 px-4 py-3 text-xs font-semibold outline-none focus:border-zinc-700 focus:ring-2 focus:ring-indigo-100" name={name} required={["productName", "brand", "seedKeyword"].includes(name)} defaultValue={name === "platform" ? "meesho" : ""} />
            )}
          </label>
        ))}
      </div>
      <button
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all disabled:opacity-60 cursor-pointer"
        disabled={busy}
      >
        <Sparkles className="h-4 w-4" />
        {busy ? "Generating..." : button}
      </button>
      {output && (
        <div className="mt-6">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-2">Final AI Output</p>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-zinc-850 bg-zinc-950/50 p-4 text-xs font-semibold leading-relaxed text-zinc-200">
            {output}
          </pre>
        </div>
      )}
    </form>
  );
}

function ImageForm({ onDone }: { onDone: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState("");
  const [filename, setFilename] = useState("");
  const [result, setResult] = useState<{ url?: string; publicId?: string } | null>(null);

  function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFilename(file.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!image) {
      onDone("Choose an image first.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, filename: filename || "product-image" }),
      });
      const data = await response.json().catch(() => ({}));
      setResult(data.image || null);
      onDone(response.ok ? "Image processed and saved." : data.error || "Image processing failed.");
    } catch {
      onDone("Image processing failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-zinc-100">
        <ImageIcon className="h-4.5 w-4.5 text-zinc-200" />
        Product image processing
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_0.7fr]">
        <label className="grid gap-1.5 text-xs font-bold text-zinc-300">
          <span>Image file</span>
          <input className="rounded-xl border border-zinc-800 px-4 py-3 text-xs font-semibold" type="file" accept="image/*" onChange={selectFile} required />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-zinc-300">
          <span>Output name</span>
          <input className="rounded-xl border border-zinc-800 px-4 py-3 text-xs font-semibold" value={filename} onChange={(event) => setFilename(event.target.value)} />
        </label>
      </div>
      {image ? (
        // Data URL preview for a local file selected before upload.
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="max-h-64 rounded-xl border border-zinc-850 object-contain" src={image} />
      ) : null}
      <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-xs font-bold text-white disabled:opacity-60" disabled={busy}>
        <Upload className="h-4 w-4" />
        {busy ? "Processing..." : "Upload and resize 1000x1000"}
      </button>
      {result?.url ? (
        <div className="grid gap-3 rounded-xl border border-zinc-850 bg-zinc-950/50 p-4 text-xs font-semibold text-zinc-300">
          <a className="font-bold text-indigo-400 underline" href={result.url} target="_blank" rel="noreferrer">Open processed image</a>
          <span className="font-mono text-[10px] text-zinc-400">{result.publicId}</span>
        </div>
      ) : null}
    </form>
  );
}

function LabelForm({ onDone }: { onDone: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(1);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      onDone("Choose a PDF label first.");
      return;
    }
    setBusy(true);
    setAnalysis(null);
    try {
      const response = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, size: file.size, pages }),
      });
      const data = await response.json().catch(() => ({}));
      setAnalysis(data.analysis || null);
      onDone(response.ok ? "Label analysed and saved." : data.error || "Label analysis failed.");
    } catch {
      onDone("Label analysis failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-zinc-100">
        <FileText className="h-4.5 w-4.5 text-zinc-200" />
        PDF label analyser
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_180px]">
        <label className="grid gap-1.5 text-xs font-bold text-zinc-300">
          <span>PDF label</span>
          <input className="rounded-xl border border-zinc-800 px-4 py-3 text-xs font-semibold" type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} required />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-zinc-300">
          <span>Pages</span>
          <input className="rounded-xl border border-zinc-800 px-4 py-3 text-xs font-semibold" type="number" min={1} value={pages} onChange={(event) => setPages(Number(event.target.value) || 1)} />
        </label>
      </div>
      <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-xs font-bold text-white disabled:opacity-60" disabled={busy}>
        <FileText className="h-4 w-4" />
        {busy ? "Analysing..." : "Analyse label"}
      </button>
      {analysis ? (
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-zinc-850 bg-zinc-950/50 p-4 text-xs font-semibold leading-relaxed text-zinc-200">
          {JSON.stringify(analysis, null, 2)}
        </pre>
      ) : null}
    </form>
  );
}

type CsvRow = Record<string, string>;

function parseCsv(input: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);
  const [headers = [], ...body] = rows;
  return body
    .map((cells) =>
      headers.reduce<CsvRow>((acc, header, index) => {
        const key = header.trim();
        if (key) acc[key] = cells[index] || "";
        return acc;
      }, {}),
    )
    .filter((item) => Object.values(item).some(Boolean));
}

function listFromCsv(value?: string) {
  return String(value || "")
    .split(/[|;]/)
    .flatMap((part) => part.split(","))
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeCsvListing(row: CsvRow, platform: string) {
  const get = (...keys: string[]) => {
    const found = keys.find((key) => row[key] || row[key.toLowerCase()] || row[key.toUpperCase()]);
    return found ? row[found] || row[found.toLowerCase()] || row[found.toUpperCase()] || "" : "";
  };

  return {
    platform: get("platform") || platform,
    source: "csv",
    status: "draft",
    title: get("title", "productName", "name"),
    description: get("description", "details"),
    sku: get("sku", "SKU"),
    brand: get("brand"),
    category: get("category"),
    price: get("price", "sellingPrice") || undefined,
    mrp: get("mrp", "MRP") || undefined,
    keywords: listFromCsv(get("keywords", "tags", "searchTerms")),
    bulletPoints: listFromCsv(get("bulletPoints", "features")),
    colors: listFromCsv(get("colors", "colour")),
    sizes: listFromCsv(get("sizes", "size")),
    payload: { csvRow: row },
    consumeUsage: false,
  };
}

function BulkCsvForm({ onDone }: { onDone: (message: string) => void }) {
  const [platform, setPlatform] = useState("meesho");
  const [csvText, setCsvText] = useState("title,sku,brand,category,price,mrp,keywords,description\n");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [busy, setBusy] = useState(false);

  function loadRows(text: string) {
    setCsvText(text);
    setRows(parseCsv(text));
  }

  async function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    loadRows(text);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedRows = rows.length ? rows : parseCsv(csvText);
    if (!parsedRows.length) {
      onDone("No CSV rows found.");
      return;
    }
    setBusy(true);
    let saved = 0;
    try {
      for (const row of parsedRows.slice(0, 250)) {
        const response = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizeCsvListing(row, platform)),
        });
        if (response.ok) saved += 1;
      }
      onDone(`Imported ${saved} of ${Math.min(parsedRows.length, 250)} CSV listings.`);
    } catch {
      onDone("CSV import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 shadow-sm space-y-5">
      <div className="grid gap-4 md:grid-cols-[1fr_180px]">
        <label className="grid gap-1.5 text-xs font-bold text-zinc-300">
          <span>CSV file</span>
          <input className="rounded-xl border border-zinc-800 px-4 py-3 text-xs font-semibold" type="file" accept=".csv,text/csv" onChange={selectFile} />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-zinc-300">
          <span>Platform</span>
          <select className="rounded-xl border border-zinc-800 px-4 py-3 text-xs font-semibold" value={platform} onChange={(event) => setPlatform(event.target.value)}>
            <option value="meesho">Meesho</option>
            <option value="flipkart">Flipkart</option>
            <option value="amazon">Amazon</option>
          </select>
        </label>
      </div>
      <label className="grid gap-1.5 text-xs font-bold text-zinc-300">
        <span>CSV rows</span>
        <textarea className="min-h-56 rounded-xl border border-zinc-800 px-4 py-3 font-mono text-xs outline-none focus:border-zinc-700 focus:ring-2 focus:ring-indigo-100" value={csvText} onChange={(event) => loadRows(event.target.value)} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-xs font-bold text-white disabled:opacity-60" disabled={busy}>
          <Upload className="h-4 w-4" />
          {busy ? "Importing..." : "Import CSV listings"}
        </button>
        <span className="text-xs font-bold text-zinc-400">{rows.length} rows ready</span>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-850">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/50 text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                {Object.keys(rows[0]).slice(0, 6).map((key) => <th className="px-4 py-3" key={key}>{key}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-semibold text-zinc-300">
              {rows.slice(0, 5).map((row, index) => (
                <tr key={index}>
                  {Object.keys(rows[0]).slice(0, 6).map((key) => <td className="px-4 py-3" key={key}>{row[key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </form>
  );
}

function SubscriptionForm({ onDone }: { onDone: (message: string) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const searchParams = useSearchParams();

  const loadRazorpay = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const upgrade = useCallback(async (plan: string, billingMode: "monthly" | "yearly") => {
    setBusy(plan);
    try {
      const response = await fetch("/api/subscription/checkout", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ plan, billing: billingMode }) 
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        onDone(data.error || "Checkout unavailable.");
        return;
      }
      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) {
        onDone("Could not load Razorpay checkout.");
        return;
      }
      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.order?.amount,
        currency: data.order?.currency || "INR",
        name: "A+ Studio",
        description: `${plan} ${billingMode} subscription`,
        order_id: data.order?.id,
        handler: async (payment: Record<string, string>) => {
          const verifyResponse = await fetch("/api/subscription/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payment),
          });
          const verifyData = await verifyResponse.json().catch(() => ({}));
          onDone(verifyResponse.ok ? "Subscription activated successfully." : verifyData.error || "Payment verification failed.");
        },
        theme: { color: "#4f46e5" },
      });
      checkout.open();
      onDone("Razorpay checkout opened.");
    } catch {
      onDone("Payment system connection error.");
    } finally {
      setBusy(null);
    }
  }, [loadRazorpay, onDone]);

  useEffect(() => {
    const plan = searchParams.get("plan");
    const billingMode = searchParams.get("billing") === "yearly" ? "yearly" : "monthly";
    if (!plan || plan === "free") return;
    const timer = window.setTimeout(() => {
      void upgrade(plan, billingMode);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams, upgrade]);

  return (
    <div className="space-y-6" aria-busy={busy ? "true" : "false"}>
      {/* Billing toggle switch */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${billing === "monthly" ? "text-zinc-100" : "text-zinc-500"}`}>
          Monthly
        </span>
        <button 
          type="button"
          onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
          style={{ backgroundColor: billing === "yearly" ? "#4f46e5" : "#d4d4d9" }}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              billing === "yearly" ? "translate-x-5" : "translate-x-0"
            }`} 
          />
        </button>
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${billing === "yearly" ? "text-zinc-100" : "text-zinc-500"}`}>
          Yearly
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-extrabold text-white lowercase">
            save up to 30%
          </span>
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {pricingPlans.map((plan) => (
          <PricingCard 
            key={plan.slug} 
            plan={plan} 
            dark={plan.slug === "pro"} 
            current={plan.slug === "free"}
            billing={billing}
            onSubscribe={upgrade}
          />
        ))}
      </div>
    </div>
  );
}

function Tutorial() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {["Install extension", "Login with A+ Studio", "Save Meesho template", "Autofill with preview", "Use AI content", "Optimize images"].map((step, idx) => (
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 shadow-sm hover:border-zinc-700 transition-all flex flex-col justify-between" key={step}>
          <div>
            <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Step 0{idx + 1}</span>
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-zinc-100 mt-2">
              <FileText className="h-4 w-4 text-zinc-400" />
              {step}
            </h2>
            <p className="mt-2.5 text-xs font-semibold leading-relaxed text-zinc-400">
              Follow this step in your seller workflow. Embedded tutorial video preview is Coming Soon.
            </p>
          </div>
          <div className="mt-6 border-t border-zinc-900 pt-4 flex items-center justify-between">
            <span className="w-8 h-[2px] bg-indigo-600 rounded-full" />
            <span className="text-[10px] font-bold text-zinc-500">Documentation</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function Records({ items, resource }: { items: Array<Record<string, unknown>>; resource: string }) {
  if (!items || items.length === 0) {
    return (
      <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-zinc-100">
          <Bell className="h-4 w-4 text-zinc-200" />
          Recent {resource || "records"}
        </h2>
        <div className="mt-6 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50/50 p-8 text-center text-xs font-semibold text-zinc-500">
          No records found in this workspace yet.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md overflow-hidden shadow-sm">
      <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-zinc-100">
          <Bell className="h-4 w-4 text-zinc-200" />
          Workspace {resource || "records"} ({items.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-850 bg-zinc-950/50/50 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
              {resource === "products" && (
                <>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Brand</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Price / MRP</th>
                </>
              )}
              {resource === "templates" && (
                <>
                  <th className="px-6 py-3">Template Name</th>
                  <th className="px-6 py-3">Platform</th>
                  <th className="px-6 py-3">Selectors</th>
                </>
              )}
              {resource === "listings" && (
                <>
                  <th className="px-6 py-3">Listing Title</th>
                  <th className="px-6 py-3">Platform</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Status</th>
                </>
              )}
              {resource !== "products" && resource !== "templates" && resource !== "listings" && (
                <>
                  <th className="px-6 py-3">Record ID</th>
                  <th className="px-6 py-3">Data</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 font-semibold text-zinc-300">
            {items.slice(0, 10).map((item, index) => (
              <tr key={String(item._id || index)} className="hover:bg-zinc-950/50/50 transition-colors">
                {resource === "products" && (
                  <>
                    <td className="px-6 py-4 font-bold text-zinc-100">{String(item.title || "—")}</td>
                    <td className="px-6 py-4">{String(item.brand || "—")}</td>
                    <td className="px-6 py-4">{String(item.category || "—")}</td>
                    <td className="px-6 py-4 text-zinc-100 font-mono">
                      Rs {String(item.sellingPrice || "0")} <span className="ml-1 text-[10px] text-zinc-500 line-through">Rs {String(item.mrp || "0")}</span>
                    </td>
                  </>
                )}
                {resource === "templates" && (
                  <>
                    <td className="px-6 py-4 font-bold text-zinc-100">{String(item.name || "—")}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-extrabold uppercase bg-indigo-600 text-white">
                        {String(item.platform || "meesho")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-zinc-400">
                      {item.selectors ? Object.keys(item.selectors).join(", ") : "None"}
                    </td>
                  </>
                )}
                {resource === "listings" && (
                  <>
                    <td className="px-6 py-4 font-bold text-zinc-100">{String(item.title || "—")}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-extrabold uppercase bg-zinc-900 border border-zinc-800 text-zinc-200">
                        {String(item.platform || "meesho")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-400">{String(item.sku || "—")}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase ${
                        item.status === "generated" ? "bg-indigo-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-300"
                      }`}>
                        {String(item.status || "draft")}
                      </span>
                    </td>
                  </>
                )}
                {resource !== "products" && resource !== "templates" && resource !== "listings" && (
                  <>
                    <td className="px-6 py-4 font-mono text-[10px] text-zinc-400">{String(item._id || index).slice(-8)}</td>
                    <td className="px-6 py-4">
                      <pre className="max-w-xs md:max-w-md overflow-x-auto text-[10px] text-zinc-400 font-mono bg-zinc-950/50 p-2 rounded border border-zinc-900">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function label(input: string) {
  return input.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}
