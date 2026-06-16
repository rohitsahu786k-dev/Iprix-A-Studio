import { z } from "zod";
import { ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { ExtensionLog } from "@/models";

const schema = z.object({
  platform: z.string().default("meesho"),
  action: z.string().min(2),
  success: z.boolean().default(true),
  errorMessage: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const item = await ExtensionLog.create({ ...parsed.data, userId: auth.session.id });
  return ok({ item }, { status: 201 });
}
