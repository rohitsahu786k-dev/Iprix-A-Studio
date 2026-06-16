import { ok, parseBody, requireApiUser } from "@/lib/api";
import { z } from "zod";
import { generateWithOpenAI } from "@/lib/openai";

const schema = z.object({ prompt: z.string().optional(), brand: z.string().optional(), category: z.string().optional(), color: z.string().optional(), size: z.string().optional() });

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  const prompt = parsed.data.prompt || `Generate SKU for ${parsed.data.brand || "Iprix"} ${parsed.data.category || "item"} ${parsed.data.color || ""} ${parsed.data.size || ""}`;
  const result = await generateWithOpenAI("sku", prompt);
  return ok({ sku: result.text, output: result.text, provider: result.provider });
}
