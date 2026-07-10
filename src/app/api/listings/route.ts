import { z } from "zod";
import { fail, ok, parseBody, requireApiUser, userFilter } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { checkListingAllowance, consumeListingUsage } from "@/lib/listing-usage";
import { Listing, User } from "@/models";

const listingInputSchema = z.object({
  platform: z.string().min(2).default("meesho"),
  productId: z.string().optional(),
  templateId: z.string().optional(),
  source: z.enum(["ai_generated", "extension_capture", "manual", "csv", "product_library"]).default("manual"),
  status: z.enum(["draft", "generated", "autofilled", "exported", "failed"]).default("draft"),
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  shortDescription: z.string().optional().default(""),
  bulletPoints: z.array(z.string()).optional().default([]),
  keywords: z.array(z.string()).optional().default([]),
  sku: z.string().optional().default(""),
  category: z.string().optional().default(""),
  brand: z.string().optional().default(""),
  price: z.coerce.number().optional(),
  mrp: z.coerce.number().optional(),
  colors: z.array(z.string()).optional().default([]),
  sizes: z.array(z.string()).optional().default([]),
  material: z.string().optional().default(""),
  images: z.array(z.any()).optional().default([]),
  aiScore: z.record(z.string(), z.any()).optional().default({}),
  aiGenerated: z.boolean().optional().default(false),
  aiModel: z.string().optional().default(""),
  payload: z.record(z.string(), z.any()).optional().default({}),
  consumeUsage: z.boolean().optional(),
});

function shouldConsume(data: z.infer<typeof listingInputSchema>) {
  if (data.consumeUsage === true) return true;
  // Client may opt OUT only for inert drafts (CSV import, duplicate-as-draft).
  // Any status that implies the listing was used must consume — otherwise the
  // quota could be bypassed by passing consumeUsage: false from the client.
  if (data.consumeUsage === false && data.status === "draft") return false;
  return data.aiGenerated || ["generated", "autofilled", "exported"].includes(data.status);
}

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  await connectDb();
  const url = new URL(request.url);
  const filter: Record<string, unknown> = { ...userFilter(auth.session) };
  for (const key of ["platform", "source", "status"]) {
    const value = url.searchParams.get(key);
    if (value) filter[key] = value;
  }
  const [items, count] = await Promise.all([
    Listing.find(filter).sort({ createdAt: -1 }).limit(100),
    Listing.countDocuments(filter),
  ]);
  return ok({ items, count });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, listingInputSchema);
  if (parsed.response) return parsed.response;

  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);

  const consume = shouldConsume(parsed.data);
  if (consume) {
    const allowance = await checkListingAllowance(user);
    if (!allowance.allowed) {
      return fail("Upgrade required to create more AI-powered listings", 402, {
        code: allowance.error,
        usage: allowance.snapshot,
      });
    }
  }

  const listing = await Listing.create({
    ...parsed.data,
    userId: auth.session.id,
    usageCounted: false,
  });

  let usage = null;
  if (consume) {
    const result = await consumeListingUsage(user, listing._id, parsed.data.source, {
      route: "/api/listings",
      status: parsed.data.status,
    });
    usage = result.snapshot;
  }

  return ok({ item: listing, listing, usage }, { status: 201 });
}
