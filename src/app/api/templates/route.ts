import { fail, ok, parseBody, requireApiUser, userFilter } from "@/lib/api";
import { resourceHandlers, templateSchema } from "@/lib/crud";
import { connectDb } from "@/lib/db";
import { getListingUsageSnapshot, normalizePlan } from "@/lib/listing-usage";
import { planTemplateLimits } from "@/lib/plans";
import { Template, User } from "@/models";

const handlers = resourceHandlers(Template, templateSchema);

export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;

function stringParam(url: URL, key: string) {
  const value = url.searchParams.get(key);
  return value && value.trim() ? value.trim() : "";
}

export async function GET(request: Request) {
  const auth = await requireApiUser(undefined, request);
  if (auth.response) return auth.response;
  await connectDb();

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 100) || 100, 200);
  const filter: Record<string, unknown> = { ...userFilter(auth.session) };
  const platform = stringParam(url, "platform");
  const category = stringParam(url, "category");
  const siteUrl = stringParam(url, "url");

  if (platform) filter.platform = platform;
  if (category) filter.category = category;
  if (siteUrl) {
    const normalized = siteUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    filter.$or = [
      { url: normalized },
      { url: siteUrl },
      { capturedFromUrl: { $regex: normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
    ];
  }

  const [templates, count, user] = await Promise.all([
    Template.find(filter).sort({ lastUsedAt: -1, createdAt: -1 }).limit(limit),
    Template.countDocuments(filter),
    User.findById(auth.session.id),
  ]);
  const usage = user ? getListingUsageSnapshot(user) : null;
  await user?.save();

  return ok({
    items: templates,
    templates,
    count,
    fillsUsed: usage?.used ?? 0,
    fillLimit: usage?.limit ?? -1,
    canAutoFill: usage?.canCreateListing ?? true,
    planName: usage?.plan || auth.session.plan || "free",
  });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(undefined, request);
  if (auth.response) return auth.response;
  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  const limit = planTemplateLimits[normalizePlan(user.plan)];
  if (limit !== -1) {
    const count = await Template.countDocuments({ userId: auth.session.id });
    if (count >= limit) {
      return fail("Free template limit reached. Upgrade to save unlimited templates.", 402, {
        code: "template_limit_reached",
      });
    }
  }
  const parsed = await parseBody(request, templateSchema);
  if (parsed.response) return parsed.response;
  const fieldCount = parsed.data.fieldCount || parsed.data.fields.length;
  if (parsed.data.autoFill) {
    await Template.updateMany(
      {
        userId: auth.session.id,
        platform: parsed.data.platform,
        category: parsed.data.category,
      },
      { $set: { autoFill: false } },
    );
  }
  const template = await Template.create({
    ...parsed.data,
    source: parsed.data.source || "extension_capture",
    fieldCount,
    userId: auth.session.id,
  });
  return ok({ item: template, template }, { status: 201 });
}
