"use client";

import { useState } from "react";
import { Compass, Copy, Download, Search } from "lucide-react";

type ExploreResult = {
  seed: string;
  total: number;
  sourcesUsed: string[];
  groups: Record<string, string[]>;
  keywords: Array<{ term: string; score: number; sources: string[]; group: string }>;
};

const groupLabels: Record<string, string> = {
  core: "Core keywords",
  buyerIntent: "Buyer intent (high conversion)",
  audience: "Audience targeted",
  longTail: "Long-tail (easy rank)",
  questions: "Questions (content ideas)",
};

export function KeywordExplorer() {
  const [seed, setSeed] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExploreResult | null>(null);
  const [copied, setCopied] = useState("");

  async function explore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!seed.trim()) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/keywords/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: seed.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Keyword explore failed. Try again in a minute.");
      } else {
        setResult(data as ExploreResult);
      }
    } catch {
      setError("Network error. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  async function copyGroup(key: string, terms: string[]) {
    await navigator.clipboard.writeText(terms.join(", "));
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  function downloadCsv() {
    if (!result) return;
    const rows = result.keywords.map((k) => `"${k.term.replaceAll('"', '""')}",${k.score},${k.group},"${k.sources.join("|")}"`);
    const blob = new Blob([`keyword,score,group,sources\n${rows.join("\n")}`], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `keywords-${result.seed.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-3xl border border-zinc-800 bg-white shadow-pin p-6">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-zinc-100 mb-2">
          <Compass className="h-4 w-4 text-indigo-500" />
          Keyword Explorer — live search data, 100% free
        </div>
        <p className="text-xs font-semibold text-zinc-400 leading-relaxed mb-5 max-w-2xl">
          Google India aur DuckDuckGo ke real-time autocomplete se 100+ keywords nikalta hai — jo log actually search kar rahe hain.
          Koi AI credit use nahi hota, unlimited free.
        </p>
        <form onSubmit={explore} className="flex flex-col sm:flex-row gap-3">
          <input
            className="flex-1 rounded-full border border-zinc-800 px-5 py-3.5 text-sm font-semibold outline-none bg-white"
            placeholder="e.g. cotton kurti, phone cover, steel bottle..."
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            minLength={2}
            required
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-500 px-7 py-3.5 text-xs font-bold text-white hover:bg-indigo-600 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
            disabled={busy}
          >
            <Search className="h-4 w-4" />
            {busy ? "Exploring..." : "Explore keywords"}
          </button>
        </form>
        {error ? <p className="mt-4 rounded-2xl bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-600">{error}</p> : null}
      </div>

      {result ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
              {result.total} keywords mile — sources: {result.sourcesUsed.join(", ")}
            </span>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-white px-5 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-900 transition-all cursor-pointer"
              type="button"
              onClick={downloadCsv}
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {Object.entries(result.groups)
              .filter(([, terms]) => terms.length)
              .map(([key, terms]) => (
                <article className="rounded-3xl border border-zinc-800 bg-white shadow-pin p-5" key={key}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-100">
                      {groupLabels[key] || key} <span className="text-zinc-500">({terms.length})</span>
                    </h3>
                    <button
                      className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-1.5 text-[10px] font-bold text-zinc-300 hover:bg-zinc-850 transition-all cursor-pointer"
                      type="button"
                      onClick={() => void copyGroup(key, terms)}
                    >
                      <Copy className="h-3 w-3" />
                      {copied === key ? "Copied!" : "Copy all"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {terms.slice(0, 40).map((term) => (
                      <span key={term} className="rounded-full bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 text-[11px] font-bold text-zinc-300">
                        {term}
                      </span>
                    ))}
                    {terms.length > 40 ? <span className="text-xs font-bold text-zinc-500 self-center">+{terms.length - 40} more (CSV me)</span> : null}
                  </div>
                </article>
              ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
