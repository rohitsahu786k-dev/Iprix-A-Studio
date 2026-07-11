"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  FileText,
  Layers3,
  Package,
  Search,
  Sparkles,
  TrendingUp,
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
import { ImageStudio } from "@/components/image-studio";
import { documentationGuides } from "@/lib/docs";

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
    if (module === "image-maker") return <ImageStudio onDone={setStatus} />;
    if (module === "low-shipping-images") return <LowShippingStudio />;
    if (module === "label-analyser") return <LabelForm onDone={setStatus} />;
    if (module === "subscription") return <SubscriptionForm onDone={setStatus} />;
    if (module === "team") return <TeamForm onDone={setStatus} />;
    if (module === "notifications") return <NotificationCenter onDone={setStatus} />;
    if (module === "support") return <SupportForm onDone={setStatus} />;
    if (module === "tutorial") return <Tutorial />;
    if (module === "bulk-csv-upload") return <BulkCsvForm onDone={setStatus} />;
    if (module === "settings") return <SettingsForm onDone={setStatus} />;
    if (module === "smart-listings") return <SmartListingForm onDone={setStatus} />;
    return null;
  }, [module]);

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600">Seller workspace</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">{title}</h1>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-extrabold text-slate-600 shadow-sm sm:text-xs">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          Meesho live | Flipkart/Amazon beta
        </span>
      </div>
      
      {status ? (
        <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-xs font-bold text-indigo-800 shadow-sm transition-all">
          {status}
        </div>
      ) : null}

      {form ? <section className="mt-6">{form}</section> : <Overview />}
      {resource ? <Records items={items} resource={resource} /> : null}
    </div>
  );
}

type DashboardSummary = {
  user?: { plan?: string };
  counts?: { templates?: number; products?: number; listings?: number; keywordReports?: number; extensionLogs?: number };
  usage?: {
    listings?: { label?: string; used?: number; limit?: number; remaining?: number };
    keywords?: { label?: string; used?: number; limit?: number; remaining?: number };
  };
  analytics?: {
    listingTrend?: Array<{ label: string; value: number }>;
    workspaceMix?: Array<{ label: string; value: number }>;
    statusBreakdown?: Record<string, number>;
    platformBreakdown?: Record<string, number>;
    averageListingScore?: number;
  };
};

