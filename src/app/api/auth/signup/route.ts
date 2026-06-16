import crypto from "crypto";
import { z } from "zod";
import { ok, fail, parseBody } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { hashPassword, setSession, toSessionUser } from "@/lib/auth";
import { User, Notification } from "@/models";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const limited = rateLimit(request, "auth:signup", 6, 60_000);
  if (limited) return limited;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const email = parsed.data.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) return fail("Account already exists", 409);
  const verifyToken = crypto.randomBytes(24).toString("hex");
  const user = await User.create({
    name: parsed.data.name,
    email,
    passwordHash: await hashPassword(parsed.data.password),
    role: "user",
    plan: "free",
    aiCredits: 10,
    verifyTokenHash: crypto.createHash("sha256").update(verifyToken).digest("hex"),
  });
  await Notification.create({
    userId: user._id,
    title: "Welcome to A+ Studio",
    message: "Your seller automation workspace is ready.",
    type: "success",
  });
  await setSession(toSessionUser(user));
  return ok({ user: toSessionUser(user), verifyToken }, { status: 201 });
}
