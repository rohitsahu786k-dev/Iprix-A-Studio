import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { getListingUsageSnapshot } from "@/lib/listing-usage";
import { ExtensionLog, User } from "@/models";

const schema = z.object({
  platform: z.string().optional().default("unknown"),
  url: z.string().optional().default(""),
  action: z.string().optional().default("autofill"),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  const usage = getListingUsageSnapshot(user);
  await Promise.all([
    user.save(),
    ExtensionLog.create({
      userId: auth.session.id,
      platform: parsed.data.platform,
      action: `detect_allowance:${parsed.data.action}`,
      success: usage.canCreateListing,
      metadata: { url: parsed.data.url, usage },
    }),
  ]);
  return ok({
    canAutofill: usage.canCreateListing,
    canGenerate: usage.canCreateListing,
    upgradeRequired: usage.upgradeRequired,
    usage,
  });
}
