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
  "label-analyser": "Label Analyser",
  "keyword-research": "Keyword Research",
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
    if (module === "ai-content-studio") return <AIForm onDone={setStatus} />;
    if (module === "image-maker") return <ImageForm onDone={setStatus} />;
    if (module === "label-analyser") return <LabelForm onDone={setStatus} />;
    if (module === "subscription") return <SubscriptionForm onDone={setStatus} />;
    if (module === "team") return <TeamForm onDone={setStatus} />;
    if (module === "notifications") return <NotificationForm onDone={setStatus} />;
    if (module === "support") return <SupportForm onDone={setStatus} />;
    if (module === "tutorial") return <Tutorial />;
    if (module === "bulk-csv-upload") return <ComingSoon text="CSV parsing and bulk listing creation is wired into smart listing APIs next." />;
    if (module === "settings") return <SettingsForm onDone={setStatus} />;
    if (module === "smart-listings") return <SmartListingForm onDone={setStatus} />;
    return null;
  }, [module]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end mb-8">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Seller Workspace</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-neutral-900">{title}</h1>
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-neutral-900" />
          Meesho live | Flipkart/Amazon beta
        </span>
      </div>
      
      {status ? (
        <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-bold text-neutral-850 shadow-sm transition-all">
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
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm flex items-center justify-between hover:border-neutral-300 transition-all group" key={label}>
            <div className="min-w-0 pr-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">{label}</p>
              <p className={`mt-2 break-words font-extrabold tracking-tight text-neutral-900 ${String(label).includes("quota") ? "text-sm leading-5" : "text-3xl font-mono"}`}>{value}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-150 bg-neutral-50 text-neutral-800 group-hover:bg-neutral-900 group-hover:text-white transition-all">
              <Icon className="h-5 w-5" />
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-neutral-900 mb-5">Quick Actions</h2>
          <div className="grid gap-3">
            {[
              ["Create product", Package, "/dashboard/products"],
              ["Save template", Layers3, "/dashboard/templates"],
              ["Generate listing", Sparkles, "/dashboard/listings/new"],
              ["Research keywords", Search, "/dashboard/keyword-research"],
            ].map(([item, Icon, href]) => (
              <a 
                className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-all group" 
                href={String(href)} 
                key={String(item)}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-neutral-500 group-hover:text-neutral-950 transition-colors" />
                  {String(item)}
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-950 group-hover:translate-x-1 transition-all" />
              </a>
            ))}
          </div>
        </article>

        {/* Onboarding Checklist */}
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-neutral-900 mb-5">Workspace Checklist</h2>
          <div className="space-y-4">
            {[
              { title: "Add product data", desc: "Save product name, brand, category, price and features." },
              { title: "Generate AI listing", desc: "Create final title, descriptions, keywords, SKU and score." },
              { title: "Run keyword research", desc: "Save product-specific keyword reports before publishing." },
              { title: "Connect Chrome extension", desc: "Use saved templates and autofill after checking quota." },
            ].map((step, idx) => (
              <div className="flex gap-4 items-start" key={idx}>
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-950 text-white font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  0{idx + 1}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-2">
                    {step.title}
                    <Check className="h-3.5 w-3.5 text-neutral-400" />
                  </h4>
                  <p className="text-[10px] text-neutral-500 leading-normal mt-0.5">{step.desc}</p>
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
      <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-900">Support promise</h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Share the issue, marketplace page, screenshot link and what you expected. Admin can track status, reply, and keep your full ticket history here.
        </p>
        <a className="mt-5 inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-xs font-medium text-white" href="https://wa.me/916394423902">
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
    <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:grid-cols-2">
      {fields.map((field) => (
        <label className="grid gap-1.5 text-xs font-bold text-neutral-700" key={field}>
          <span>{label(field)}</span>
          <input 
            className="rounded-xl border border-neutral-250 px-4 py-3 outline-none text-neutral-900 font-semibold focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100 transition-colors bg-white placeholder:text-neutral-450" 
            name={field} 
            required={field === "title" || field === "name" || field === "email"} 
          />
        </label>
      ))}
      <button 
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3.5 text-xs font-bold text-white hover:bg-neutral-850 disabled:opacity-60 transition-all cursor-pointer md:col-span-2 shadow-sm"
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
    <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([name, fieldLabel]) => (
          <label className={name === "inputFeatures" || name === "competitorTitle" ? "grid gap-1.5 text-xs font-bold text-neutral-700 md:col-span-2" : "grid gap-1.5 text-xs font-bold text-neutral-700"} key={name}>
            <span>{fieldLabel}</span>
            {name === "inputFeatures" || name === "competitorTitle" ? (
              <textarea className="min-h-24 rounded-xl border border-neutral-250 px-4 py-3 text-xs font-semibold outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100" name={name} required={["inputFeatures"].includes(name)} />
            ) : (
              <input className="rounded-xl border border-neutral-250 px-4 py-3 text-xs font-semibold outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100" name={name} required={["productName", "brand", "seedKeyword"].includes(name)} defaultValue={name === "platform" ? "meesho" : ""} />
            )}
          </label>
        ))}
      </div>
      <button
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-3.5 text-xs font-bold text-white hover:bg-neutral-850 transition-all disabled:opacity-60 cursor-pointer"
        disabled={busy}
      >
        <Sparkles className="h-4 w-4" />
        {busy ? "Generating..." : button}
      </button>
      {output && (
        <div className="mt-6">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-2">Final AI Output</p>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-neutral-150 bg-neutral-50 p-4 text-xs font-semibold leading-relaxed text-neutral-850">
            {output}
          </pre>
        </div>
      )}
    </form>
  );
}

function ImageForm({ onDone }: { onDone: (message: string) => void }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-neutral-900">
        <ImageIcon className="h-4.5 w-4.5 text-neutral-850" />
        Product image processing
      </div>
      <JsonForm endpoint="/api/images" fields={["image", "filename"]} button="Upload and resize 1000x1000" onDone={onDone} />
      <ComingSoon text="Background removal API is Coming Soon." />
    </div>
  );
}

