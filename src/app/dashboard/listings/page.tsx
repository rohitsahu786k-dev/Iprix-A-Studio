"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Download,
  Edit3,
  ExternalLink,
  FilePlus2,
  Layers3,
  Lock,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";

type Usage = {
  plan: string;
  used: number;
  limit: number;
  remaining: number;
  canCreateListing: boolean;
  upgradeRequired: boolean;
  label: string;
};

type Listing = {
  _id: string;
  title?: string;
  platform?: string;
  source?: string;
  status?: string;
  aiScore?: { total?: number };
  createdAt?: string;
};

export default function ListingsPage() {
  const router = useRouter();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [items, setItems] = useState<Listing[]>([]);
  const [status, setStatus] = useState("");

  async function fetchListingsState() {
    const [usageResponse, listingsResponse] = await Promise.all([fetch("/api/listing-usage"), fetch("/api/listings")]);
    const usageData = await usageResponse.json();
    const listingsData = await listingsResponse.json();
    return { usageData, listingsData };
  }

  async function load() {
    setStatus("");
    const { usageData, listingsData } = await fetchListingsState();
    setUsage(usageData);
    setItems(listingsData.items || []);
  }

  async function listingAction(action: string, item: Listing) {
    if (action === "view" || action === "edit") {
      router.push(`/dashboard/listings/${item._id}${action === "view" ? "?mode=view" : ""}`);
      return;
    }
    if (action === "delete") {
      if (!window.confirm(`Delete "${item.title || "this listing"}"? This cannot be undone.`)) return;
      const response = await fetch(`/api/listings/${item._id}`, { method: "DELETE" });
      setStatus(response.ok ? "Listing deleted." : "Could not delete listing.");
      await load();
      return;
    }
    if (action === "duplicate") {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, title: `${item.title || "Listing"} copy`, status: "draft", consumeUsage: false }),
      });
      setStatus(response.ok ? "Listing duplicated as a draft." : "Could not duplicate listing.");
      await load();
      return;
    }
    if (action === "extension") {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${item.title || "Listing"} template`,
          platform: item.platform || "meesho",
          source: "ai_generated",
          fields: [
            { key: "title", label: "Product title", value: item.title || "", selector: "", inputType: "text" },
            { key: "status", label: "Listing status", value: item.status || "draft", selector: "", inputType: "text" },
          ],
        }),
      });
      setStatus(response.ok ? "Template saved. Open the Chrome extension and choose Autofill from Template." : "Could not create extension template.");
      return;
    }
    if (action === "export") {
      if (usage?.plan === "free") {
        setStatus("CSV export is paid-only. Upgrade to continue.");
        return;
      }
      const csv = `title,platform,source,status,aiScore,createdAt\n"${item.title || ""}","${item.platform || ""}","${item.source || ""}","${item.status || ""}","${item.aiScore?.total || ""}","${item.createdAt || ""}"`;
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "a-plus-studio-listing.csv";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("CSV exported.");
    }
  }

  useEffect(() => {
    let mounted = true;
    async function loadInitial() {
      try {
        const { usageData, listingsData } = await fetchListingsState();
        if (!mounted) return;
        setUsage(usageData);
        setItems(listingsData.items || []);
      } catch {
        if (mounted) setStatus("Could not load listings.");
      }
    }
    loadInitial();
    return () => {
      mounted = false;
    };
  }, []);

  const progress = useMemo(() => {
    if (!usage || usage.limit === -1) return 0;
    return Math.min(100, Math.round((usage.used / usage.limit) * 100));
  }, [usage]);

  const softUpgrade = usage?.plan === "free" && usage.used >= 3 && !usage.upgradeRequired;

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">AI Listing Studio</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-neutral-900">Listings</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-xs font-bold text-white" href="/dashboard/listings/new">
            <Plus className="h-4 w-4" />
            Create AI Listing
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-800" href="/dashboard/tutorial">
            <Layers3 className="h-4 w-4" />
            Fill & Save Template
          </Link>
        </div>
      </div>

      {status ? <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-700">{status}</div> : null}

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Listing usage</p>
              <h2 className="mt-2 text-2xl font-extrabold text-neutral-900">
                {usage ? usage.label : "Loading usage..."}
              </h2>
              <p className="mt-2 text-xs font-semibold leading-6 text-neutral-500">
                Your free AI listings help you test A+ Studio. Upgrade when you are ready to create more listings every month.
              </p>
            </div>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[10px] font-extrabold uppercase text-neutral-800">
              {usage?.plan || "free"} plan
            </span>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-neutral-100">
            <div className={`h-full rounded-full ${usage?.upgradeRequired ? "bg-red-600" : "bg-neutral-950"}`} style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-xs font-bold text-white" href="/dashboard/subscription">
              Upgrade Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-800" onClick={() => load()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Conversion prompt</p>
          {usage?.upgradeRequired ? (
            <UpgradeNotice strong />
          ) : softUpgrade ? (
            <UpgradeNotice />
          ) : (
            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <h3 className="text-sm font-extrabold text-neutral-900">5 free AI listings included</h3>
              <p className="mt-2 text-xs font-semibold leading-6 text-neutral-500">
                Try real AI-powered listing generation and Chrome autofill before choosing a paid plan.
              </p>
            </div>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-neutral-900">Listing history</h2>
          <span className="text-[10px] font-bold text-neutral-400">{items.length} records</span>
        </div>
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-5 py-3">Product title</th>
                  <th className="px-5 py-3">Platform</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">AI score</th>
                  <th className="px-5 py-3">Created date</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-semibold text-neutral-700">
                {items.map((item) => (
                  <tr key={item._id} className="transition hover:bg-neutral-50/70">
                    <td className="max-w-xs px-5 py-4 font-bold text-neutral-900">{item.title || "Untitled listing"}</td>
                    <td className="px-5 py-4 capitalize">{item.platform || "meesho"}</td>
                    <td className="px-5 py-4">{sourceLabel(item.source)}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-[9px] font-extrabold uppercase">
                        {item.status || "draft"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono">{item.aiScore?.total ?? "-"}</td>
                    <td className="px-5 py-4">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        <IconButton label="View" icon={ExternalLink} onClick={() => listingAction("view", item)} />
                        <IconButton label="Edit" icon={Edit3} onClick={() => listingAction("edit", item)} />
                        <IconButton label="Duplicate" icon={FilePlus2} onClick={() => listingAction("duplicate", item)} />
                        <IconButton label="Use in extension" icon={Sparkles} onClick={() => listingAction("extension", item)} />
                        <IconButton label="Export" icon={Download} locked={usage?.plan === "free"} onClick={() => listingAction("export", item)} />
                        <IconButton label="Delete" icon={Trash2} onClick={() => listingAction("delete", item)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <FilePlus2 className="mx-auto h-10 w-10 text-neutral-300" />
            <h3 className="mt-4 text-lg font-extrabold text-neutral-900">Create your first AI-powered listing</h3>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-xs font-bold text-white" href="/dashboard/listings/new">
                Generate AI Listing
              </Link>
              <Link className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-800" href="/dashboard/tutorial">
                Capture Old Listing
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function UpgradeNotice({ strong = false }: { strong?: boolean }) {
  return (
    <div className={`mt-4 rounded-xl border p-4 ${strong ? "border-red-200 bg-red-50" : "border-neutral-200 bg-neutral-50"}`}>
      <div className="flex items-start gap-3">
        <Lock className={`mt-0.5 h-4 w-4 ${strong ? "text-red-700" : "text-neutral-900"}`} />
        <div>
          <h3 className="text-sm font-extrabold text-neutral-900">
            {strong ? "Free limit reached. Upgrade to continue creating AI listings." : "Ready to create more?"}
          </h3>
          <p className="mt-2 text-xs font-semibold leading-6 text-neutral-600">
            {strong
              ? "You have used all 5 free AI listings. Upgrade to continue generating, saving and autofilling listings."
              : "You have created 3 AI listings. Upgrade to Seller and get 100 AI listings/month."}
          </p>
          <Link className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-xs font-bold text-white" href="/dashboard/subscription">
            Upgrade to Seller ₹99/month
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function IconButton({ label, icon: Icon, locked = false, onClick }: { label: string; icon: typeof ExternalLink; locked?: boolean; onClick: () => void }) {
  return (
    <button className="grid h-8 w-8 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50" title={locked ? `${label} requires upgrade` : label} onClick={onClick}>
      {locked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
    </button>
  );
}

function sourceLabel(source?: string) {
  const labels: Record<string, string> = {
    ai_generated: "AI Generated",
    extension_capture: "Extension Capture",
    manual: "Manual",
    csv: "CSV Upload",
    product_library: "Product Library",
  };
  return labels[source || "manual"] || "Manual";
}
