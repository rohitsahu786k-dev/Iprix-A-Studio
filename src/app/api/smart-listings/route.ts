import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { generateWithOpenAI } from "@/lib/openai";
import { Listing, Product, SmartListingBatch } from "@/models";

const schema = z.object({
  platform: z.string().default("meesho"),
  productIds: z.array(z.string()).min(1),
  templateId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const products = await Product.find({ _id: { $in: parsed.data.productIds }, userId: auth.session.id });
  if (!products.length) return fail("No products found", 404);
  const listings = [];
  for (const product of products) {
    const output = await generateWithOpenAI(
      "smart-listing",
      `Create title, description, SKU and keywords for ${parsed.data.platform}. Product: ${JSON.stringify(product)}`,
    );
    const listing = await Listing.create({
      userId: auth.session.id,
      productId: product._id,
      templateId: parsed.data.templateId,
      platform: parsed.data.platform,
      status: "generated",
      title: product.title,
      description: output.text,
      sku: `APS-${String(product._id).slice(-6).toUpperCase()}`,
      keywords: [],
      payload: { aiOutput: output.text },
    });
    listings.push(listing);
  }
  const batch = await SmartListingBatch.create({
    userId: auth.session.id,
    platform: parsed.data.platform,
    productIds: parsed.data.productIds,
    listingIds: listings.map((listing) => listing._id),
    status: "generated",
  });
  return ok({ batch, listings }, { status: 201 });
}
