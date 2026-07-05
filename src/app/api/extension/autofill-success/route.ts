import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { checkListingAllowance, consumeListingUsage } from "@/lib/listing-usage";
import { ExtensionLog, Listing, Template, User } from "@/models";

const schema = z.object({
  platform: z.string().min(2).default("meesho"),
  url: z.string().optional().default(""),
  templateId: z.string().optional(),
  title: z.string().optional().default("Autofilled marketplace listing"),
  fields: z.record(z.string(), z.any()).optional().default({}),
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
  if (!allowance.allowed) {
    await ExtensionLog.create({
      userId: auth.session.id,
      platform: parsed.data.platform,
      action: "autofill_success_blocked",
      success: false,
      errorMessage: "Listing usage limit reached",
      metadata: { url: parsed.data.url },
    });
    return fail("Free listing limit reached. Upgrade to continue autofilling.", 402, {
      code: allowance.error,
      usage: allowance.snapshot,
    });
  }

  const listing = await Listing.create({
    userId: auth.session.id,
    templateId: parsed.data.templateId,
    platform: parsed.data.platform,
    source: "extension_capture",
    status: "autofilled",
    title: parsed.data.title,
    payload: { url: parsed.data.url, fields: parsed.data.fields },
    usageCounted: false,
  });
  const usageResult = await consumeListingUsage(user, listing._id, "extension_autofill", {
    route: "/api/extension/autofill-success",
    url: parsed.data.url,
  });

  if (parsed.data.templateId) {
    await Template.findByIdAndUpdate(parsed.data.templateId, {
      $inc: { usageCount: 1 },
      $set: { lastUsedAt: new Date() },
    });
  }
  await ExtensionLog.create({
    userId: auth.session.id,
    platform: parsed.data.platform,
    action: "autofill_success",
    success: true,
    metadata: { url: parsed.data.url, listingId: listing._id },
  });

  return ok({ listing, usage: usageResult.snapshot });
}
