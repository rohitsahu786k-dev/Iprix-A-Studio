"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Edit3, Eye, LoaderCircle, Save } from "lucide-react";

type ListingDetail = {
  _id: string;
  title?: string;
  description?: string;
  sku?: string;
  brand?: string;
  category?: string;
  platform?: string;
  status?: string;
  price?: number;
  mrp?: number;
  keywords?: string[];
  bulletPoints?: string[];
  aiScore?: Record<string, number>;
  createdAt?: string;
  updatedAt?: string;
};

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [readOnly, setReadOnly] = useState(searchParams.get("mode") === "view");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch(`/api/listings/${encodeURIComponent(params.id)}`, { cache: "no-store" })
      .then(async (response) => ({ response, data: await response.json().catch(() => ({})) }))
      .then(({ response, data }) => {
        if (!mounted) return;
        if (!response.ok) throw new Error(data.error || "Listing could not be loaded.");
        setListing(data.listing || data.item);
      })
      .catch((error) => mounted && setStatus(error instanceof Error ? error.message : "Listing could not be loaded."))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [params.id]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!listing || readOnly) return;
    setSaving(true);
    setStatus("");
    const raw = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload = {
      ...raw,
      keywords: String(raw.keywords || "").split(",").map((item) => item.trim()).filter(Boolean),
      bulletPoints: String(raw.bulletPoints || "").split("\n").map((item) => item.trim()).filter(Boolean),
      price: raw.price ? Number(raw.price) : undefined,
      mrp: raw.mrp ? Number(raw.mrp) : undefined,
    };
    try {
      const response = await fetch(`/api/listings/${encodeURIComponent(params.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Listing could not be saved.");
      setListing(data.listing || data.item);
      setStatus("Listing changes saved successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Listing could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="grid min-h-72 place-items-center"><LoaderCircle className="h-7 w-7 animate-spin text-indigo-600" /></div>;

  if (!listing) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-700">{status || "Listing not found."}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link href="/dashboard/listings" className="mb-4 inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-indigo-700"><ArrowLeft className="h-4 w-4" /> Back to listings</Link>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-600">Listing workspace</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-slate-950">{listing.title || "Untitled listing"}</h1>
        </div>
        <button type="button" onClick={() => setReadOnly((current) => !current)} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-700 shadow-sm hover:bg-slate-50">
          {readOnly ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {readOnly ? "Edit listing" : "Preview mode"}
        </button>
      </div>

      {status ? <div className={`rounded-xl border px-4 py-3 text-xs font-bold ${status.includes("successfully") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{status}</div> : null}

      <form onSubmit={save} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="grid gap-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:grid-cols-2">
          <Field label="Product title" name="title" value={listing.title} disabled={readOnly} wide />
          <Field label="Brand" name="brand" value={listing.brand} disabled={readOnly} />
          <Field label="Category" name="category" value={listing.category} disabled={readOnly} />
          <SelectField label="Platform" name="platform" value={listing.platform || "meesho"} disabled={readOnly} options={["meesho", "flipkart", "amazon"]} />
          <SelectField label="Status" name="status" value={listing.status || "draft"} disabled={readOnly} options={["draft", "generated", "autofilled", "exported", "failed"]} />
          <Field label="SKU" name="sku" value={listing.sku} disabled={readOnly} />
          <Field label="Selling price" name="price" value={listing.price?.toString()} disabled={readOnly} type="number" />
          <Field label="MRP" name="mrp" value={listing.mrp?.toString()} disabled={readOnly} type="number" />
          <TextAreaField label="Description" name="description" value={listing.description} disabled={readOnly} wide />
          <TextAreaField label="Bullet points (one per line)" name="bulletPoints" value={(listing.bulletPoints || []).join("\n")} disabled={readOnly} />
          <TextAreaField label="Keywords (comma separated)" name="keywords" value={(listing.keywords || []).join(", ")} disabled={readOnly} />
          {!readOnly ? <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-xs font-extrabold text-white disabled:opacity-60 md:col-span-2" disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save listing changes"}</button> : null}
        </section>

        <aside className="space-y-5">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">AI quality scores</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {Object.entries(listing.aiScore || {}).slice(0, 6).map(([key, value]) => <div className="rounded-2xl bg-slate-50 p-3" key={key}><p className="truncate text-[8px] font-black uppercase text-slate-400">{key}</p><p className="mt-1 font-mono text-xl font-black text-slate-950">{value ?? 0}</p></div>)}
              {!Object.keys(listing.aiScore || {}).length ? <p className="col-span-2 text-xs font-semibold leading-5 text-slate-500">Scores appear after AI generation.</p> : null}
            </div>
          </div>
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5"><p className="flex items-center gap-2 text-xs font-extrabold text-emerald-900"><Check className="h-4 w-4" /> Safe review</p><p className="mt-2 text-[10px] font-semibold leading-5 text-emerald-800">Review all claims, prices and marketplace attributes before sending this listing to the extension.</p></div>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, name, value, disabled, wide = false, type = "text" }: { label: string; name: string; value?: string; disabled: boolean; wide?: boolean; type?: string }) {
  return <label className={`grid gap-2 text-xs font-extrabold text-slate-700 ${wide ? "md:col-span-2" : ""}`}><span>{label}</span><input type={type} min={type === "number" ? 0 : undefined} name={name} defaultValue={value || ""} disabled={disabled} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold disabled:bg-slate-50 disabled:text-slate-500" /></label>;
}

function TextAreaField({ label, name, value, disabled, wide = false }: { label: string; name: string; value?: string; disabled: boolean; wide?: boolean }) {
  return <label className={`grid gap-2 text-xs font-extrabold text-slate-700 ${wide ? "md:col-span-2" : ""}`}><span>{label}</span><textarea name={name} defaultValue={value || ""} disabled={disabled} className="min-h-32 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold leading-6 disabled:bg-slate-50 disabled:text-slate-500" /></label>;
}

function SelectField({ label, name, value, disabled, options }: { label: string; name: string; value: string; disabled: boolean; options: string[] }) {
  return <label className="grid gap-2 text-xs font-extrabold text-slate-700"><span>{label}</span><select name={name} defaultValue={value} disabled={disabled} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold capitalize disabled:bg-slate-50 disabled:text-slate-500">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
