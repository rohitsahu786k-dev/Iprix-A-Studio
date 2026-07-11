import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { Listing } from "@/models";

const patchSchema = z.object({
  title: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  sku: z.string().max(160).optional(),
  brand: z.string().max(160).optional(),
  category: z.string().max(240).optional(),
  platform: z.enum(["meesho", "flipkart", "amazon"]).optional(),
  status: z.enum(["draft", "generated", "autofilled", "exported", "failed"]).optional(),
  price: z.coerce.number().nonnegative().optional(),
  mrp: z.coerce.number().nonnegative().optional(),
  keywords: z.array(z.string().max(120)).max(100).optional(),
  bulletPoints: z.array(z.string().max(500)).max(30).optional(),
});

async function findOwnedListing(id: string, session: { id: string; role: string }) {
  await connectDb();
  const listing = await Listing.findById(id);
  if (!listing) return null;
  if (session.role !== "admin" && String(listing.userId) !== session.id) return "forbidden";
  return listing;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  const listing = await findOwnedListing(id, auth.session);
  if (!listing) return fail("Not found", 404);
  if (listing === "forbidden") return fail("Forbidden", 403);
  return ok({ item: listing, listing });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  const parsed = await parseBody(request, patchSchema);
  if (parsed.response) return parsed.response;
  const listing = await findOwnedListing(id, auth.session);
  if (!listing) return fail("Not found", 404);
  if (listing === "forbidden") return fail("Forbidden", 403);
  listing.set(parsed.data);
  await listing.save();
  return ok({ item: listing, listing });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  const listing = await findOwnedListing(id, auth.session);
  if (!listing) return fail("Not found", 404);
  if (listing === "forbidden") return fail("Forbidden", 403);
  await listing.deleteOne();
  return ok({ deleted: true });
}
