import { fail, ok } from "@/lib/api";
import { isConfigured } from "@/lib/env";
import { connectDb } from "@/lib/db";
import { getPlanKeywordResearchLimit, getPlanListingLimit } from "@/lib/listing-usage";
import { Payment, User } from "@/models";
import { verifyRazorpaySignature } from "../checkout/route";
import { sendMailWithLog } from "@/lib/email/sender";

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
    if (payment) {
      if (payment.status === "captured" && payment.userId) {
        const user = await User.findById(payment.userId);
        if (user) {
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

          // Send payment success notification
          await sendMailWithLog(user._id, user.email, "payment_success", {
            name: user.name,
            amount: payment.amount / 100, // convert paise to INR for display
          });

          // Send subscription created notification
          await sendMailWithLog(user._id, user.email, "subscription_created", {
            name: user.name,
            plan: payment.plan,
          });
        }
      } else if ((payment.status === "failed" || paymentEntity?.status === "failed") && payment.userId) {
        const user = await User.findById(payment.userId);
        if (user) {
          // Send payment failed notification
          await sendMailWithLog(user._id, user.email, "payment_failed", {
            name: user.name,
            amount: payment.amount / 100,
          });
        }
      }
    }
  }
  return ok({ received: true });
}

