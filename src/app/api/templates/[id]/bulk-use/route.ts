import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { checkListingAllowance, consumeListingUsage } from "@/lib/listing-usage";
import { Listing, Template, User } from "@/models";

type Context = { params: Promise<{ id: string }> | { id: string } };

const schema = z.object({
  count: z.coerce.number().int().min(1).max(250),
});

async function getId(context: Context) {
  const params = await context.params;
  return params.id;
}

export async function POST(request: Request, context: Context) {
  const auth = await requireApiUser(undefined, request);
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  await connectDb();

  const template = await Template.findOne({ _id: await getId(context), userId: auth.session.id });
  if (!template) return fail("Template not found", 404);
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);

  let consumed = 0;
  let lastUsage = null;
  for (let index = 0; index < parsed.data.count; index += 1) {
    const allowance = await checkListingAllowance(user);
    if (!allowance.allowed) {
      return fail("Listing fill limit reached during bulk fill. Upgrade your subscription to continue.", 402, {
        code: allowance.error,
        consumed,
        fillsUsed: allowance.snapshot.used,
        fillLimit: allowance.snapshot.limit,
        canAutoFill: false,
        usage: allowance.snapshot,
      });
    }

    const listing = await Listing.create({
      userId: auth.session.id,
      templateId: template._id,
      platform: template.platform || "meesho",
      source: "extension_capture",
      status: "autofilled",
      title: `${template.name} bulk fill ${index + 1}`,
      payload: { templateId: template._id, bulkIndex: index + 1 },
      usageCounted: false,
    });
    const usageResult = await consumeListingUsage(user, listing._id, "extension_bulk_fill", {
      templateId: String(template._id),
      bulkIndex: index + 1,
    });
    consumed += usageResult.consumed ? 1 : 0;
    lastUsage = usageResult.snapshot;
  }

  template.set({
    usageCount: Number(template.usageCount || 0) + consumed,
    lastUsedAt: new Date(),
  });
  await template.save();

  return ok({
    consumed,
    fillsUsed: lastUsage?.used ?? 0,
    fillLimit: lastUsage?.limit ?? -1,
    canAutoFill: lastUsage?.canCreateListing ?? true,
    usage: lastUsage,
    usageCount: template.usageCount,
  });
}
