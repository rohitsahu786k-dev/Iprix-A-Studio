import crypto from "crypto";
import { z } from "zod";
import { fail, ok, parseBody } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { User } from "@/models";
import { sendMailWithLog } from "@/lib/email/sender";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const user = await User.findOne({
    email: parsed.data.email.toLowerCase(),
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: { $gt: new Date() },
  });
  if (!user) return fail("Invalid or expired reset token", 400);
  user.set({
    passwordHash: await hashPassword(parsed.data.password),
    resetTokenHash: undefined,
    resetTokenExpiresAt: undefined,
  });
  await user.save();

  // Send password changed notification
  await sendMailWithLog(user._id, user.email, "password_changed", {
    name: user.name,
  });

  return ok({ message: "Password updated" });
}

