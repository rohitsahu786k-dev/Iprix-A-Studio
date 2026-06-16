import { fail, ok } from "@/lib/api";
import { isConfigured } from "@/lib/env";
import { connectDb } from "@/lib/db";
import { getPlanKeywordResearchLimit, getPlanListingLimit } from "@/lib/listing-usage";
import { Payment, User } from "@/models";
import { verifyRazorpaySignature } from "../checkout/route";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!isConfigured("RAZORPAY_WEBHOOK_SECRET") || !verifyRazorpaySignature(raw, signature)) {
    return fail("Invalid webhook signature", 401);
  }
  const event = JSON.parse(raw);
  await connectDb();
  const paymentEntity = event.payload?.payment?.entity;
  if (paymentEntity?.order_id) {
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: paymentEntity.order_id },
      { razorpayPaymentId: paymentEntity.id, status: paymentEntity.status },
      { returnDocument: "after" },
    );
    if (payment?.userId && payment.status === "captured") {
      await User.findByIdAndUpdate(payment.userId, {
        plan: payment.plan,
        subscriptionStatus: "active",
        monthlyListingsUsed: 0,
        monthlyListingsLimit: getPlanListingLimit(payment.plan),
        monthlyListingsPeriod: new Date().toISOString().slice(0, 7),
        monthlyKeywordResearchUsed: 0,
        monthlyKeywordResearchLimit: getPlanKeywordResearchLimit(payment.plan),
        monthlyKeywordResearchPeriod: new Date().toISOString().slice(0, 7),
      });
    }
  }
  return ok({ received: true });
}
