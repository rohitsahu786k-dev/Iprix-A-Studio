import { z } from "zod";
import { ok, parseBody, requireApiUser } from "@/lib/api";
import { generateWithOpenAI } from "@/lib/openai";

const schema = z.object({
  prompt: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional().default([]),
  images: z.array(z.any()).optional().default([]),
  price: z.coerce.number().optional(),
  sku: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  const prompt = parsed.data.prompt || `Score this marketplace listing and suggest fixes: ${JSON.stringify(parsed.data)}`;
  const result = await generateWithOpenAI("listing-score", prompt);
  return ok({ output: result.text, provider: result.provider });
}
