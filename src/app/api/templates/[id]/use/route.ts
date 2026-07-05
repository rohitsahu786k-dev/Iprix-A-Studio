import { fail, ok, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { checkListingAllowance, consumeListingUsage } from "@/lib/listing-usage";
import { Listing, Template, User } from "@/models";

type Context = { params: Promise<{ id: string }> | { id: string } };

async function getId(context: Context) {
  const params = await context.params;
  return params.id;
}

export async function POST(request: Request, context: Context) {
  const auth = await requireApiUser(undefined, request);
  if (auth.response) return auth.response;
  await connectDb();

  const template = await Template.findOne({ _id: await getId(context), userId: auth.session.id });
  if (!template) return fail("Template not found", 404);

  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);

  const allowance = await checkListingAllowance(user);
  if (!allowance.allowed) {
    return fail("Listing fill limit reached. Upgrade your subscription to continue.", 402, {
      code: allowance.error,
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
    title: template.name,
    payload: { templateId: template._id, route: "/api/templates/[id]/use" },
    usageCounted: false,
  });
  const usageResult = await consumeListingUsage(user, listing._id, "extension_template_fill", {
    templateId: String(template._id),
  });

  template.set({
    usageCount: Number(template.usageCount || 0) + 1,
    lastUsedAt: new Date(),
  });
  await template.save();

  return ok({
    template,
    listing,
    fillsUsed: usageResult.snapshot.used,
    fillLimit: usageResult.snapshot.limit,
    canAutoFill: usageResult.snapshot.canCreateListing,
    usage: usageResult.snapshot,
    usageCount: template.usageCount,
  });
}
