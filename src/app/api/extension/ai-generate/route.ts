import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { aiListingInputSchema, generateAIListing, planAtTime } from "@/lib/ai-engine";
import { connectDb } from "@/lib/db";
import { checkAIListingAllowance, consumeAIListingUsage, createAIUsageLog } from "@/lib/listing-usage";
import { AIUsageLog, Listing, User } from "@/models";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(request, "extension:ai", 12, 60_000);
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
      feature: "extension_ai",
      planAtTime: planAtTime(user.plan),
      status: "blocked",
      reason: "listing_limit_reached",
    });
    return fail("Free listing limit reached. Upgrade to continue extension AI generation.", 402, {
      code: allowance.error,
      usage: allowance.snapshot,
    });
  }

  const result = await generateAIListing(parsed.data, user.plan);

  // Every extension AI generation consumes one listing credit at generation
  // time — previously this route only checked the limit without consuming,
  // which allowed unlimited generations within a never-incrementing quota.
  // The draft listing keeps the output attached to the user's history and
  // marks usageCounted so downstream save/autofill never double-counts.
  const generated = result.json as Record<string, unknown>;
  const listing = await Listing.create({
    userId: auth.session.id,
    platform: parsed.data.targetPlatform || parsed.data.platform || "meesho",
    source: "ai_generated",
    status: "draft",
    title: String(generated.generatedTitle || generated.title || parsed.data.productName || "Extension AI listing"),
    aiGenerated: true,
    aiModel: result.model,
    usageCounted: false,
    payload: { input: parsed.data, generated, via: "extension" },
  });
  const usageResult = await consumeAIListingUsage(user, listing._id, "extension_ai", {
    route: "/api/extension/ai-generate",
    model: result.model,
  });

  await AIUsageLog.create({
    userId: auth.session.id,
    feature: "extension_ai",
    planAtTime: planAtTime(user.plan),
    model: result.model,
    status: "success",
    creditsConsumed: 1,
    prompt: result.prompt,
    output: result.text,
  });
  return ok({ output: result.json, listingId: String(listing._id), provider: result.provider, model: result.model, usage: usageResult.snapshot });
}
