import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { checkListingAllowance, consumeListingUsage, getListingUsageSnapshot } from "@/lib/listing-usage";
import { fallbackAdvancedTitle, generateJsonWithOpenAI } from "@/lib/openai";
import { AIUsageLog, User } from "@/models";

const schema = z.object({
  productName: z.string().min(2),
  brand: z.string().optional().default(""),
  category: z.string().optional().default(""),
  platform: z.string().optional().default("meesho"),
  material: z.string().optional().default(""),
  color: z.string().optional().default(""),
  size: z.string().optional().default(""),
  gender: z.string().optional().default(""),
  occasion: z.string().optional().default(""),
  features: z.string().optional().default(""),
  keywords: z.string().optional().default(""),
  priceRange: z.string().optional().default(""),
  targetAudience: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;

  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  const allowance = await checkListingAllowance(user);
  await user.save();
  if (!allowance.allowed) {
    return fail("You have used all 5 free AI listings. Upgrade to continue generating advanced titles.", 402, {
      code: allowance.error,
      usage: allowance.snapshot,
    });
  }

  const system =
    "You are an expert Indian e-commerce listing copywriter for Meesho, Flipkart, Amazon and similar marketplaces. Generate marketplace-safe, SEO-friendly, high-conversion product titles. Avoid fake claims, medical claims, trademark misuse, spammy keyword stuffing and misleading words. Keep titles natural, clear and seller-friendly. Return valid JSON only.";
  const prompt = `Generate an advanced product title.
Product data:
- Product name: ${parsed.data.productName}
- Brand: ${parsed.data.brand}
- Category: ${parsed.data.category}
- Platform: ${parsed.data.platform}
- Material: ${parsed.data.material}
- Color: ${parsed.data.color}
- Size: ${parsed.data.size}
- Gender: ${parsed.data.gender}
- Occasion: ${parsed.data.occasion}
- Features: ${parsed.data.features}
- Keywords: ${parsed.data.keywords}
- Target audience: ${parsed.data.targetAudience}
Rules:
1. Title must be marketplace-friendly.
2. Title must include the strongest searchable keywords naturally.
3. Do not overstuff keywords.
4. Keep it clear and conversion-focused.
5. Avoid unsupported claims like best, guaranteed, original, branded unless provided.
6. Do not use emojis.
7. Do not use ALL CAPS.
8. Return JSON with bestTitle, titleVariations, titleScore, keywordCoverage, characterCount and improvementNotes.`;

  const fallback = fallbackAdvancedTitle(parsed.data);
  const result = await generateJsonWithOpenAI("advanced-title", system, prompt, fallback);

  // Consume one listing credit whenever a real model call happened. The
  // local-fallback path costs nothing and stays free — but with an OpenAI key
  // configured, this route previously only checked the quota without ever
  // decrementing it, allowing unlimited paid model calls.
  const consumed = result.provider === "openai";
  if (consumed) {
    await consumeListingUsage(user, null, "advanced_title", {
      route: "/api/ai/advanced-title",
      model: result.model,
    });
  }
  const snapshot = getListingUsageSnapshot(user);

  await AIUsageLog.create({
    userId: auth.session.id,
    feature: "advanced-title",
    status: "success",
    creditsConsumed: consumed ? 1 : 0,
    prompt,
    output: result.text,
  });

  return ok({
    output: result.json,
    provider: result.provider,
    model: result.model,
    usage: snapshot,
    message:
      snapshot.plan === "free"
        ? `Nice! This title is optimized for marketplace search. You have ${snapshot.remaining} free AI listings left.`
        : "Advanced title generated within your monthly plan.",
  });
}