function LabelForm({ onDone }: { onDone: (message: string) => void }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-neutral-900">
        <FileText className="h-4.5 w-4.5 text-neutral-850" />
        PDF label analyser
      </div>
      <JsonForm endpoint="/api/labels" fields={["filename", "size", "pages"]} button="Save PDF metadata" onDone={onDone} />
      <ComingSoon text="Advanced carrier detection and PDF page splitting are Coming Soon." />
    </div>
  );
}

function SubscriptionForm({ onDone }: { onDone: (message: string) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const upgrade = useCallback(async (plan: string, billing: "monthly" | "yearly") => {
    setBusy(plan);
    try {
      const response = await fetch("/api/subscription/checkout", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ plan, billing }) 
      });
      const data = await response.json().catch(() => ({}));
      onDone(response.ok ? "Checkout order created. Continue in Razorpay when production billing is enabled." : data.error || "Checkout unavailable.");
    } catch {
      onDone("Payment system connection error.");
    } finally {
      setBusy(null);
    }
  }, [onDone]);

  useEffect(() => {
    const plan = searchParams.get("plan");
    const billing = searchParams.get("billing") === "yearly" ? "yearly" : "monthly";
    if (!plan || plan === "free") return;
    const timer = window.setTimeout(() => {
      void upgrade(plan, billing);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams, upgrade]);

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" aria-busy={busy ? "true" : "false"}>
      {pricingPlans.map((plan) => (
        <PricingCard 
          key={plan.slug} 
          plan={plan} 
          dark={plan.slug === "pro"} 
          current={plan.slug === "free"}
          onSubscribe={upgrade}
        />
      ))}
    </div>
  );
}

function Tutorial() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {["Install extension", "Login with A+ Studio", "Save Meesho template", "Autofill with preview", "Use AI content", "Optimize images"].map((step, idx) => (
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-neutral-300 transition-all flex flex-col justify-between" key={step}>
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest">Step 0{idx + 1}</span>
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-neutral-900 mt-2">
              <FileText className="h-4 w-4 text-neutral-600" />
              {step}
            </h2>
            <p className="mt-2.5 text-xs font-semibold leading-relaxed text-neutral-500">
              Follow this step in your seller workflow. Embedded tutorial video preview is Coming Soon.
            </p>
          </div>
          <div className="mt-6 border-t border-neutral-100 pt-4 flex items-center justify-between">
            <span className="w-8 h-[2px] bg-neutral-950 rounded-full" />
            <span className="text-[10px] font-bold text-neutral-400">Documentation</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function ComingSoon({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-xs font-bold text-neutral-600">
      {text}
    </div>
  );
}

function Records({ items, resource }: { items: Array<Record<string, unknown>>; resource: string }) {
  if (!items || items.length === 0) {
    return (
      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-neutral-900">
          <Bell className="h-4 w-4 text-neutral-800" />
          Recent {resource || "records"}
        </h2>
        <div className="mt-6 rounded-xl border border-dashed border-neutral-250 bg-neutral-50/50 p-8 text-center text-xs font-semibold text-neutral-400">
          No records found in this workspace yet.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
      <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-neutral-900">
          <Bell className="h-4 w-4 text-neutral-850" />
          Workspace {resource || "records"} ({items.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-150 bg-neutral-50/50 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
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
          <tbody className="divide-y divide-neutral-100 font-semibold text-neutral-700">
            {items.slice(0, 10).map((item, index) => (
              <tr key={String(item._id || index)} className="hover:bg-neutral-50/50 transition-colors">
                {resource === "products" && (
                  <>
                    <td className="px-6 py-4 font-bold text-neutral-900">{String(item.title || "—")}</td>
                    <td className="px-6 py-4">{String(item.brand || "—")}</td>
                    <td className="px-6 py-4">{String(item.category || "—")}</td>
                    <td className="px-6 py-4 text-neutral-900 font-mono">
                      Rs {String(item.sellingPrice || "0")} <span className="ml-1 text-[10px] text-neutral-400 line-through">Rs {String(item.mrp || "0")}</span>
                    </td>
                  </>
                )}
                {resource === "templates" && (
                  <>
                    <td className="px-6 py-4 font-bold text-neutral-900">{String(item.name || "—")}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-extrabold uppercase bg-neutral-950 text-white">
                        {String(item.platform || "meesho")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-neutral-500">
                      {item.selectors ? Object.keys(item.selectors).join(", ") : "None"}
                    </td>
                  </>
                )}
                {resource === "listings" && (
                  <>
                    <td className="px-6 py-4 font-bold text-neutral-900">{String(item.title || "—")}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-extrabold uppercase bg-neutral-100 border border-neutral-200 text-neutral-800">
                        {String(item.platform || "meesho")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-neutral-600">{String(item.sku || "—")}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase ${
                        item.status === "generated" ? "bg-neutral-950 text-white" : "bg-neutral-100 border border-neutral-200 text-neutral-700"
                      }`}>
                        {String(item.status || "draft")}
                      </span>
                    </td>
                  </>
                )}
                {resource !== "products" && resource !== "templates" && resource !== "listings" && (
                  <>
                    <td className="px-6 py-4 font-mono text-[10px] text-neutral-500">{String(item._id || index).slice(-8)}</td>
                    <td className="px-6 py-4">
                      <pre className="max-w-xs md:max-w-md overflow-x-auto text-[10px] text-neutral-500 font-mono bg-neutral-50 p-2 rounded border border-neutral-100">
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
