import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { aiListingInputSchema, generateAIListing, planAtTime } from "@/lib/ai-engine";
import { connectDb } from "@/lib/db";
import { checkAIListingAllowance, createAIUsageLog } from "@/lib/listing-usage";
import { AIUsageLog, User } from "@/models";
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
  await AIUsageLog.create({
    userId: auth.session.id,
    feature: "extension_ai",
    planAtTime: planAtTime(user.plan),
    model: result.model,
    status: "success",
    creditsConsumed: 0,
    prompt: result.prompt,
    output: result.text,
  });
  return ok({ output: result.json, provider: result.provider, model: result.model, usage: allowance.snapshot });
}
