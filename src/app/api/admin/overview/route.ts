import { ok, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import {
  AIUsageLog,
  ContactInquiry,
  ExtensionLog,
  KeywordResearch,
  Listing,
  Payment,
  SupportTicket,
  User,
} from "@/models";

export async function GET() {
  const auth = await requireApiUser("admin");
  if (auth.response) return auth.response;
  await connectDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const [
    totalUsers,
    freeUsers,
    paidUsers,
    activeSubscriptions,
    paymentsToday,
    paymentsMonth,
    aiListings,
    keywordReports,
    nearLimit,
    hitLimit,
    extensionAutofills,
    failedAi,
    failedPayments,
    contactInquiries,
    supportTickets,
    recentUsers,
    recentAi,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ plan: "free" }),
    User.countDocuments({ plan: { $ne: "free" } }),
    User.countDocuments({ subscriptionStatus: "active" }),
    Payment.countDocuments({ createdAt: { $gte: today } }),
    Payment.countDocuments({ createdAt: { $gte: monthStart } }),
    Listing.countDocuments({ source: "ai_generated" }),
    KeywordResearch.countDocuments({}),
    User.countDocuments({
      plan: "free",
      $expr: { $gte: ["$freeListingsUsed", 3] },
      freeListingsUsed: { $lt: 5 },
    }),
    User.countDocuments({
      plan: "free",
      $or: [{ freeListingsUsed: { $gte: 5 } }, { freeKeywordResearchUsed: { $gte: 5 } }],
    }),
    ExtensionLog.countDocuments({ action: "autofill_success", success: true }),
    AIUsageLog.countDocuments({ status: "failed" }),
    Payment.countDocuments({ status: { $in: ["failed", "cancelled"] } }),
    ContactInquiry.countDocuments({}),
    SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
    User.find({}).sort({ createdAt: -1 }).limit(5),
    AIUsageLog.find({}).sort({ createdAt: -1 }).limit(5),
  ]);

  const capturedPayments = await Payment.find({ status: "captured", createdAt: { $gte: monthStart } });
  const mrrEstimate = capturedPayments.reduce((sum: number, payment: { amount?: number }) => sum + Number(payment.amount || 0), 0) / 100;

  return ok({
    stats: {
      totalUsers,
      freeUsers,
      paidUsers,
      activeSubscriptions,
      mrrEstimate,
      paymentsToday,
      paymentsMonth,
      aiListings,
      keywordReports,
      nearLimit,
      hitLimit,
      extensionAutofills,
      failedAi,
      failedPayments,
      contactInquiries,
      supportTickets,
    },
    recent: { users: recentUsers, ai: recentAi },
  });
}
