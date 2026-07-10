import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { generateWithOpenAI } from "@/lib/openai";
import { checkListingAllowance, consumeListingUsage } from "@/lib/listing-usage";
import { rateLimit } from "@/lib/rate-limit";
import { Listing, Product, SmartListingBatch, User } from "@/models";

const schema = z.object({
  platform: z.string().default("meesho"),
  productIds: z.array(z.string()).min(1).max(100),
  templateId: z.string().optional(),
});

export async function POST(request: Request) {
  const limited = rateLimit(request, "ai:smart-listing", 6, 60_000);
  if (limited) return limited;
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  const products = await Product.find({ _id: { $in: parsed.data.productIds }, userId: auth.session.id });
  if (!products.length) return fail("No products found", 404);

  const listings = [];
  let blocked = 0;
  for (const product of products) {
    // Each generated listing consumes one credit; stop as soon as the plan
    // quota runs out instead of generating the whole batch unmetered.
    const allowance = await checkListingAllowance(user);
    if (!allowance.allowed) {
      blocked = products.length - listings.length;
      break;
    }
    const output = await generateWithOpenAI(
      "smart-listing",
      `Create title, description, SKU and keywords for ${parsed.data.platform}. Product: ${JSON.stringify(product)}`,
    );
    const listing = await Listing.create({
      userId: auth.session.id,
      productId: product._id,
      templateId: parsed.data.templateId,
      platform: parsed.data.platform,
      source: "ai_generated",
      status: "generated",
      title: product.title,
      description: output.text,
      sku: `APS-${String(product._id).slice(-6).toUpperCase()}`,
      keywords: [],
      usageCounted: false,
      payload: { aiOutput: output.text },
    });
    await consumeListingUsage(user, listing._id, "smart_listing", {
      route: "/api/smart-listings",
      productId: String(product._id),
    });
    listings.push(listing);
  }

  if (!listings.length) {
    return fail("Listing limit reached. Upgrade to generate smart listings.", 402);
  }

  const batch = await SmartListingBatch.create({
    userId: auth.session.id,
    platform: parsed.data.platform,
    productIds: parsed.data.productIds,
    listingIds: listings.map((listing) => listing._id),
    status: "generated",
  });
  return ok(
    {
      batch,
      listings,
      skippedForQuota: blocked,
      message: blocked ? `${blocked} product(s) skipped — listing quota reached.` : undefined,
    },
    { status: 201 },
  );
}
