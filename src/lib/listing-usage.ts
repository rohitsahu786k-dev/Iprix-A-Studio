import { planKeywordResearchLimits, planListingLimits, type PlanSlug } from "@/lib/plans";
import { AIUsageLog, KeywordResearch, Listing, Notification, UsageLog } from "@/models";
import { sendMailWithLog } from "@/lib/email/sender";

type UserDoc = {
  _id: unknown;
  email: string;
  name: string;
  plan?: string;
  freeListingsLimit?: number;
  freeListingsUsed?: number;
  monthlyListingsUsed?: number;
  monthlyListingsLimit?: number;
  monthlyListingsPeriod?: string;
  freeKeywordResearchLimit?: number;
  freeKeywordResearchUsed?: number;
  monthlyKeywordResearchUsed?: number;
  monthlyKeywordResearchLimit?: number;
  monthlyKeywordResearchPeriod?: string;
  lastUsageResetAt?: Date;
  subscriptionStatus?: string;
  currentPeriodEnd?: Date | string;
  set?: (value: Record<string, unknown>) => void;
  save?: () => Promise<unknown>;
};


export type ListingUsageSnapshot = {
  plan: PlanSlug;
  freeListingsUsed: number;
  freeListingsLimit: number;
  monthlyListingsUsed: number;
  monthlyListingsLimit: number;
  used: number;
  limit: number;
  remaining: number;
  canCreateListing: boolean;
  upgradeRequired: boolean;
  period: string;
  label: string;
};

export type KeywordUsageSnapshot = {
  plan: PlanSlug;
  freeKeywordResearchUsed: number;
  freeKeywordResearchLimit: number;
  monthlyKeywordResearchUsed: number;
  monthlyKeywordResearchLimit: number;
  used: number;
  limit: number;
  remaining: number;
  canCreateReport: boolean;
  upgradeRequired: boolean;
  period: string;
  label: string;
};

