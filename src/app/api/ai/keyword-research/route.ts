import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { generateKeywordReport, keywordResearchInputSchema, planAtTime } from "@/lib/ai-engine";
import { connectDb } from "@/lib/db";
import { checkKeywordResearchAllowance, consumeKeywordResearchUsage, createAIUsageLog } from "@/lib/listing-usage";
import { AIUsageLog, KeywordResearch, User } from "@/models";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(request, "ai:keyword", 12, 60_000);
  if (limited) return limited;
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, keywordResearchInputSchema);
  if (parsed.response) return parsed.response;

  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  const allowance = await checkKeywordResearchAllowance(user);
  await user.save();
  if (!allowance.allowed) {
    await createAIUsageLog({
      userId: auth.session.id,
      feature: "keyword_research",
      planAtTime: planAtTime(user.plan),
      status: "blocked",
      reason: "keyword_research_limit_reached",
    });
    return fail("You have used your free AI limit. Upgrade now to continue generating keyword research reports.", 402, {
      code: allowance.error,
      usage: allowance.snapshot,
    });
  }

  try {
    const result = await generateKeywordReport(parsed.data);
    const output = result.json as Record<string, unknown>;
    const report = await KeywordResearch.create({
      userId: auth.session.id,
      ...parsed.data,
      ...output,
      aiModel: result.model,
      usageCounted: false,
      status: "success",
      prompt: result.prompt,
      output,
    });
    const usage = await consumeKeywordResearchUsage(user, report._id, "keyword_research", {
      route: "/api/ai/keyword-research",
      model: result.model,
    });
    await AIUsageLog.create({
      userId: auth.session.id,
      feature: "keyword_research",
      planAtTime: planAtTime(user.plan),
      model: result.model,
      status: "success",
      creditsConsumed: 0,
      prompt: result.prompt,
      output: result.text,
    });

    return ok({ report, output, provider: result.provider, model: result.model, usage: usage.snapshot }, { status: 201 });
  } catch (error) {
    await createAIUsageLog({
      userId: auth.session.id,
      feature: "keyword_research",
      planAtTime: planAtTime(user.plan),
      status: "failed",
      reason: error instanceof Error ? error.message : "keyword_generation_failed",
    });
    return fail("Keyword research failed. Please retry; usage was not consumed.", 502);
  }
}

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  await connectDb();
  const items = await KeywordResearch.find({ userId: auth.session.id }).sort({ createdAt: -1 }).limit(100);
  return ok({ items });
}
