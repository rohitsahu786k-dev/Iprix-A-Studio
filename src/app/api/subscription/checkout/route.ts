import crypto from "crypto";
import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { getServerEnv, isConfigured } from "@/lib/env";
import { pricingPlans } from "@/lib/plans";
import { connectDb } from "@/lib/db";
import { Payment } from "@/models";

const schema = z.object({ 
  plan: z.string().min(2),
  billing: z.enum(["monthly", "yearly"]).optional().default("monthly")
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  const plan = pricingPlans.find((item) => item.slug === parsed.data.plan);
  if (!plan) return fail("Unknown plan", 404);
  await connectDb();

  const isYearly = parsed.data.billing === "yearly";
  const monthlyRate = plan.monthlyPrice === 0 
    ? 0 
    : isYearly 
      ? Math.round(plan.monthlyPrice * 0.8) 
      : plan.monthlyPrice;
  const totalAmount = isYearly ? monthlyRate * 12 : monthlyRate;
  const amountInPaise = totalAmount * 100;

  if (!isConfigured("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET")) {
    const payment = await Payment.create({
      userId: auth.session.id,
      amount: amountInPaise,
      status: "configuration_required",
      plan: plan.slug,
    });
    return fail("Razorpay credentials are not configured", 501, { payment });
  }

  const env = getServerEnv();
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: "INR",
      receipt: `aps_${auth.session.id}_${Date.now()}`,
      notes: { userId: auth.session.id, plan: plan.slug, billing: parsed.data.billing },
    }),
  });
  if (!response.ok) return fail("Razorpay order creation failed", 502);
  const order = await response.json();
  const payment = await Payment.create({
    userId: auth.session.id,
    razorpayOrderId: order.id,
    amount: order.amount,
    status: order.status,
    plan: plan.slug,
  });
  return ok({ order, payment, keyId: env.RAZORPAY_KEY_ID });
}

export function verifyRazorpaySignature(body: string, signature: string) {
  const env = getServerEnv();
  const digest = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
