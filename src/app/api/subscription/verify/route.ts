import crypto from "crypto";
import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { getPlanKeywordResearchLimit, getPlanListingLimit } from "@/lib/listing-usage";
import { Payment, User } from "@/models";
import { sendMailWithLog } from "@/lib/email/sender";

const schema = z.object({
  razorpay_order_id: z.string().min(5),
  razorpay_payment_id: z.string().min(5),
  razorpay_signature: z.string().min(10),
});

function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const env = getServerEnv();
  const digest = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: Request) {
  const auth = await requireApiUser(undefined, request);
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;

  if (
    !verifyCheckoutSignature(
      parsed.data.razorpay_order_id,
      parsed.data.razorpay_payment_id,
      parsed.data.razorpay_signature,
    )
  ) {
    return fail("Invalid payment signature", 401);
  }

  await connectDb();
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: parsed.data.razorpay_order_id, userId: auth.session.id },
    {
      razorpayPaymentId: parsed.data.razorpay_payment_id,
      status: "captured",
    },
    { returnDocument: "after" },
  );
  if (!payment) return fail("Payment order not found", 404);

  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  user.set({
    plan: payment.plan,
    subscriptionStatus: "active",
    monthlyListingsUsed: 0,
    monthlyListingsLimit: getPlanListingLimit(payment.plan),
    monthlyListingsPeriod: new Date().toISOString().slice(0, 7),
    monthlyKeywordResearchUsed: 0,
    monthlyKeywordResearchLimit: getPlanKeywordResearchLimit(payment.plan),
    monthlyKeywordResearchPeriod: new Date().toISOString().slice(0, 7),
  });
  await user.save();

  await sendMailWithLog(String(user._id), user.email, "payment_success", {
    name: user.name,
    amount: Number(payment.amount || 0) / 100,
  });
  await sendMailWithLog(String(user._id), user.email, "subscription_created", {
    name: user.name,
    plan: payment.plan,
  });

  return ok({ payment, user: { plan: user.plan, subscriptionStatus: user.subscriptionStatus } });
}
