import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { generateWithOpenAI } from "@/lib/openai";
import { AIUsageLog, User } from "@/models";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  prompt: z.string().min(2).max(4000),
  product: z.record(z.string(), z.any()).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ feature: string }> },
) {
  const limited = rateLimit(request, "ai:generic", 12, 60_000);
  if (limited) return limited;
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  const { feature } = await params;

  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  if ((user.aiCredits || 0) <= 0) return fail("AI credits exhausted", 402);

  const productContext = parsed.data.product ? `\nProduct JSON: ${JSON.stringify(parsed.data.product)}` : "";
  const result = await generateWithOpenAI(feature, `${parsed.data.prompt}${productContext}`);
  user.set({ aiCredits: Math.max(0, (user.aiCredits || 0) - 1) });
  await Promise.all([
    user.save(),
    AIUsageLog.create({
      userId: auth.session.id,
      feature,
      status: "success",
      creditsConsumed: 1,
      prompt: parsed.data.prompt,
      output: result.text,
    }),
  ]);

  return ok({ output: result.text, provider: result.provider, creditsRemaining: user.aiCredits });
}
