import crypto from "crypto";
import { z } from "zod";
import { fail, ok, parseBody } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { User } from "@/models";

const schema = z.object({ email: z.string().email(), token: z.string().min(10) });

export async function POST(request: Request) {
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const verifyTokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const user = await User.findOne({ email: parsed.data.email.toLowerCase(), verifyTokenHash });
  if (!user) return fail("Invalid verification token", 400);
  user.set({ emailVerified: true, verifyTokenHash: undefined });
  await user.save();
  return ok({ verified: true });
}
