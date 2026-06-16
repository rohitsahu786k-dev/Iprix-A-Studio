import { fail, requireApiUser } from "@/lib/api";
import { createItem, resourceHandlers, templateSchema } from "@/lib/crud";
import { connectDb } from "@/lib/db";
import { normalizePlan } from "@/lib/listing-usage";
import { planTemplateLimits } from "@/lib/plans";
import { Template, User } from "@/models";

const handlers = resourceHandlers(Template, templateSchema);

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  const limit = planTemplateLimits[normalizePlan(user.plan)];
  if (limit !== -1) {
    const count = await Template.countDocuments({ userId: auth.session.id });
    if (count >= limit) {
      return fail("Free template limit reached. Upgrade to save unlimited templates.", 402, {
        code: "template_limit_reached",
      });
    }
  }
  return createItem(request, Template, templateSchema, auth.session);
}