function Overview() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/dashboard/summary")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Dashboard data is temporarily unavailable.");
        return data;
      })
      .then((data) => {
        if (!mounted) return;
        if (!data.ok) throw new Error(data.error || "Dashboard data could not be loaded.");
        setSummary(data);
      })
      .catch((error) => {
        if (mounted) setLoadError(error instanceof Error ? error.message : "Dashboard data could not be loaded.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const counts = summary?.counts || {};
  const stats = [
    { label: "Listings created", value: counts.listings ?? 0, Icon: Sparkles, accent: "bg-indigo-50 text-indigo-700", helper: "AI and manual listings" },
    { label: "Saved products", value: counts.products ?? 0, Icon: Package, accent: "bg-violet-50 text-violet-700", helper: "Reusable product records" },
    { label: "Templates", value: counts.templates ?? 0, Icon: Layers3, accent: "bg-amber-50 text-amber-700", helper: "Ready for autofill" },
    { label: "Extension actions", value: counts.extensionLogs ?? 0, Icon: Zap, accent: "bg-emerald-50 text-emerald-700", helper: "Successful synced actions" },
  ] as const;
  const listingUsed = summary?.usage?.listings?.used ?? 0;
  const listingLimit = summary?.usage?.listings?.limit ?? 0;
  const keywordUsed = summary?.usage?.keywords?.used ?? 0;
  const keywordLimit = summary?.usage?.keywords?.limit ?? 0;
  const listingProgress = quotaProgress(listingUsed, listingLimit);
  const keywordProgress = quotaProgress(keywordUsed, keywordLimit);
  const trend = summary?.analytics?.listingTrend || [];
  const mix = summary?.analytics?.workspaceMix || [];

  return (
    <div className="mt-7 space-y-6">
      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-xs font-bold text-rose-700">{loadError}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, Icon, accent, helper }) => (
          <article className="group rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]" key={label}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
                <p className="mt-3 font-mono text-3xl font-black tracking-tight text-slate-950">{summary ? value : "—"}</p>
              </div>
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${accent}`}><Icon className="h-5 w-5" /></span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              {helper}
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <article className="min-w-0 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-indigo-600">Performance</p>
              <h2 className="mt-1.5 text-lg font-extrabold text-slate-950">Listing activity</h2>
              <p className="mt-1 text-[10px] font-semibold text-slate-500">Listings created during the last six months</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-extrabold text-slate-600">
              <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
              {trend.reduce((total, item) => total + item.value, 0)} total
            </span>
          </div>
          <ListingTrendChart data={trend} />
        </article>

        <article className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-600">Distribution</p>
          <h2 className="mt-1.5 text-lg font-extrabold text-slate-950">Workspace mix</h2>
          <WorkspaceDonut data={mix} />
        </article>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <article className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Plan usage</p>
              <h2 className="mt-1.5 text-lg font-extrabold text-slate-950">Monthly capacity</h2>
            </div>
            <Link href="/dashboard/subscription" className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800">
              Manage plan <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-6 space-y-5">
            <QuotaRow label="AI listings" used={listingUsed} limit={listingLimit} progress={listingProgress} color="bg-indigo-600" />
            <QuotaRow label="Keyword reports" used={keywordUsed} limit={keywordLimit} progress={keywordProgress} color="bg-violet-600" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Current plan</p>
              <p className="mt-2 text-sm font-extrabold capitalize text-slate-900">{summary?.user?.plan || "Loading"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Avg. AI score</p>
              <p className="mt-2 text-sm font-extrabold text-slate-900">{summary?.analytics?.averageListingScore || 0}/100</p>
            </div>
          </div>
        </article>

        <article className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Shortcuts</p>
          <h2 className="mt-1.5 text-lg font-extrabold text-slate-950">Quick actions</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {[
              ["Generate AI listing", Sparkles, "/dashboard/listings/new", "bg-indigo-50 text-indigo-700"],
              ["Add product", Package, "/dashboard/products", "bg-violet-50 text-violet-700"],
              ["Save template", Layers3, "/dashboard/templates", "bg-amber-50 text-amber-700"],
              ["Research keywords", Search, "/dashboard/keyword-research", "bg-emerald-50 text-emerald-700"],
            ].map(([item, Icon, href, accent]) => (
              <Link className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50" href={String(href)} key={String(item)}>
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${accent}`}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1 text-[11px] font-extrabold text-slate-700">{String(item)}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
              </Link>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Onboarding</p>
            <h2 className="mt-1.5 text-lg font-extrabold text-slate-950">Workspace checklist</h2>
          </div>
          <Link href="/docs" className="text-[10px] font-extrabold text-indigo-600">Open documentation →</Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Add product data", desc: "Save product details once.", done: (counts.products || 0) > 0, href: "/dashboard/products" },
            { title: "Generate AI listing", desc: "Create optimized listing copy.", done: (counts.listings || 0) > 0, href: "/dashboard/listings/new" },
            { title: "Run keyword research", desc: "Find buyer-intent terms.", done: (counts.keywordReports || 0) > 0, href: "/dashboard/keyword-research" },
            { title: "Use the extension", desc: "Autofill marketplace forms.", done: (counts.extensionLogs || 0) > 0, href: "/docs/install-extension" },
          ].map((step, idx) => (
            <Link className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-indigo-100 hover:bg-indigo-50/40" href={step.href} key={step.title}>
              <div className="flex items-center justify-between">
                <span className={`grid h-8 w-8 place-items-center rounded-xl text-[10px] font-black ${step.done ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-500 shadow-sm"}`}>
                  {step.done ? <Check className="h-4 w-4" /> : `0${idx + 1}`}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-indigo-600" />
              </div>
              <h3 className="mt-4 text-xs font-extrabold text-slate-900">{step.title}</h3>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{step.desc}</p>
            </Link>
          ))}
        </div>
      </article>
    </div>
  );
}

