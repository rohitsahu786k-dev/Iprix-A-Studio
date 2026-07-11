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
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Admin dashboard</p>
          <h1 className="mt-2 text-3xl font-extrabold capitalize tracking-tight text-zinc-100 sm:text-4xl">{resource.replaceAll("-", " ")}</h1>
        </div>
        <span className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-3 py-2 text-xs font-bold text-zinc-400 shadow-sm">{items.length} records</span>
      </div>
      {status ? <p className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-3 text-xs font-bold text-zinc-300 shadow-sm">{status}</p> : null}
      <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-4 shadow-sm sm:p-5">
        <div className="grid gap-3">
          {items.length ? (
            items.map((item, index) => (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3" key={String(item._id || index)}>
                <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(item).slice(0, 8).map(([key, value]) => (
                    <div className="min-w-0 rounded-lg border border-zinc-900 bg-zinc-900/50 backdrop-blur-md p-3" key={key}>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">{key}</p>
                      <p className="mt-1 break-words font-semibold text-zinc-200">{formatValue(value)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white" onClick={() => quickAction(item._id, "activate")}>Activate</button>
                  <button className="rounded-lg border border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-3 py-2 text-xs font-bold text-zinc-300" onClick={() => quickAction(item._id, "suspend")}>Suspend</button>
                  <button className="rounded-lg border border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-3 py-2 text-xs font-bold text-zinc-300" onClick={() => quickAction(item._id, "resolve")}>Resolve</button>
                  {resource === "users" ? (
                    <>
                      <button className="rounded-lg border border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-3 py-2 text-xs font-bold text-zinc-300" onClick={() => quickAction(item._id, "reset-listings")}>Reset Listings</button>
                      <button className="rounded-lg border border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-3 py-2 text-xs font-bold text-zinc-300" onClick={() => quickAction(item._id, "reset-keywords")}>Reset Keywords</button>
                      <button className="rounded-lg border border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-3 py-2 text-xs font-bold text-zinc-300" onClick={() => quickAction(item._id, "plan-free")}>Set Free</button>
                      <button className="rounded-lg border border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-3 py-2 text-xs font-bold text-zinc-300" onClick={() => quickAction(item._id, "plan-seller")}>Set Seller</button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 p-8 text-center text-sm font-semibold text-zinc-400">No records yet.</p>
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
