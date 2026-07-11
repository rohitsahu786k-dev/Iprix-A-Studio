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
  const trendStart = new Date();
  trendStart.setHours(0, 0, 0, 0);
  trendStart.setDate(1);
  trendStart.setMonth(trendStart.getMonth() - 5);

  const [templates, products, listings, keywordReports, extensionLogs, recentListings] = await Promise.all([
    Template.countDocuments({ userId: auth.session.id }),
    Product.countDocuments({ userId: auth.session.id }),
    Listing.countDocuments({ userId: auth.session.id }),
    KeywordResearch.countDocuments({ userId: auth.session.id }),
    ExtensionLog.countDocuments({ userId: auth.session.id, success: true }),
    Listing.find({ userId: auth.session.id, createdAt: { $gte: trendStart } })
      .select("createdAt platform status aiScore")
      .lean(),
  ]);

  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(trendStart);
    date.setMonth(date.getMonth() + index);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString("en-IN", { month: "short" }),
      value: 0,
    };
  });
  const statusBreakdown: Record<string, number> = { draft: 0, generated: 0, autofilled: 0, exported: 0, failed: 0 };
  const platformBreakdown: Record<string, number> = { meesho: 0, flipkart: 0, amazon: 0 };
  let scoreTotal = 0;
  let scoredListings = 0;

  for (const listing of recentListings as Array<{ createdAt?: Date; platform?: string; status?: string; aiScore?: { total?: number } }>) {
    const createdAt = listing.createdAt ? new Date(listing.createdAt) : null;
    if (createdAt) {
      const bucket = monthBuckets.find((item) => item.key === `${createdAt.getFullYear()}-${createdAt.getMonth()}`);
      if (bucket) bucket.value += 1;
    }
    const status = listing.status || "draft";
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    const platform = listing.platform || "meesho";
    platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
    const score = Number(listing.aiScore?.total);
    if (Number.isFinite(score)) {
      scoreTotal += score;
      scoredListings += 1;
    }
  }
  const listingUsage = getListingUsageSnapshot(user);
  const keywordUsage = getKeywordResearchUsageSnapshot(user);
  await user.save();
  return ok({
    user: auth.session,
    counts: { templates, products, listings, keywordReports, extensionLogs },
    usage: { listings: listingUsage, keywords: keywordUsage },
    analytics: {
      listingTrend: monthBuckets.map(({ label, value }) => ({ label, value })),
      workspaceMix: [
        { label: "Listings", value: listings },
        { label: "Products", value: products },
        { label: "Templates", value: templates },
        { label: "Keywords", value: keywordReports },
      ],
      statusBreakdown,
      platformBreakdown,
      averageListingScore: scoredListings ? Math.round(scoreTotal / scoredListings) : 0,
    },
  });
}
