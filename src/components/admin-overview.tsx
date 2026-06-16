"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CreditCard, IndianRupee, LifeBuoy, ListChecks, Sparkles, Users } from "lucide-react";

type Overview = {
  stats?: Record<string, number>;
  recent?: { users?: Array<Record<string, unknown>>; ai?: Array<Record<string, unknown>> };
};

const cards = [
  ["Total users", "totalUsers", Users],
  ["Free users", "freeUsers", Users],
  ["Paid users", "paidUsers", CreditCard],
  ["Active subscriptions", "activeSubscriptions", CreditCard],
  ["MRR estimate", "mrrEstimate", IndianRupee],
  ["Payments this month", "paymentsMonth", IndianRupee],
  ["AI listings", "aiListings", Sparkles],
  ["Keyword reports", "keywordReports", ListChecks],
  ["Near free limit", "nearLimit", AlertTriangle],
  ["Hit free limit", "hitLimit", AlertTriangle],
  ["Extension autofills", "extensionAutofills", Activity],
  ["Open support", "supportTickets", LifeBuoy],
] as const;

export function AdminOverview() {
  const [data, setData] = useState<Overview>({});
  const [status, setStatus] = useState("Loading admin overview...");

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/overview")
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        setData(json);
        setStatus("");
      })
      .catch(() => {
        if (mounted) setStatus("Could not load admin overview.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const stats = data.stats || {};

  return (
    <div className="space-y-7">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">Admin dashboard</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl">Overview</h1>
      </div>
      {status ? <p className="rounded-xl border border-neutral-200 bg-white p-3 text-xs font-medium text-neutral-700 shadow-sm">{status}</p> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, key, Icon]) => (
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm" key={key}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
                <p className="mt-2 break-words text-2xl font-medium text-neutral-900">{formatValue(key, stats[key] ?? 0)}</p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800">
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </article>
        ))}
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <RecentPanel title="Recent users" items={data.recent?.users || []} />
        <RecentPanel title="Recent AI activity" items={data.recent?.ai || []} />
      </section>
    </div>
  );
}

function RecentPanel({ title, items }: { title: string; items: Array<Record<string, unknown>> }) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-900">{title}</h2>
      <div className="mt-4 grid gap-2">
        {items.length ? (
          items.map((item, index) => (
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-700" key={String(item._id || index)}>
              <p className="break-words font-medium text-neutral-900">{String(item.name || item.email || item.feature || item.status || "Activity")}</p>
              <p className="mt-1 break-words text-neutral-500">{String(item.email || item.reason || item.createdAt || "")}</p>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-xs font-medium text-neutral-500">No recent records.</p>
        )}
      </div>
    </article>
  );
}

function formatValue(key: string, value: number) {
  if (key === "mrrEstimate") return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
  return Number(value).toLocaleString("en-IN");
}
