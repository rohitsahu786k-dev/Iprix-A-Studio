import { z } from "zod";
import { ok, fail, parseBody } from "@/lib/api";
import { findUserByEmail, setSession, toSessionUser, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const limited = rateLimit(request, "auth:login", 10, 60_000);
  if (limited) return limited;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  const user = await findUserByEmail(parsed.data.email);
  if (!user || user.suspended) return fail("Invalid credentials", 401);
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return fail("Invalid credentials", 401);
  const sessionUser = toSessionUser(user);
  await setSession(sessionUser);
  return ok({ user: sessionUser });
}
