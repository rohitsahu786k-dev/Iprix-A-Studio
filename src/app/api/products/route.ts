import { fail, requireApiUser } from "@/lib/api";
import { createItem, productSchema, resourceHandlers } from "@/lib/crud";
import { connectDb } from "@/lib/db";
import { normalizePlan } from "@/lib/listing-usage";
import { planProductLimits } from "@/lib/plans";
import { Product, User } from "@/models";

const handlers = resourceHandlers(Product, productSchema);

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  const limit = planProductLimits[normalizePlan(user.plan)];
  if (limit !== -1) {
    const count = await Product.countDocuments({ userId: auth.session.id });
    if (count >= limit) {
      return fail("Free product library limit reached. Upgrade to save more products.", 402, {
        code: "product_limit_reached",
      });
    }
  }
  return createItem(request, Product, productSchema, auth.session);
}
