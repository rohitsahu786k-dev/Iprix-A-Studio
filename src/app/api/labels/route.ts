import { z } from "zod";
import { ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { LabelJob } from "@/models";

const schema = z.object({
  filename: z.string().min(2),
  size: z.coerce.number().min(1),
  pages: z.coerce.number().optional().default(1),
  text: z.string().optional().default(""),
});

function analyseLabel(input: z.infer<typeof schema>) {
  const haystack = `${input.filename} ${input.text}`.toLowerCase();
  const carrierRules = [
    ["Delhivery", /delhivery|dlv|waybill/],
    ["Shiprocket", /shiprocket|sr\s*shipment|awb/],
    ["Amazon Shipping", /amazon|ats/],
    ["Ekart", /ekart|e-kart|flipkart/],
    ["Blue Dart", /blue\s*dart|bluedart/],
    ["DTDC", /dtdc/],
    ["Xpressbees", /xpressbees|xpress bees/],
    ["India Post", /india\s*post|speed\s*post/],
  ] as const;
  const carrier = carrierRules.find(([, pattern]) => pattern.test(haystack))?.[0] || "Unknown";
  const trackingMatches = Array.from(
    new Set((`${input.filename} ${input.text}`.match(/\b[A-Z0-9][A-Z0-9-]{7,24}\b/gi) || []).map((value) => value.toUpperCase())),
  ).slice(0, 10);
  return {
    carrier,
    trackingNumbers: trackingMatches,
    needsReview: carrier === "Unknown" || trackingMatches.length === 0,
    pageCount: input.pages,
    fileSize: input.size,
  };
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const analysis = analyseLabel(parsed.data);
  const item = await LabelJob.create({
    userId: auth.session.id,
    feature: "label-analyser",
    status: analysis.needsReview ? "review" : "analysed",
    message: parsed.data.filename,
    metadata: analysis,
  });
  return ok({ item, analysis }, { status: 201 });
}

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  await connectDb();
  const items = await LabelJob.find({ userId: auth.session.id }).sort({ createdAt: -1 }).limit(50);
  return ok({ items });
}
