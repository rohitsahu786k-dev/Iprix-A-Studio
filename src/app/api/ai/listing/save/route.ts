import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { checkAIListingAllowance, consumeAIListingUsage } from "@/lib/listing-usage";
import { Listing, User } from "@/models";

const schema = z.object({
  listingId: z.string().min(1),
  fields: z.record(z.string(), z.any()).optional().default({}),
  action: z.enum(["save", "extension", "export", "autofill"]).optional().default("save"),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;

  await connectDb();
  const [user, listing] = await Promise.all([
    User.findById(auth.session.id),
    Listing.findById(parsed.data.listingId),
  ]);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  if (!listing) return fail("Listing not found", 404);
  if (auth.session.role !== "admin" && String(listing.userId) !== auth.session.id) return fail("Forbidden", 403);

  if (!listing.usageCounted) {
    const allowance = await checkAIListingAllowance(user);
    if (!allowance.allowed) {
      return fail("You have used your free AI limit. Upgrade now to continue saving or using AI listings.", 402, {
        code: allowance.error,
        usage: allowance.snapshot,
      });
    }
  }

  listing.set({
    ...parsed.data.fields,
    status: parsed.data.action === "export" ? "exported" : parsed.data.action === "autofill" ? "autofilled" : "generated",
  });
  await listing.save();

  const usageResult = await consumeAIListingUsage(user, listing._id, `ai_listing_${parsed.data.action}`, {
    route: "/api/ai/listing/save",
    action: parsed.data.action,
  });

  return ok({ listing, usage: usageResult.snapshot });
}