function quotaProgress(used: number, limit: number) {
  if (limit < 0) return 22;
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function QuotaRow({ label, used, limit, progress, color }: { label: string; used: number; limit: number; progress: number; color: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-extrabold">
        <span className="text-slate-600">{label}</span>
        <span className="font-mono text-slate-900">{limit < 0 ? `${used} / Unlimited` : `${used} / ${limit}`}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function ListingTrendChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const fallback = Array.from({ length: 6 }, (_, index) => ({ label: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index], value: 0 }));
  const pointsData = data.length ? data : fallback;
  const maxValue = Math.max(1, ...pointsData.map((item) => item.value));
  const width = 620;
  const height = 220;
  const padX = 24;
  const padY = 28;
  const chartWidth = width - padX * 2;
  const chartHeight = height - padY * 2;
  const points = pointsData.map((item, index) => ({
    ...item,
    x: padX + (index * chartWidth) / Math.max(1, pointsData.length - 1),
    y: padY + chartHeight - (item.value / maxValue) * chartHeight,
  }));
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padX},${height - padY} ${polyline} ${width - padX},${height - padY}`;

  return (
    <div className="mt-5 overflow-hidden" aria-label="Six month listing activity line graph" role="img">
      <svg className="h-auto w-full" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="listing-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padY + (line * chartHeight) / 3;
          return <line key={line} x1={padX} x2={width - padX} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 6" />;
        })}
        <polygon points={area} fill="url(#listing-area)" />
        <polyline points={polyline} fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={`${point.label}-${point.x}`}>
            <circle cx={point.x} cy={point.y} r="6" fill="#fff" stroke="#4f46e5" strokeWidth="4" />
            <text x={point.x} y={height - 5} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="700">{point.label}</text>
            <text x={point.x} y={Math.max(14, point.y - 13)} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="800">{point.value}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function WorkspaceDonut({ data }: { data: Array<{ label: string; value: number }> }) {
  const colors = ["#4f46e5", "#8b5cf6", "#f59e0b", "#10b981"];
  const safeData = data.length ? data : [
    { label: "Listings", value: 0 },
    { label: "Products", value: 0 },
    { label: "Templates", value: 0 },
    { label: "Keywords", value: 0 },
  ];
  const total = safeData.reduce((sum, item) => sum + item.value, 0);
  const stops = safeData.map((item, index) => {
    const valuesBefore = safeData.slice(0, index).reduce((sum, entry) => sum + entry.value, 0);
    const valuesThrough = valuesBefore + item.value;
    const start = total ? (valuesBefore / total) * 100 : index * 25;
    const end = total ? (valuesThrough / total) * 100 : (index + 1) * 25;
    return `${colors[index % colors.length]} ${start}% ${end}%`;
  });

  return (
    <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
      <div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: `conic-gradient(${stops.join(", ")})` }}>
        <div className="absolute inset-4 grid place-items-center rounded-full bg-white shadow-inner">
          <div className="text-center">
            <Activity className="mx-auto h-4 w-4 text-indigo-600" />
            <p className="mt-1 font-mono text-2xl font-black text-slate-950">{total}</p>
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">records</p>
          </div>
        </div>
      </div>
      <div className="w-full space-y-2.5">
        {safeData.map((item, index) => (
          <div className="flex items-center gap-2.5" key={item.label}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="flex-1 text-[10px] font-bold text-slate-500">{item.label}</span>
            <span className="font-mono text-[11px] font-black text-slate-900">{item.value}</span>
          </div>
        ))}
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

function NotificationCenter({ onDone }: { onDone: (message: string) => void }) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Notifications could not be loaded.");
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      onDone(error instanceof Error ? error.message : "Notifications could not be loaded.");
    } finally {
      setBusy(false);
    }
  }, [onDone]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function markRead(id: string) {
    const response = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    if (response.ok) setItems((current) => current.map((item) => String(item._id) === id ? { ...item, read: true } : item));
    else onDone("Notification could not be updated.");
  }

  async function remove(id: string) {
    const response = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) {
      setItems((current) => current.filter((item) => String(item._id) !== id));
      onDone("Notification removed.");
    } else onDone("Notification could not be removed.");
  }

  async function markAllRead() {
    const unread = items.filter((item) => !item.read);
    if (!unread.length) {
      onDone("All notifications are already read.");
      return;
    }
    setBusy(true);
    const results = await Promise.all(unread.map((item) => fetch(`/api/notifications?id=${encodeURIComponent(String(item._id))}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    })));
    setBusy(false);
    if (results.every((response) => response.ok)) {
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      onDone("All notifications marked as read.");
    } else onDone("Some notifications could not be updated.");
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><h2 className="text-sm font-extrabold text-slate-950">Notification centre</h2><p className="mt-1 text-[10px] font-semibold text-slate-500">Account, extension, billing and support updates</p></div>
        <button type="button" onClick={() => void markAllRead()} disabled={busy} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"><Check className="h-3.5 w-3.5" /> Mark all read</button>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const id = String(item._id);
          return (
            <div className={`flex gap-3 p-5 sm:items-center sm:gap-4 sm:px-6 ${item.read ? "bg-white" : "bg-indigo-50/35"}`} key={id}>
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full sm:mt-0 ${item.read ? "bg-slate-300" : "bg-indigo-600"}`} />
              <div className="min-w-0 flex-1"><h3 className="text-xs font-extrabold text-slate-900">{String(item.title || "A+ Studio update")}</h3><p className="mt-1 text-[10px] font-semibold leading-5 text-slate-500">{String(item.message || "Open the dashboard for more information.")}</p></div>
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                {!item.read ? <button type="button" onClick={() => void markRead(id)} className="rounded-lg px-2.5 py-2 text-[9px] font-extrabold text-indigo-600 hover:bg-indigo-50">Mark read</button> : null}
                <button type="button" onClick={() => void remove(id)} className="rounded-lg px-2.5 py-2 text-[9px] font-extrabold text-slate-400 hover:bg-rose-50 hover:text-rose-700">Remove</button>
              </div>
            </div>
          );
        })}
        {!busy && !items.length ? <div className="p-12 text-center"><Bell className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-xs font-bold text-slate-500">No notifications yet.</p></div> : null}
        {busy && !items.length ? <div className="p-12 text-center text-xs font-bold text-slate-500">Loading notifications...</div> : null}
      </div>
    </div>
  );
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
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      onDone(response.ok ? "Profile settings saved. Refreshing your workspace..." : data.error || "Settings could not be saved.");
      if (response.ok) window.setTimeout(() => window.location.reload(), 500);
    } catch {
      onDone("Settings could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:grid-cols-2">
      <label className="grid gap-2 text-xs font-extrabold text-slate-700"><span>Display name</span><input className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold" name="name" minLength={2} required /></label>
      <label className="grid gap-2 text-xs font-extrabold text-slate-700"><span>GSTIN (optional)</span><input className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase" name="gstin" maxLength={15} /></label>
      <div className="rounded-2xl bg-slate-50 p-4 text-[11px] font-semibold leading-5 text-slate-500 md:col-span-2">Your account email and plan are managed securely and cannot be changed from this profile form. Contact support for billing identity changes.</div>
      <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-xs font-extrabold text-white disabled:opacity-60 md:col-span-2" disabled={busy}><Check className="h-4 w-4" />{busy ? "Saving settings..." : "Save profile settings"}</button>
    </form>
  );
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
    const listFields = new Set(["keywords", "colors", "sizes", "features", "bulletPoints"]);
    for (const [key, value] of Object.entries(raw)) {
      payload[key] = listFields.has(key)
        ? String(value).split(",").map((part) => part.trim()).filter(Boolean)
        : value;
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
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {documentationGuides.map((guide) => (
        <Link className="group flex min-h-64 flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_18px_45px_rgba(79,70,229,0.10)]" href={`/docs/${guide.slug}`} key={guide.slug}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-600">Step {guide.step}</span>
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-extrabold text-slate-500">{guide.duration}</span>
            </div>
            <span className="mt-6 grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-200"><FileText className="h-4.5 w-4.5" /></span>
            <h2 className="mt-5 text-base font-extrabold tracking-tight text-slate-950">{guide.title}</h2>
            <p className="mt-2.5 text-xs font-semibold leading-6 text-slate-500">{guide.summary}</p>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-[10px] font-extrabold text-indigo-600">Read documentation</span>
            <ArrowRight className="h-4 w-4 text-indigo-600 transition group-hover:translate-x-1" />
          </div>
        </Link>
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
        <div className="mt-6 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 p-8 text-center text-xs font-semibold text-zinc-500">
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
            <tr className="border-b border-zinc-850 bg-zinc-950/50 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
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
              <tr key={String(item._id || index)} className="transition-colors hover:bg-zinc-950/50">
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
