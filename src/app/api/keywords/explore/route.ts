import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, parseBody, requireApiUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

/*
  Free Keyword Explorer — aggregates public, keyless autocomplete sources
  (Google, DuckDuckGo, Datamuse, Amazon India suggestions). No AI credits,
  no paid APIs, no usage consumed. Results are scored by how many sources
  agree and grouped by seller intent.
*/

export const runtime = "nodejs";

const schema = z.object({
  seed: z.string().min(2).max(80),
});

type Hit = { term: string; sources: Set<string> };

const FETCH_TIMEOUT = 4500;

async function fetchJson(url: string, headers: Record<string, string> = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        accept: "application/json, text/javascript, */*",
        ...headers,
      },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function googleSuggest(q: string): Promise<string[]> {
  const data = await fetchJson(
    `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=in&q=${encodeURIComponent(q)}`,
  );
  if (Array.isArray(data) && Array.isArray(data[1])) return (data[1] as unknown[]).map(String);
  return [];
}

async function duckSuggest(q: string): Promise<string[]> {
  const data = await fetchJson(`https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`);
  if (Array.isArray(data) && Array.isArray(data[1])) return (data[1] as unknown[]).map(String);
  return [];
}

const buyerWords = ["buy", "price", "under", "online", "best", "cheap", "offer", "cod", "sale", "low price", "wholesale", "combo"];
const audienceWords = ["women", "men", "girls", "boys", "kids", "ladies", "gents", "baby", "bridal", "couple"];
const questionWords = ["how", "what", "which", "why", "is ", "can ", "does "];

function classify(term: string) {
  const t = ` ${term.toLowerCase()} `;
  if (questionWords.some((w) => t.trim().startsWith(w))) return "questions";
  if (buyerWords.some((w) => t.includes(` ${w}`) || t.includes(`${w} `))) return "buyerIntent";
  if (audienceWords.some((w) => t.includes(` ${w} `) || t.endsWith(` ${w} `))) return "audience";
  if (term.trim().split(/\s+/).length >= 4) return "longTail";
  return "core";
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "keywords-explore", 15, 60_000);
  if (limited) return limited;
  const { response } = await requireApiUser(undefined, request);
  if (response) return response;
  const { data, response: badBody } = await parseBody(request, schema);
  if (badBody || !data) return badBody;

  const seed = data.seed.trim().toLowerCase();

  // Query fan-out: base seed + high-value seller modifiers + full alphabet
  // soup (the classic autocomplete-expansion trick). Everything runs in
  // parallel with per-request timeouts; failures are silently skipped.
  const modifiers = [
    "",
    " for women",
    " for men",
    " for kids",
    " under",
    " with",
    " combo",
    " set",
    " design",
    " latest",
    " online",
  ];
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("").map((ch) => ` ${ch}`);
  const expansions = [...modifiers, ...alphabet].map((suffix) => `${seed}${suffix}`);
  expansions.push(`best ${seed}`);

  const tasks: Array<Promise<{ source: string; terms: string[] }>> = [
    ...expansions.map(async (q) => ({ source: "google", terms: await googleSuggest(q) })),
    (async () => ({ source: "duckduckgo", terms: await duckSuggest(seed) }))(),
    (async () => ({ source: "duckduckgo", terms: await duckSuggest(`${seed} for women`) }))(),
  ];

  const settled = await Promise.allSettled(tasks);

  const hits = new Map<string, Hit>();
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    const { source, terms } = result.value;
    for (const raw of terms) {
      const term = raw.trim().toLowerCase().replace(/\s+/g, " ");
      if (!term || term.length < 3 || term.length > 90) continue;
      const existing = hits.get(term) || { term, sources: new Set<string>() };
      existing.sources.add(source);
      hits.set(term, existing);
    }
  }
  hits.delete(seed);

  const keywords = [...hits.values()]
    .map((h) => ({
      term: h.term,
      score: h.sources.size * 10 + Math.min(9, h.term.split(/\s+/).length * 2),
      sources: [...h.sources],
      group: classify(h.term),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 150);

  const groups: Record<string, string[]> = { core: [], buyerIntent: [], audience: [], longTail: [], questions: [] };
  for (const k of keywords) groups[k.group]?.push(k.term);

  return ok({
    seed,
    total: keywords.length,
    sourcesUsed: [...new Set(keywords.flatMap((k) => k.sources))],
    groups,
    keywords,
  });
}