export function normalizePlan(plan?: string): PlanSlug {
  return ["seller", "growth", "pro", "agency"].includes(plan || "") ? (plan as PlanSlug) : "free";
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

export function getPlanListingLimit(plan?: string) {
  return planListingLimits[normalizePlan(plan)];
}

export function getPlanKeywordResearchLimit(plan?: string) {
  return planKeywordResearchLimits[normalizePlan(plan)];
}

export function getPlanAIConfig(plan?: string) {
  const normalized = normalizePlan(plan);
  return {
    plan: normalized,
    listingLimit: planListingLimits[normalized],
    keywordResearchLimit: planKeywordResearchLimits[normalized],
    titleVariations: normalized === "free" || normalized === "seller" ? 1 : normalized === "growth" ? 3 : 5,
    csvExport: ["growth", "pro", "agency"].includes(normalized),
    bulkGeneration: ["pro", "agency"].includes(normalized),
  };
}

/**
 * Lazily expires a paid plan once its billing period is over. Runs inside
 * resetMonthlyUsageIfNeeded, which every allowance/consume path calls first —
 * so an expired ₹199/month user cannot keep drawing a fresh monthly quota
 * forever off a single payment. Users with no currentPeriodEnd (legacy /
 * admin-granted plans) are left untouched.
 */
export function expirePlanIfNeeded(user: UserDoc) {
  const plan = normalizePlan(user.plan);
  if (plan === "free" || !user.currentPeriodEnd) return;
  const periodEnd = new Date(user.currentPeriodEnd);
  if (Number.isNaN(periodEnd.getTime()) || periodEnd.getTime() > Date.now()) return;
  const updates: Record<string, unknown> = {
    plan: "free",
    subscriptionStatus: "expired",
    monthlyListingsLimit: 0,
    monthlyKeywordResearchLimit: 0,
  };
  user.set?.(updates);
  Object.assign(user, updates);
}

export function resetMonthlyUsageIfNeeded(user: UserDoc) {
  expirePlanIfNeeded(user);
  const plan = normalizePlan(user.plan);
  const period = currentPeriod();
  const updates: Record<string, unknown> = {};

  if (!user.freeListingsLimit) updates.freeListingsLimit = planListingLimits.free;
  if (typeof user.freeListingsUsed !== "number") updates.freeListingsUsed = 0;
  if (!user.freeKeywordResearchLimit) updates.freeKeywordResearchLimit = planKeywordResearchLimits.free;
  if (typeof user.freeKeywordResearchUsed !== "number") updates.freeKeywordResearchUsed = 0;

  if (plan !== "free" && user.monthlyListingsPeriod !== period) {
    updates.monthlyListingsPeriod = period;
    updates.monthlyListingsUsed = 0;
    updates.lastUsageResetAt = new Date();
  }

  if (plan !== "free" && user.monthlyKeywordResearchPeriod !== period) {
    updates.monthlyKeywordResearchPeriod = period;
    updates.monthlyKeywordResearchUsed = 0;
    updates.lastUsageResetAt = new Date();
  }

  if (plan === "free") {
    updates.monthlyListingsLimit = 0;
    updates.monthlyKeywordResearchLimit = 0;
    if (!user.monthlyListingsPeriod) updates.monthlyListingsPeriod = period;
    if (!user.monthlyKeywordResearchPeriod) updates.monthlyKeywordResearchPeriod = period;
  } else {
    updates.monthlyListingsLimit = getPlanListingLimit(plan);
    updates.monthlyKeywordResearchLimit = getPlanKeywordResearchLimit(plan);
  }

  if (Object.keys(updates).length) {
    user.set?.(updates);
    Object.assign(user, updates);
  }
}

export const syncUserListingDefaults = resetMonthlyUsageIfNeeded;

export function getListingUsageSnapshot(user: UserDoc): ListingUsageSnapshot {
  resetMonthlyUsageIfNeeded(user);
  const plan = normalizePlan(user.plan);
  const freeLimit = Number(user.freeListingsLimit || planListingLimits.free);
  const freeUsed = Number(user.freeListingsUsed || 0);
  const monthlyLimit = plan === "free" ? 0 : Number(user.monthlyListingsLimit || getPlanListingLimit(plan));
  const monthlyUsed = Number(user.monthlyListingsUsed || 0);
  const used = plan === "free" ? freeUsed : monthlyUsed;
  const limit = plan === "free" ? freeLimit : monthlyLimit;
  const remaining = limit === -1 ? -1 : Math.max(0, limit - used);

  return {
    plan,
    freeListingsUsed: freeUsed,
    freeListingsLimit: freeLimit,
    monthlyListingsUsed: monthlyUsed,
    monthlyListingsLimit: monthlyLimit,
    used,
    limit,
    remaining,
    canCreateListing: limit === -1 || used < limit,
    upgradeRequired: limit !== -1 && used >= limit,
    period: String(user.monthlyListingsPeriod || currentPeriod()),
    label:
      plan === "free"
        ? `${freeUsed} of ${freeLimit} free AI listings used`
        : `${monthlyUsed} of ${monthlyLimit} listings used this month`,
  };
}

export function getKeywordResearchUsageSnapshot(user: UserDoc): KeywordUsageSnapshot {
  resetMonthlyUsageIfNeeded(user);
  const plan = normalizePlan(user.plan);
  const freeLimit = Number(user.freeKeywordResearchLimit || planKeywordResearchLimits.free);
  const freeUsed = Number(user.freeKeywordResearchUsed || 0);
  const monthlyLimit = plan === "free" ? 0 : Number(user.monthlyKeywordResearchLimit || getPlanKeywordResearchLimit(plan));
  const monthlyUsed = Number(user.monthlyKeywordResearchUsed || 0);
  const used = plan === "free" ? freeUsed : monthlyUsed;
  const limit = plan === "free" ? freeLimit : monthlyLimit;
  const remaining = limit === -1 ? -1 : Math.max(0, limit - used);

  return {
    plan,
    freeKeywordResearchUsed: freeUsed,
    freeKeywordResearchLimit: freeLimit,
    monthlyKeywordResearchUsed: monthlyUsed,
    monthlyKeywordResearchLimit: monthlyLimit,
    used,
    limit,
    remaining,
    canCreateReport: limit === -1 || used < limit,
    upgradeRequired: limit !== -1 && used >= limit,
    period: String(user.monthlyKeywordResearchPeriod || currentPeriod()),
    label:
      plan === "free"
        ? `${freeUsed} of ${freeLimit} free keyword reports used`
        : `${monthlyUsed} of ${monthlyLimit} keyword reports used this month`,
  };
}

export async function checkListingAllowance(user: UserDoc) {
  const snapshot = getListingUsageSnapshot(user);
  if (!snapshot.canCreateListing) {
    return {
      allowed: false,
      snapshot,
      error: snapshot.plan === "free" ? "upgrade_required" : "plan_upgrade_required",
    };
  }
  return { allowed: true, snapshot, error: null };
}

export const checkAIListingAllowance = checkListingAllowance;

export async function checkKeywordResearchAllowance(user: UserDoc) {
  const snapshot = getKeywordResearchUsageSnapshot(user);
  if (!snapshot.canCreateReport) {
    return {
      allowed: false,
      snapshot,
      error: snapshot.plan === "free" ? "upgrade_required" : "plan_upgrade_required",
    };
  }
  return { allowed: true, snapshot, error: null };
}

export async function consumeListingUsage(
  user: UserDoc,
  listingId: unknown,
  source: string,
  metadata: Record<string, unknown> = {},
) {
  resetMonthlyUsageIfNeeded(user);
  const listing = listingId ? await Listing.findById(String(listingId)) : null;
  if (listing?.usageCounted) {
    return { consumed: false, snapshot: getListingUsageSnapshot(user) };
  }

  const before = getListingUsageSnapshot(user);
  if (!before.canCreateListing) {
    return { consumed: false, snapshot: before, blocked: true };
  }

  const plan = normalizePlan(user.plan);
  if (plan === "free") {
    user.set?.({ freeListingsUsed: before.freeListingsUsed + 1 });
    user.freeListingsUsed = before.freeListingsUsed + 1;
  } else {
    user.set?.({ monthlyListingsUsed: before.monthlyListingsUsed + 1 });
    user.monthlyListingsUsed = before.monthlyListingsUsed + 1;
  }
  await user.save?.();

  if (listing) {
    listing.set({ usageCounted: true });
    await listing.save();
  }

  const after = getListingUsageSnapshot(user);
  await UsageLog.create({
    userId: user._id,
    listingId: listing?._id,
    plan,
    source,
    action: "consume_listing_usage",
    beforeUsed: before.used,
    afterUsed: after.used,
    limit: after.limit,
    metadata,
  });

  if (after.limit !== -1 && after.limit > 0) {
    const ratio = after.used / after.limit;
    if (ratio >= 1 || ratio >= 0.8) {
      await Notification.create({
        userId: user._id,
        type: ratio >= 1 ? "upgrade" : "usage",
        title: ratio >= 1 ? "Listing limit reached" : "Listing limit almost reached",
        message:
          ratio >= 1
            ? "Upgrade to continue generating, saving and autofilling AI listings."
            : "You have used most of your listing quota. Upgrade when you are ready to create more.",
      });
    }

    // Trigger email alerts at exact milestones to prevent spamming
    const isExact80 = after.used === Math.floor(after.limit * 0.8);
    const isExact100 = after.used === after.limit;
    if (isExact100) {
      await sendMailWithLog(String(user._id), user.email, "quota_warning_100", {
        name: user.name,
        used: after.used,
        limit: after.limit,
      });
    } else if (isExact80) {
      await sendMailWithLog(String(user._id), user.email, "quota_warning_80", {
        name: user.name,
        used: after.used,
        limit: after.limit,
      });
    }
  }

  return { consumed: true, snapshot: after };
}

export const consumeAIListingUsage = consumeListingUsage;

export async function consumeKeywordResearchUsage(
  user: UserDoc,
  reportId: unknown,
  source: string,
  metadata: Record<string, unknown> = {},
) {
  resetMonthlyUsageIfNeeded(user);
  const report = reportId ? await KeywordResearch.findById(String(reportId)) : null;
  if (report?.usageCounted) {
    return { consumed: false, snapshot: getKeywordResearchUsageSnapshot(user) };
  }

  const before = getKeywordResearchUsageSnapshot(user);
  if (!before.canCreateReport) {
    return { consumed: false, snapshot: before, blocked: true };
  }

  const plan = normalizePlan(user.plan);
  if (plan === "free") {
    user.set?.({ freeKeywordResearchUsed: before.freeKeywordResearchUsed + 1 });
    user.freeKeywordResearchUsed = before.freeKeywordResearchUsed + 1;
  } else {
    user.set?.({ monthlyKeywordResearchUsed: before.monthlyKeywordResearchUsed + 1 });
    user.monthlyKeywordResearchUsed = before.monthlyKeywordResearchUsed + 1;
  }
  await user.save?.();

  if (report) {
    report.set({ usageCounted: true });
    await report.save();
  }

  const after = getKeywordResearchUsageSnapshot(user);
  await UsageLog.create({
    userId: user._id,
    plan,
    source,
    action: "consume_keyword_research_usage",
    usageType: "keyword_research",
    beforeUsed: before.used,
    afterUsed: after.used,
    limit: after.limit,
    metadata,
  });

  if (after.limit !== -1 && after.limit > 0) {
    const ratio = after.used / after.limit;
    if (ratio >= 1 || ratio >= 0.8) {
      await Notification.create({
        userId: user._id,
        type: ratio >= 1 ? "upgrade" : "usage",
        title: ratio >= 1 ? "Keyword research limit reached" : "Keyword research limit almost reached",
        message:
          ratio >= 1
            ? "Upgrade to continue generating keyword research reports."
            : "You have used most of your keyword research quota.",
      });
    }
  }

  return { consumed: true, snapshot: after };
}

export async function createAIUsageLog(data: Record<string, unknown>) {
  return AIUsageLog.create({
    creditsConsumed: 0,
    status: "success",
    ...data,
  });
}
