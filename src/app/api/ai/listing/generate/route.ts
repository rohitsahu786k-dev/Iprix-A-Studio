import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { aiListingInputSchema, generateAIListing, planAtTime } from "@/lib/ai-engine";
import { connectDb } from "@/lib/db";
import { checkAIListingAllowance, createAIUsageLog } from "@/lib/listing-usage";
import { AIUsageLog, Listing, User } from "@/models";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(request, "ai:listing", 12, 60_000);
  if (limited) return limited;
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, aiListingInputSchema);
  if (parsed.response) return parsed.response;

  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  const allowance = await checkAIListingAllowance(user);
  await user.save();
  if (!allowance.allowed) {
    await createAIUsageLog({
      userId: auth.session.id,
      feature: "ai_listing",
      planAtTime: planAtTime(user.plan),
      status: "blocked",
      reason: "listing_limit_reached",
    });
    return fail("You have used your free AI limit. Upgrade now to continue generating advanced listings.", 402, {
      code: allowance.error,
      usage: allowance.snapshot,
    });
  }

  try {
    const result = await generateAIListing(parsed.data, user.plan);
    const generated = result.json;
    const listing = await Listing.create({
      userId: auth.session.id,
      platform: parsed.data.targetPlatform || parsed.data.platform,
      source: "ai_generated",
      status: "draft",
      title: String(generated.generatedTitle || generated.title || parsed.data.productName),
      generatedTitle: String(generated.generatedTitle || generated.title || parsed.data.productName),
      titleVariations: toList(generated.titleVariations),
      shortDescription: String(generated.shortDescription || ""),
      description: String(generated.longDescription || generated.description || ""),
      bulletPoints: toList(generated.bulletPoints),
      keywords: toList(generated.keywords),
      primaryKeywords: toList(generated.primaryKeywords),
      secondaryKeywords: toList(generated.secondaryKeywords),
      longTailKeywords: toList(generated.longTailKeywords),
      searchTerms: toList(generated.searchTerms),
      sku: String(generated.sku || ""),
      category: String(generated.categorySuggestion || parsed.data.category),
      categorySuggestion: String(generated.categorySuggestion || parsed.data.category),
      brand: parsed.data.brand,
      price: parsed.data.price ?? parsed.data.sellingPrice,
      mrp: parsed.data.mrp,
      colors: parsed.data.color ? [parsed.data.color] : [],
      sizes: parsed.data.size ? [parsed.data.size] : [],
      material: parsed.data.material,
      productHighlights: toList(generated.productHighlights),
      careInstructions: toList(generated.careInstructions),
      improvementTips: toList(generated.improvementTips),
      marketplaceCompliance: generated.marketplaceCompliance || {},
      aiScore: generated.listingScore || {},
      aiGenerated: true,
      aiModel: result.model,
      usageCounted: false,
      payload: { input: parsed.data, generated },
    });

    await AIUsageLog.create({
      userId: auth.session.id,
      feature: "ai_listing",
      planAtTime: planAtTime(user.plan),
      model: result.model,
      status: "success",
      creditsConsumed: 0,
      prompt: result.prompt,
      output: result.text,
    });

    return ok({ listing, output: generated, provider: result.provider, model: result.model, usage: allowance.snapshot }, { status: 201 });
  } catch (error) {
    await createAIUsageLog({
      userId: auth.session.id,
      feature: "ai_listing",
      planAtTime: planAtTime(user.plan),
      status: "failed",
      reason: error instanceof Error ? error.message : "generation_failed",
    });
    return fail("AI generation failed. Please retry; usage was not consumed.", 502);
  }
}

function toList(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}
