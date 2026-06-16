import { fail, ok, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { getKeywordResearchUsageSnapshot, getListingUsageSnapshot } from "@/lib/listing-usage";
import { ExtensionLog, KeywordResearch, Listing, Product, Template, User } from "@/models";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  const [templates, products, listings, keywordReports, extensionLogs] = await Promise.all([
    Template.countDocuments({ userId: auth.session.id }),
    Product.countDocuments({ userId: auth.session.id }),
    Listing.countDocuments({ userId: auth.session.id }),
    KeywordResearch.countDocuments({ userId: auth.session.id }),
    ExtensionLog.countDocuments({ userId: auth.session.id, success: true }),
  ]);
  const listingUsage = getListingUsageSnapshot(user);
  const keywordUsage = getKeywordResearchUsageSnapshot(user);
  await user.save();
  return ok({
    user: auth.session,
    counts: { templates, products, listings, keywordReports, extensionLogs },
    usage: { listings: listingUsage, keywords: keywordUsage },
  });
}
