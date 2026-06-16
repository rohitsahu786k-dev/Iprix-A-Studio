import { z } from "zod";
import { ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { LabelJob } from "@/models";

const schema = z.object({
  filename: z.string().min(2),
  size: z.coerce.number().min(1),
  pages: z.coerce.number().optional().default(1),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const item = await LabelJob.create({
    userId: auth.session.id,
    feature: "label-analyser",
    status: "uploaded",
    message: parsed.data.filename,
    metadata: { size: parsed.data.size, pages: parsed.data.pages, advancedCarrierDetection: "Coming Soon" },
  });
  return ok({ item, comingSoon: ["advanced carrier detection", "PDF page splitting"] }, { status: 201 });
}

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  await connectDb();
  const items = await LabelJob.find({ userId: auth.session.id }).sort({ createdAt: -1 }).limit(50);
  return ok({ items });
}
