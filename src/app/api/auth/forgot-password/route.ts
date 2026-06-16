import crypto from "crypto";
import { z } from "zod";
import { ok, parseBody } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { User } from "@/models";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const limited = rateLimit(request, "auth:forgot", 6, 60_000);
  if (limited) return limited;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const token = crypto.randomBytes(24).toString("hex");
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (user) {
    user.set({
      resetTokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      resetTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 30),
    });
    await user.save();
  }
  return ok({
    message: "If that email exists, reset instructions have been prepared.",
    resetToken: process.env.NODE_ENV === "production" ? undefined : token,
  });
}
