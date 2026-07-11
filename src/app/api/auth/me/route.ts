import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { getSessionFromRequest, setSession, toSessionUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { User } from "@/models";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  gstin: z.string().trim().toUpperCase().max(15).optional().default(""),
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user from either:
 *   1. Cookie-based session (website)
 *   2. Bearer token in Authorization header (extension)
 */
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return fail("Authentication required", 401);
  return ok(session);
}

export async function PATCH(request: Request) {
  const auth = await requireApiUser(undefined, request);
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, profileSchema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  user.name = parsed.data.name;
  user.gstin = parsed.data.gstin;
  await user.save();
  const session = toSessionUser(user);
  await setSession(session);
  return ok({ user: session, profile: { name: user.name, email: user.email, gstin: user.gstin || "", plan: user.plan } });
}
