import crypto from "crypto";
import { z } from "zod";
import { ok, parseBody } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { User } from "@/models";
import { rateLimit } from "@/lib/rate-limit";
import { sendMailWithLog } from "@/lib/email/sender";
import { getServerEnv } from "@/lib/env";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const limited = rateLimit(request, "auth:forgot", 6, 60_000);
  if (limited) return limited;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const token = crypto.randomBytes(24).toString("hex");
  const emailLower = parsed.data.email.toLowerCase();
  const user = await User.findOne({ email: emailLower });
  if (user) {
    user.set({
      resetTokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      resetTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 30),
    });
    await user.save();

    // Trigger forgot_password email
    const env = getServerEnv();
    const appUrl = env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com";
    const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(emailLower)}`;
    await sendMailWithLog(user._id, emailLower, "forgot_password", {
      name: user.name,
      url: resetUrl,
    });
  }
  return ok({
    message: "If that email exists, reset instructions have been prepared.",
    resetToken: process.env.NODE_ENV === "production" ? undefined : token,
  });
}

