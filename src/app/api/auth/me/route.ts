import { ok, fail } from "@/lib/api";
import { getSessionFromRequest } from "@/lib/auth";

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
