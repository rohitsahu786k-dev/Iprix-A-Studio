"use client";

import { useEffect, useState } from "react";

export function AdminResource({ resource }: { resource: string }) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch(`/api/admin/${resource}`)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setStatus("Could not load admin records."));
  }, [resource]);

  async function quickAction(id: unknown, action: string) {
    const body =
      action === "suspend"
        ? { suspended: true }
        : action === "activate"
          ? { suspended: false }
          : action === "reset-listings"
            ? { freeListingsUsed: 0, monthlyListingsUsed: 0 }
            : action === "reset-keywords"
              ? { freeKeywordResearchUsed: 0, monthlyKeywordResearchUsed: 0 }
              : action === "plan-seller"
                ? { plan: "seller", subscriptionStatus: "active", monthlyListingsLimit: 100, monthlyKeywordResearchLimit: 100 }
                : action === "plan-free"
                  ? { plan: "free", subscriptionStatus: "free", monthlyListingsLimit: 0, monthlyKeywordResearchLimit: 0 }
                  : { status: "resolved" };
    const response = await fetch(`/api/admin/${resource}?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setStatus(response.ok ? "Updated." : "Update failed.");
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Admin dashboard</p>
          <h1 className="mt-2 text-3xl font-extrabold capitalize tracking-tight text-neutral-900 sm:text-4xl">{resource.replaceAll("-", " ")}</h1>
        </div>
        <span className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-600 shadow-sm">{items.length} records</span>
      </div>
      {status ? <p className="mt-5 rounded-xl border border-neutral-200 bg-white p-3 text-xs font-bold text-neutral-700 shadow-sm">{status}</p> : null}
      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3">
          {items.length ? (
            items.map((item, index) => (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3" key={String(item._id || index)}>
                <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(item).slice(0, 8).map(([key, value]) => (
                    <div className="min-w-0 rounded-lg border border-neutral-100 bg-white p-3" key={key}>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">{key}</p>
                      <p className="mt-1 break-words font-semibold text-neutral-800">{formatValue(value)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-bold text-white" onClick={() => quickAction(item._id, "activate")}>Activate</button>
                  <button className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700" onClick={() => quickAction(item._id, "suspend")}>Suspend</button>
                  <button className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700" onClick={() => quickAction(item._id, "resolve")}>Resolve</button>
                  {resource === "users" ? (
                    <>
                      <button className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700" onClick={() => quickAction(item._id, "reset-listings")}>Reset Listings</button>
                      <button className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700" onClick={() => quickAction(item._id, "reset-keywords")}>Reset Keywords</button>
                      <button className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700" onClick={() => quickAction(item._id, "plan-free")}>Set Free</button>
                      <button className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700" onClick={() => quickAction(item._id, "plan-seller")}>Set Seller</button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm font-semibold text-neutral-500">No records yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function formatValue(value: unknown) {
  if (value == null || value === "") return "-";
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
