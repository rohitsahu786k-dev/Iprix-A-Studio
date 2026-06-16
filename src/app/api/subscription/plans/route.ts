import { ok } from "@/lib/api";
import { pricingPlans } from "@/lib/plans";

export function GET() {
  return ok({ plans: pricingPlans });
}
