import crypto from "crypto";
import { z } from "zod";
import { ok, fail, parseBody } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { createToken, hashPassword, setSession, toSessionUser } from "@/lib/auth";
import { User, Notification } from "@/models";
import { rateLimit } from "@/lib/rate-limit";
import { sendMailWithLog } from "@/lib/email/sender";
import { getServerEnv } from "@/lib/env";

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

  // Trigger verification email
  const env = getServerEnv();
  const appUrl = env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com";
  const verificationUrl = `${appUrl}/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`;
  await sendMailWithLog(user._id, email, "verification", {
    name: user.name,
    url: verificationUrl,
  });

  await setSession(toSessionUser(user));
  const token = createToken(toSessionUser(user));
  return ok({ user: toSessionUser(user), token, verifyToken }, { status: 201 });
}

